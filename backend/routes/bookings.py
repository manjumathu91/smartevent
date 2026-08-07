
from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db, limiter, cache
from models import Booking, Event, Notification, Payment, ActivityLog, User
from utils.validators import validate_booking_quantity
from utils.helpers import generate_qr_code, generate_ticket_pdf, generate_booking_reference
from datetime import datetime, timedelta
import io
import traceback

bookings_bp = Blueprint('bookings', __name__, url_prefix='/api/bookings')

# ==================== CREATE BOOKING ====================

@bookings_bp.route('/', methods=['POST'])
@jwt_required()
@limiter.limit('30 per hour')
def create_booking():
    """Create a new booking with pending payment"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Invalid request data'}), 400
        
        event_id = data.get('event_id')
        quantity = data.get('quantity', 1)
        
        if not event_id:
            return jsonify({'error': 'Event ID is required'}), 400
        
        event = Event.query.get(event_id)
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        # Check event status
        if event.status != 'approved':
            return jsonify({'error': 'Event is not available for booking'}), 400
        
        # Check availability
        if event.available_seats <= 0:
            return jsonify({'error': 'No seats available'}), 400
        
        # Validate quantity
        if not validate_booking_quantity(quantity, event.available_seats):
            return jsonify({'error': f'Maximum {current_app.config.get("MAX_BOOKING_QUANTITY", 10)} seats per booking'}), 400
        
        # Check for existing booking
        existing = Booking.query.filter_by(
            user_id=user_id,
            event_id=event_id,
            booking_status='pending'
        ).first()
        
        if existing:
            return jsonify({'error': 'You already have a pending booking for this event'}), 400
        
        # Check registration deadline
        if event.registration_deadline and event.registration_deadline < datetime.utcnow():
            return jsonify({'error': 'Registration deadline has passed'}), 400
        
        # Calculate total
        total_amount = float(event.price) * quantity
        
        # Generate booking reference
        booking_ref = generate_booking_reference()
        
        # Create booking with PENDING status
        booking = Booking(
            user_id=user_id,
            event_id=event_id,
            booking_reference=booking_ref,
            quantity=quantity,
            total_amount=total_amount,
            booking_status='pending',
            payment_status='pending'
        )
        
        # Generate ticket number
        ticket_number = f"TKT-{event.id}-{user_id}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        booking.ticket_number = ticket_number
        
        # DO NOT reduce seats yet - wait for payment
        # event.available_seats -= quantity
        
        db.session.add(booking)
        db.session.commit()
        
        # Generate QR Code
        try:
            qr_data = f"EVENT:{event.id}|BOOKING:{booking_ref}|USER:{user_id}|TICKET:{ticket_number}"
            qr_image = generate_qr_code(qr_data)
            booking.qr_code = qr_image
            db.session.commit()
        except Exception as qr_error:
            print(f"QR Code error: {str(qr_error)}")
        
        # Create notification
        try:
            notification = Notification(
                user_id=user_id,
                title="Payment Required 💳",
                message=f"Please complete payment for {event.title} to confirm your booking.",
                type='payment_required',
                link=f'/bookings/{booking.id}',
                icon='💳'
            )
            db.session.add(notification)
            db.session.commit()
        except Exception as notif_error:
            print(f"Notification error: {str(notif_error)}")
        
        return jsonify({
            'success': True,
            'message': 'Booking created. Please complete payment.',
            'booking': booking.to_dict()
        }), 201
        
    except Exception as e:
        print(f"Create booking error: {str(e)}")
        print(traceback.format_exc())
        db.session.rollback()
        return jsonify({'error': f'Failed to create booking: {str(e)}'}), 500

# ==================== GET BOOKINGS ====================

@bookings_bp.route('/', methods=['GET'])
@jwt_required()
def get_bookings():
    """Get user bookings with pagination and filtering"""
    try:
        user_id = get_jwt_identity()
        print(f"📋 Get bookings for user: {user_id}")
        
        # Get query parameters
        status = request.args.get('status', '')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # Validate pagination params
        if page < 1:
            page = 1
        if per_page < 1:
            per_page = 10
        if per_page > 100:
            per_page = 100
        
        # Build query - get bookings for this user
        query = Booking.query.filter_by(user_id=user_id)
        
        # Apply status filter if provided
        if status:
            query = query.filter_by(booking_status=status)
        
        # Order by booking date (newest first)
        query = query.order_by(Booking.booking_date.desc())
        
        # Paginate results
        paginated = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        print(f"📋 Found {paginated.total} bookings")
        
        # Convert bookings to dict safely
        bookings_list = []
        for booking in paginated.items:
            try:
                # Get event data safely
                event_data = None
                if booking.event:
                    try:
                        event_data = {
                            'id': booking.event.id,
                            'title': booking.event.title or 'Event',
                            'date': booking.event.date.isoformat() if booking.event.date else None,
                            'venue': booking.event.venue or '',
                            'city': booking.event.city or '',
                            'price': float(booking.event.price) if booking.event.price else 0,
                            'image_url': booking.event.image_url or '',
                            'banner_url': booking.event.banner_url or '',
                            'status': booking.event.status or 'draft'
                        }
                    except Exception as e:
                        print(f"⚠️ Event error for booking {booking.id}: {str(e)}")
                        event_data = {'id': booking.event_id, 'title': 'Event'}
                
                # Build booking dict
                booking_dict = {
                    'id': booking.id,
                    'user_id': booking.user_id,
                    'event_id': booking.event_id,
                    'booking_reference': booking.booking_reference or 'N/A',
                    'ticket_number': booking.ticket_number or 'N/A',
                    'quantity': booking.quantity or 1,
                    'total_amount': float(booking.total_amount) if booking.total_amount else 0,
                    'booking_status': booking.booking_status or 'pending',
                    'payment_status': booking.payment_status or 'pending',
                    'booking_date': booking.booking_date.isoformat() if booking.booking_date else None,
                    'cancelled_at': booking.cancelled_at.isoformat() if booking.cancelled_at else None,
                    'check_in_status': booking.check_in_status or False,
                    'check_in_time': booking.check_in_time.isoformat() if booking.check_in_time else None,
                    'qr_code': booking.qr_code or '',
                    'event': event_data
                }
                bookings_list.append(booking_dict)
            except Exception as e:
                print(f"⚠️ Error converting booking {booking.id}: {str(e)}")
                # Add minimal booking info
                bookings_list.append({
                    'id': booking.id,
                    'booking_reference': booking.booking_reference or 'N/A',
                    'booking_status': booking.booking_status or 'pending',
                    'payment_status': booking.payment_status or 'pending',
                    'total_amount': float(booking.total_amount) if booking.total_amount else 0,
                    'quantity': booking.quantity or 1,
                    'booking_date': booking.booking_date.isoformat() if booking.booking_date else None,
                    'user_id': booking.user_id,
                    'event_id': booking.event_id
                })
        
        return jsonify({
            'success': True,
            'bookings': bookings_list,
            'total': paginated.total,
            'page': paginated.page,
            'pages': paginated.pages,
            'per_page': paginated.per_page
        }), 200
        
    except Exception as e:
        print(f"❌ Get bookings error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': f'Failed to fetch bookings: {str(e)}'
        }), 500

# ==================== CANCEL BOOKING - FIXED ====================
# backend/routes/bookings.py - Updated cancel endpoint with refund handling

@bookings_bp.route('/<int:booking_id>/cancel', methods=['PUT'])
@jwt_required()
def cancel_booking(booking_id):
    """Cancel a booking with refund handling"""
    try:
        user_id = get_jwt_identity()
        print(f"🔴 Cancel request - User: {user_id}, Booking: {booking_id}")
        
        # Get booking
        booking = Booking.query.get(booking_id)
        
        if not booking:
            return jsonify({
                'success': False,
                'error': 'Booking not found'
            }), 404
        
        # Check if already cancelled
        if booking.booking_status == 'cancelled':
            return jsonify({
                'success': False,
                'error': 'Booking already cancelled'
            }), 400
        
        # ✅ Check if payment was completed (for refund)
        was_paid = booking.payment_status == 'completed'
        refund_amount = booking.total_amount if was_paid else 0
        
        # ✅ Update booking status to cancelled
        booking.booking_status = 'cancelled'
        booking.cancelled_at = datetime.utcnow()
        
        # ✅ If it was confirmed/paid, restore seats and process refund
        if booking.payment_status == 'completed':
            event = Event.query.get(booking.event_id)
            if event:
                event.available_seats += booking.quantity
                print(f"✅ Restored {booking.quantity} seats for event {event.id}")
            
            # ✅ Update payment status to refunded
            payment = Payment.query.filter_by(booking_id=booking.id).first()
            if payment:
                payment.payment_status = 'refunded'
                payment.refund_status = 'completed'
                payment.refunded_at = datetime.utcnow()
                payment.refund_amount = booking.total_amount
                payment.refund_reason = 'Booking cancelled by user'
                print(f"✅ Refund processed for booking {booking.id}")
        
        db.session.commit()
        cache.clear()
        
        # ✅ Create notification with refund message
        event_title = booking.event.title if booking.event else 'Event'
        if was_paid:
            message = f"Your booking for '{event_title}' has been cancelled. A refund of ₹{refund_amount} will be processed to your original payment method within 5-7 business days."
        else:
            message = f"Your booking for '{event_title}' has been cancelled successfully."
        
        notification = Notification(
            user_id=booking.user_id,
            title="Booking Cancelled ❌",
            message=message,
            type='booking_cancelled',
            link=f'/bookings/{booking.id}',
            icon='❌'
        )
        db.session.add(notification)
        db.session.commit()
        
        print(f"✅ Booking {booking_id} cancelled successfully")
        
        return jsonify({
            'success': True,
            'message': 'Booking cancelled successfully',
            'refund': {
                'amount': refund_amount,
                'status': 'refunded' if was_paid else 'no_refund_needed',
                'message': f'Refund of ₹{refund_amount} will be processed' if was_paid else 'No refund needed'
            } if was_paid else None,
            'booking': booking.to_dict()
        }), 200
        
    except Exception as e:
        print(f"❌ Cancel error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Failed to cancel booking: {str(e)}'
        }), 500

# ==================== GET QR CODE ====================

@bookings_bp.route('/<int:booking_id>/qr', methods=['GET'])
@jwt_required()
def get_qr_code(booking_id):
    """Get QR code for booking"""
    try:
        user_id = get_jwt_identity()
        booking = Booking.query.get(booking_id)
        
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        # Check permission
        if booking.user_id != user_id:
            user = User.query.get(user_id)
            if not user or user.role != 'admin':
                return jsonify({'error': 'Permission denied'}), 403
        
        if not booking.qr_code:
            return jsonify({'error': 'QR code not generated'}), 404
        
        return jsonify({'qr_code': booking.qr_code}), 200
        
    except Exception as e:
        print(f"Get QR code error: {str(e)}")
        return jsonify({'error': 'Failed to fetch QR code'}), 500

# ==================== DOWNLOAD PDF ====================

@bookings_bp.route('/<int:booking_id>/pdf', methods=['GET'])
@jwt_required()
def download_ticket_pdf(booking_id):
    """Download ticket PDF"""
    try:
        user_id = get_jwt_identity()
        booking = Booking.query.get(booking_id)
        
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        # Check permission
        if booking.user_id != user_id:
            user = User.query.get(user_id)
            if not user or user.role != 'admin':
                return jsonify({'error': 'Permission denied'}), 403
        
        if booking.booking_status != 'confirmed':
            return jsonify({'error': 'Ticket is not confirmed'}), 400
        
        pdf_buffer = generate_ticket_pdf(booking)
        
        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name=f"ticket_{booking.ticket_number}.pdf",
            mimetype='application/pdf'
        )
        
    except Exception as e:
        print(f"Download PDF error: {str(e)}")
        return jsonify({'error': 'Failed to download ticket'}), 500

# ==================== CHECK-IN ====================

@bookings_bp.route('/<int:booking_id>/check-in', methods=['PUT'])
@jwt_required()
def check_in(booking_id):
    """Check in a booking (Admin/Organizer only)"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user is admin
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        event = Event.query.get(booking.event_id)
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        # Check if user is organizer or admin
        is_organizer = False
        if user.role == 'admin':
            is_organizer = True
        elif hasattr(event, 'organizers'):
            try:
                if hasattr(event.organizers, 'all'):
                    organizers = event.organizers.all()
                    is_organizer = any(o.id == user_id for o in organizers)
                elif isinstance(event.organizers, list):
                    is_organizer = any(o.id == user_id for o in event.organizers)
            except:
                pass
        
        if not is_organizer:
            return jsonify({'error': 'Permission denied. Only admin or organizer can check in.'}), 403
        
        if booking.check_in_status:
            return jsonify({'error': 'Already checked in'}), 400
        
        if booking.booking_status != 'confirmed':
            return jsonify({'error': 'Cannot check in non-confirmed booking'}), 400
        
        booking.check_in_status = True
        booking.check_in_time = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Check-in successful',
            'booking': booking.to_dict()
        }), 200
    
        
    except Exception as e:
        print(f"Check-in error: {str(e)}")
        print(traceback.format_exc())
        db.session.rollback()
        return jsonify({'error': 'Failed to check in'}), 500  
    # backend/routes/bookings.py - Add after your existing endpoints

