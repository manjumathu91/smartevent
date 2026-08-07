# backend/routes/admin_events.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db, logger
from models import Event, Category, User, Booking
from datetime import datetime
import traceback

admin_events_bp = Blueprint('admin_events', __name__, url_prefix='/api/admin/events')

# ==================== GET ALL EVENTS (ADMIN) ====================

@admin_events_bp.route('/', methods=['GET'])
@jwt_required()
def get_admin_events():
    """Get all events for admin panel"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user is admin
        user = User.query.get(user_id)
        if not user or user.role != 'admin':
            return jsonify({
                'success': False,
                'error': 'Permission denied. Admin only.'
            }), 403
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status', '')
        search = request.args.get('search', '')
        
        # Build query
        query = Event.query
        
        # Filter by status
        if status:
            query = query.filter_by(status=status)
        
        # Search by title
        if search:
            query = query.filter(Event.title.ilike(f'%{search}%'))
        
        # Order by created date (newest first)
        query = query.order_by(Event.created_at.desc())
        
        # Paginate
        paginated = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        # Convert to dict
        events_list = []
        for event in paginated.items:
            try:
                event_dict = event.to_dict()
                # Add booking count
                event_dict['bookings_count'] = event.bookings.count() if event.bookings else 0
                events_list.append(event_dict)
            except Exception as e:
                logger.error(f"Error converting event {event.id}: {str(e)}")
                events_list.append({
                    'id': event.id,
                    'title': event.title,
                    'status': event.status,
                    'price': float(event.price) if event.price else 0,
                    'date': event.date.isoformat() if event.date else None,
                    'venue': event.venue,
                    'city': event.city,
                    'bookings_count': event.bookings.count() if event.bookings else 0
                })
        
        return jsonify({
            'success': True,
            'events': events_list,
            'total': paginated.total,
            'page': paginated.page,
            'pages': paginated.pages,
            'per_page': paginated.per_page
        }), 200
        
    except Exception as e:
        logger.error(f"Get admin events error: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': f'Failed to fetch events: {str(e)}'
        }), 500

# ==================== UPDATE EVENT STATUS ====================

@admin_events_bp.route('/<int:event_id>/status', methods=['PUT'])
@jwt_required()
def update_event_status(event_id):
    """Update event status (approve/reject)"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user is admin
        user = User.query.get(user_id)
        if not user or user.role != 'admin':
            return jsonify({
                'success': False,
                'error': 'Permission denied. Admin only.'
            }), 403
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'Invalid request data'
            }), 400
        
        new_status = data.get('status')
        if not new_status:
            return jsonify({
                'success': False,
                'error': 'Status is required'
            }), 400
        
        # Get event
        event = Event.query.get(event_id)
        if not event:
            return jsonify({
                'success': False,
                'error': 'Event not found'
            }), 404
        
        # Update status
        event.status = new_status
        event.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Event status updated to {new_status}',
            'event': event.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Update event status error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== DELETE EVENT (ADMIN) ====================

@admin_events_bp.route('/<int:event_id>', methods=['DELETE'])
@jwt_required()
def delete_event(event_id):
    """Delete event (admin only)"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user is admin
        user = User.query.get(user_id)
        if not user or user.role != 'admin':
            return jsonify({
                'success': False,
                'error': 'Permission denied. Admin only.'
            }), 403
        
        # Get event
        event = Event.query.get(event_id)
        if not event:
            return jsonify({
                'success': False,
                'error': 'Event not found'
            }), 404
        
        # Delete event
        db.session.delete(event)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Event deleted successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Delete event error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== CREATE EVENT (ADMIN) ====================

@admin_events_bp.route('/', methods=['POST'])
@jwt_required()
def create_event():
    """Create new event (admin only)"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user is admin
        user = User.query.get(user_id)
        if not user or user.role != 'admin':
            return jsonify({
                'success': False,
                'error': 'Permission denied. Admin only.'
            }), 403
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'Invalid request data'
            }), 400
        
        # Validate required fields
        required_fields = ['title', 'description', 'venue', 'city', 'date', 'total_seats', 'category_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'error': f'{field} is required'
                }), 400
        
        # Create event
        from slugify import slugify
        slug = slugify(data['title']) + '-' + str(datetime.utcnow().timestamp())
        
        event = Event(
            title=data['title'],
            slug=slug,
            description=data['description'],
            venue=data['venue'],
            city=data['city'],
            address=data.get('address', ''),
            date=datetime.fromisoformat(data['date']) if isinstance(data['date'], str) else data['date'],
            time=data.get('time', ''),
            duration=data.get('duration', ''),
            price=data.get('price', 0),
            total_seats=data['total_seats'],
            available_seats=data['total_seats'],
            category_id=data['category_id'],
            event_type=data.get('event_type', 'offline'),
            status=data.get('status', 'draft'),
            contact_email=data.get('contact_email', ''),
            contact_phone=data.get('contact_phone', ''),
            image_url=data.get('image_url', ''),
            banner_url=data.get('banner_url', ''),
            organizer_id=user_id
        )
        
        db.session.add(event)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Event created successfully',
            'event': event.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Create event error: {str(e)}")
        logger.error(traceback.format_exc())
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== UPDATE EVENT (ADMIN) ====================

