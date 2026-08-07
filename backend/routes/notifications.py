
# backend/routes/notifications.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db, logger
from models import Notification
from datetime import datetime
import traceback

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

# ==================== GET ALL NOTIFICATIONS ====================

@notifications_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get all notifications for current user"""
    try:
        user_id = get_jwt_identity()
        print(f"📋 Fetching notifications for user: {user_id}")
        
        status = request.args.get('status')
        limit = request.args.get('limit', 50, type=int)
        
        query = Notification.query.filter_by(user_id=user_id)
        
        if status:
            query = query.filter_by(status=status)
        
        notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()
        
        print(f"✅ Found {len(notifications)} notifications")
        
        return jsonify({
            'success': True,
            'notifications': [n.to_dict() for n in notifications]
        }), 200
        
    except Exception as e:
        print(f"❌ Get notifications error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== GET UNREAD COUNT ====================

@notifications_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Get unread notification count"""
    try:
        user_id = get_jwt_identity()
        
        count = Notification.query.filter_by(
            user_id=user_id,
            status='unread'
        ).count()
        
        return jsonify({
            'success': True,
            'count': count
        }), 200
        
    except Exception as e:
        print(f"❌ Get unread count error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== MARK AS READ ====================

@notifications_bp.route('/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_as_read(notification_id):
    """Mark a notification as read"""
    try:
        user_id = get_jwt_identity()
        
        notification = Notification.query.filter_by(
            id=notification_id,
            user_id=user_id
        ).first()
        
        if not notification:
            return jsonify({
                'success': False,
                'error': 'Notification not found'
            }), 404
        
        notification.status = 'read'
        notification.read_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Marked as read'
        }), 200
        
    except Exception as e:
        print(f"❌ Mark as read error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== MARK ALL AS READ ====================

@notifications_bp.route('/read-all', methods=['PUT'])
@jwt_required()
def mark_all_as_read():
    """Mark all notifications as read"""
    try:
        user_id = get_jwt_identity()
        
        notifications = Notification.query.filter_by(
            user_id=user_id,
            status='unread'
        ).all()
        
        count = len(notifications)
        
        for notification in notifications:
            notification.status = 'read'
            notification.read_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'{count} notifications marked as read',
            'count': count
        }), 200
        
    except Exception as e:
        print(f"❌ Mark all as read error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== DELETE NOTIFICATION ====================

@notifications_bp.route('/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Delete a notification"""
    try:
        user_id = get_jwt_identity()
        
        notification = Notification.query.filter_by(
            id=notification_id,
            user_id=user_id
        ).first()
        
        if not notification:
            return jsonify({
                'success': False,
                'error': 'Notification not found'
            }), 404
        
        db.session.delete(notification)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Notification deleted'
        }), 200
        
    except Exception as e:
        print(f"❌ Delete notification error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== DELETE ALL NOTIFICATIONS ====================

@notifications_bp.route('/delete-all', methods=['DELETE'])
@jwt_required()
def delete_all_notifications():
    """Delete all notifications for current user"""
    try:
        user_id = get_jwt_identity()
        
        count = Notification.query.filter_by(user_id=user_id).delete()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'{count} notifications deleted',
            'count': count
        }), 200
        
    except Exception as e:
        print(f"❌ Delete all notifications error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500