@bookings_bp.route('/debug/check/<int:booking_id>', methods=['GET'])
@jwt_required()
def debug_check_booking(booking_id):
    """Debug endpoint to check booking details"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({
                'success': False,
                'message': 'Booking not found',
                'booking_id': booking_id
            }), 404
        
        owner = User.query.get(booking.user_id)
        
        return jsonify({
            'success': True,
            'debug': {
                'booking_id': booking.id,
                'booking_reference': booking.booking_reference,
                'booking_status': booking.booking_status,
                'booking_user_id': booking.user_id,
                'booking_owner': {
                    'id': owner.id if owner else None,
                    'username': owner.username if owner else 'Unknown',
                    'email': owner.email if owner else 'Unknown'
                },
                'your_user_id': user_id,
                'your_user': {
                    'id': user.id if user else None,
                    'username': user.username if user else 'Unknown',
                    'role': user.role if user else 'Unknown'
                },
                'is_owner': booking.user_id == user_id,
                'is_admin': user.role == 'admin' if user else False,
                'can_cancel': booking.user_id == user_id or (user and user.role == 'admin')
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


    # backend/routes/bookings.py - Add debug endpoint

@bookings_bp.route('/debug/booking/<int:booking_id>', methods=['GET'])
@jwt_required()
def debug_booking(booking_id):
    """Debug endpoint to check booking ownership"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({
                'success': False,
                'error': 'Booking not found'
            }), 404
        
        owner = User.query.get(booking.user_id)
        
        return jsonify({
            'success': True,
            'debug': {
                'booking_id': booking.id,
                'booking_reference': booking.booking_reference,
                'booking_status': booking.booking_status,
                'booking_user_id': booking.user_id,
                'booking_owner': {
                    'id': owner.id if owner else None,
                    'username': owner.username if owner else 'Unknown',
                    'email': owner.email if owner else 'Unknown'
                },
                'your_user_id': user_id,
                'your_username': user.username if user else 'Unknown',
                'your_role': user.role if user else 'Unknown',
                'is_owner': booking.user_id == user_id,
                'can_cancel': booking.user_id == user_id or (user and user.role == 'admin')
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500