@admin_events_bp.route('/<int:event_id>', methods=['PUT'])
@jwt_required()
def update_event(event_id):
    """Update event (admin only)"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user is admin
        user = User.query.get(user_id)
        if not user or user.role != 'admin':
            return jsonify({
                'success': False,
                'error': 'Permission denied. Admin only.'
            }), 403
        
        # Get event
        event = Event.query.get(event_id)
        if not event:
            return jsonify({
                'success': False,
                'error': 'Event not found'
            }), 404
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'Invalid request data'
            }), 400
        
        # Update fields
        if data.get('title'):
            event.title = data['title']
        if data.get('description'):
            event.description = data['description']
        if data.get('venue'):
            event.venue = data['venue']
        if data.get('city'):
            event.city = data['city']
        if data.get('address'):
            event.address = data['address']
        if data.get('date'):
            event.date = datetime.fromisoformat(data['date']) if isinstance(data['date'], str) else data['date']
        if data.get('time'):
            event.time = data['time']
        if data.get('duration'):
            event.duration = data['duration']
        if data.get('price') is not None:
            event.price = data['price']
        if data.get('total_seats'):
            diff = data['total_seats'] - event.total_seats
            event.total_seats = data['total_seats']
            event.available_seats += diff
        if data.get('category_id'):
            event.category_id = data['category_id']
        if data.get('event_type'):
            event.event_type = data['event_type']
        if data.get('status'):
            event.status = data['status']
        if data.get('contact_email'):
            event.contact_email = data['contact_email']
        if data.get('contact_phone'):
            event.contact_phone = data['contact_phone']
        if data.get('image_url'):
            event.image_url = data['image_url']
        if data.get('banner_url'):
            event.banner_url = data['banner_url']
        
        event.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Event updated successfully',
            'event': event.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Update event error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== GET EVENT DETAILS (ADMIN) ====================

@admin_events_bp.route('/<int:event_id>', methods=['GET'])
@jwt_required()
def get_event_details(event_id):
    """Get event details for admin"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user is admin
        user = User.query.get(user_id)
        if not user or user.role != 'admin':
            return jsonify({
                'success': False,
                'error': 'Permission denied. Admin only.'
            }), 403
        
        event = Event.query.get(event_id)
        if not event:
            return jsonify({
                'success': False,
                'error': 'Event not found'
            }), 404
        
        event_dict = event.to_dict()
        event_dict['bookings_count'] = event.bookings.count() if event.bookings else 0
        
        return jsonify({
            'success': True,
            'event': event_dict
        }), 200
        
    except Exception as e:
        logger.error(f"Get event details error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== GET EVENT STATS (ADMIN) ====================

@admin_events_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_event_stats():
    """Get event statistics for admin dashboard"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user is admin
        user = User.query.get(user_id)
        if not user or user.role != 'admin':
            return jsonify({
                'success': False,
                'error': 'Permission denied. Admin only.'
            }), 403
        
        total_events = Event.query.count()
        approved_events = Event.query.filter_by(status='approved').count()
        pending_events = Event.query.filter_by(status='pending').count()
        rejected_events = Event.query.filter_by(status='rejected').count()
        draft_events = Event.query.filter_by(status='draft').count()
        
        return jsonify({
            'success': True,
            'stats': {
                'total': total_events,
                'approved': approved_events,
                'pending': pending_events,
                'rejected': rejected_events,
                'draft': draft_events
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get event stats error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500