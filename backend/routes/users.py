
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db, cache
from models import User, Booking, Notification, ActivityLog, Event, Review
from utils.validators import validate_email, validate_phone
from utils.file_handlers import UploadHandler, ImageHandler, FileStorage, delete_file
from datetime import datetime
import os

users_bp = Blueprint('users', __name__)

@users_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict()), 200

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    if data.get('username'):
        if User.query.filter(User.username == data['username'], User.id != user_id).first():
            return jsonify({'error': 'Username already taken'}), 400
        user.username = data['username']
    
    if data.get('email'):
        if not validate_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        if User.query.filter(User.email == data['email'], User.id != user_id).first():
            return jsonify({'error': 'Email already registered'}), 400
        user.email = data['email']
    
    if data.get('phone'):
        user.phone = data['phone']
    
    if data.get('bio'):
        user.bio = data['bio']
    
    db.session.commit()
    cache.clear()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': user.to_dict()
    }), 200

@users_bp.route('/profile/avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if 'avatar' not in request.files:
        return jsonify({'error': 'No avatar file provided'}), 400
    
    file = request.files['avatar']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Delete old avatar
    if user.profile_image:
        old_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'avatars', 
                               str(user_id), os.path.basename(user.profile_image))
        delete_file(old_path)
    
    result = ImageHandler.upload_profile_image(file, user_id)
    if not result['success']:
        return jsonify({'error': result.get('errors', ['Upload failed'])}), 400
    
    user.profile_image = result['url']
    db.session.commit()
    cache.clear()
    
    return jsonify({
        'message': 'Avatar uploaded successfully',
        'profile_image': user.profile_image
    }), 200

@users_bp.route('/profile/avatar', methods=['DELETE'])
@jwt_required()
def delete_avatar():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user.profile_image:
        old_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'avatars',
                               str(user_id), os.path.basename(user.profile_image))
        delete_file(old_path)
        user.profile_image = None
        db.session.commit()
        cache.clear()
    
    return jsonify({'message': 'Avatar deleted successfully'}), 200

@users_bp.route('/profile/password', methods=['PUT'])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    if not data.get('current_password') or not data.get('new_password'):
        return jsonify({'error': 'Current and new password are required'}), 400
    
    if not user.check_password(data['current_password']):
        return jsonify({'error': 'Current password is incorrect'}), 401
    
    if len(data['new_password']) < 8:
        return jsonify({'error': 'New password must be at least 8 characters'}), 400
    
    user.set_password(data['new_password'])
    db.session.commit()
    
    return jsonify({'message': 'Password changed successfully'}), 200

@users_bp.route('/profile', methods=['DELETE'])
@jwt_required()
def delete_account():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user.profile_image:
        old_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'avatars',
                               str(user_id), os.path.basename(user.profile_image))
        delete_file(old_path)
    
    db.session.delete(user)
    db.session.commit()
    cache.clear()
    
    return jsonify({'message': 'Account deleted successfully'}), 200

@users_bp.route('/bookings', methods=['GET'])
@jwt_required()
def get_user_bookings():
    user_id = get_jwt_identity()
    status = request.args.get('status', '')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    query = Booking.query.filter_by(user_id=user_id)
    if status:
        query = query.filter_by(booking_status=status)
    
    paginated = query.order_by(Booking.booking_date.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'bookings': [booking.to_dict() for booking in paginated.items],
        'total': paginated.total,
        'page': page,
        'pages': paginated.pages,
        'per_page': per_page
    }), 200

@users_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = get_jwt_identity()
    status = request.args.get('status', '')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    query = Notification.query.filter_by(user_id=user_id)
    if status:
        query = query.filter_by(status=status)
    
    paginated = query.order_by(Notification.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'notifications': [notification.to_dict() for notification in paginated.items],
        'total': paginated.total,
        'page': page,
        'pages': paginated.pages,
        'per_page': per_page
    }), 200

@users_bp.route('/notifications/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notification_id):
    user_id = get_jwt_identity()
    notification = Notification.query.filter_by(id=notification_id, user_id=user_id).first()
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404
    
    notification.status = 'read'
    notification.read_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'message': 'Notification marked as read'}), 200

@users_bp.route('/notifications/read-all', methods=['PUT'])
@jwt_required()
def mark_all_notifications_read():
    user_id = get_jwt_identity()
    notifications = Notification.query.filter_by(user_id=user_id, status='unread').all()
    for notification in notifications:
        notification.status = 'read'
        notification.read_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'message': 'All notifications marked as read'}), 200

@users_bp.route('/notifications/count', methods=['GET'])
@jwt_required()
def get_unread_count():
    user_id = get_jwt_identity()
    count = Notification.query.filter_by(user_id=user_id, status='unread').count()
    return jsonify({'unread_count': count}), 200

# ==================== ADD THESE NEW ROUTES ====================

@users_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_user_stats():
    """Get user statistics for dashboard"""
    try:
        user_id = get_jwt_identity()
        
        total_bookings = Booking.query.filter_by(user_id=user_id).count()
        upcoming_events = Booking.query.filter(
            Booking.user_id == user_id,
            Booking.booking_status == 'confirmed',
            Booking.event.has(Event.date >= datetime.utcnow())
        ).count()
        past_events = Booking.query.filter(
            Booking.user_id == user_id,
            Booking.booking_status == 'confirmed',
            Booking.event.has(Event.date < datetime.utcnow())
        ).count()
        total_reviews = Review.query.filter_by(user_id=user_id).count()
        wishlist_count = 0
        
        return jsonify({
            'totalBookings': total_bookings,
            'upcomingEvents': upcoming_events,
            'pastEvents': past_events,
            'totalReviews': total_reviews,
            'wishlistCount': wishlist_count
        }), 200
        
    except Exception as e:
        print(f"Error getting user stats: {str(e)}")
        return jsonify({'error': str(e)}), 500

@users_bp.route('/activity', methods=['GET'])
@jwt_required()
def get_user_activity():
    """Get user activity logs"""
    try:
        user_id = get_jwt_identity()
        limit = request.args.get('limit', 5, type=int)
        
        # Try to get activity logs
        activities = ActivityLog.query.filter_by(user_id=user_id).order_by(
            ActivityLog.timestamp.desc()
        ).limit(limit).all()
        
        if not activities:
            # Get recent bookings as activities
            recent_bookings = Booking.query.filter_by(user_id=user_id).order_by(
                Booking.booking_date.desc()
            ).limit(limit).all()
            
            activities_data = []
            for booking in recent_bookings:
                if booking.event:
                    activities_data.append({
                        'type': 'booking',
                        'message': f'Booked {booking.quantity} ticket(s) for {booking.event.title}',
                        'timestamp': booking.booking_date.isoformat()
                    })
            
            return jsonify({'activities': activities_data}), 200
        
        return jsonify({
            'activities': [
                {
                    'type': log.action,
                    'message': log.details or f'User performed {log.action}',
                    'timestamp': log.timestamp.isoformat()
                }
                for log in activities
            ]
        }), 200
        
    except Exception as e:
        print(f"Error getting user activity: {str(e)}")
        return jsonify({'error': str(e)}), 500