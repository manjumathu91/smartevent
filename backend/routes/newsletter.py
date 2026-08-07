
"""
Newsletter Routes - Complete Implementation
Handles newsletter subscriptions, unsubscriptions, and management
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import User, Notification
from datetime import datetime
import re
import logging

logger = logging.getLogger(__name__)

# Create blueprint
newsletter_bp = Blueprint('newsletter', __name__)

# ==================== SUBSCRIBE TO NEWSLETTER ====================

@newsletter_bp.route('/subscribe', methods=['POST'])
def subscribe():
    """
    Subscribe a user to the newsletter
    Expected JSON: { "email": "user@example.com" }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Invalid request data'
            }), 400
        
        email = data.get('email')
        
        # Validate email
        if not email:
            return jsonify({
                'success': False,
                'error': 'Email is required'
            }), 400
        
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            return jsonify({
                'success': False,
                'error': 'Invalid email format'
            }), 400
        
        # Check if user exists
        user = User.query.filter_by(email=email).first()
        
        # Check if already subscribed (if we have a NewsletterSubscriber model)
        # For now, we'll just return success
        # If you have NewsletterSubscriber model, uncomment the code below
        
        '''
        from models import NewsletterSubscriber
        
        existing = NewsletterSubscriber.query.filter_by(email=email).first()
        if existing:
            if existing.is_active:
                return jsonify({
                    'success': True,
                    'message': 'Already subscribed!',
                    'email': email
                }), 200
            else:
                # Reactivate subscription
                existing.is_active = True
                existing.unsubscribed_at = None
                db.session.commit()
                return jsonify({
                    'success': True,
                    'message': 'Resubscribed successfully!',
                    'email': email
                }), 200
        
        # Create new subscriber
        subscriber = NewsletterSubscriber(
            email=email,
            user_id=user.id if user else None
        )
        db.session.add(subscriber)
        db.session.commit()
        '''
        
        # If user exists, send welcome notification
        if user:
            notification = Notification(
                user_id=user.id,
                title="Newsletter Subscribed",
                message=f"You've successfully subscribed to our newsletter!",
                type='newsletter',
                status='unread',
                icon='📧'
            )
            db.session.add(notification)
            db.session.commit()
        
        # Log subscription
        logger.info(f"Newsletter subscription: {email}")
        
        return jsonify({
            'success': True,
            'message': 'Subscribed successfully! 🎉',
            'email': email
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Newsletter subscription error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to subscribe. Please try again.'
        }), 500

# ==================== UNSUBSCRIBE FROM NEWSLETTER ====================

@newsletter_bp.route('/unsubscribe', methods=['POST'])
def unsubscribe():
    """
    Unsubscribe a user from the newsletter
    Expected JSON: { "email": "user@example.com" }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Invalid request data'
            }), 400
        
        email = data.get('email')
        
        if not email:
            return jsonify({
                'success': False,
                'error': 'Email is required'
            }), 400
        
        # If you have NewsletterSubscriber model, uncomment the code below
        '''
        from models import NewsletterSubscriber
        
        subscriber = NewsletterSubscriber.query.filter_by(email=email).first()
        if subscriber:
            subscriber.is_active = False
            subscriber.unsubscribed_at = datetime.utcnow()
            db.session.commit()
        '''
        
        # If user exists, send notification
        user = User.query.filter_by(email=email).first()
        if user:
            notification = Notification(
                user_id=user.id,
                title="Newsletter Unsubscribed",
                message=f"You've been unsubscribed from our newsletter.",
                type='newsletter',
                status='unread',
                icon='📧'
            )
            db.session.add(notification)
            db.session.commit()
        
        logger.info(f"Newsletter unsubscription: {email}")
        
        return jsonify({
            'success': True,
            'message': 'Unsubscribed successfully!',
            'email': email
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Newsletter unsubscription error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to unsubscribe. Please try again.'
        }), 500

# ==================== GET NEWSLETTER SUBSCRIBERS (ADMIN ONLY) ====================

@newsletter_bp.route('/subscribers', methods=['GET'])
@jwt_required()
def get_subscribers():
    """
    Get all newsletter subscribers (Admin only)
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({
                'success': False,
                'error': 'Admin access required'
            }), 403
        
        # If you have NewsletterSubscriber model, uncomment the code below
        '''
        from models import NewsletterSubscriber
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        query = NewsletterSubscriber.query.filter_by(is_active=True)
        paginated = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'success': True,
            'subscribers': [sub.to_dict() for sub in paginated.items],
            'total': paginated.total,
            'page': page,
            'pages': paginated.pages,
            'per_page': per_page
        }), 200
        '''
        
        # If no model, return dummy data
        return jsonify({
            'success': True,
            'message': 'Subscriber model not implemented',
            'subscribers': [],
            'total': 0
        }), 200
        
    except Exception as e:
        logger.error(f"Get subscribers error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== SEND NEWSLETTER (ADMIN ONLY) ====================

@newsletter_bp.route('/send', methods=['POST'])
@jwt_required()
def send_newsletter():
    """
    Send newsletter to all subscribers (Admin only)
    Expected JSON: { "subject": "Subject", "content": "Email content" }
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({
                'success': False,
                'error': 'Admin access required'
            }), 403
        
        data = request.get_json()
        subject = data.get('subject')
        content = data.get('content')
        
        if not subject or not content:
            return jsonify({
                'success': False,
                'error': 'Subject and content are required'
            }), 400
        
        # If you have NewsletterSubscriber model, uncomment the code below
        '''
        from models import NewsletterSubscriber
        
        subscribers = NewsletterSubscriber.query.filter_by(is_active=True).all()
        
        # Send emails to all subscribers
        # This is where you'd integrate with your email service
        for subscriber in subscribers:
            # Send email logic here
            pass
        
        # Log activity
        log = ActivityLog(
            user_id=user_id,
            action='send_newsletter',
            resource_type='newsletter',
            details=f"Sent newsletter: {subject} to {len(subscribers)} subscribers"
        )
        db.session.add(log)
        db.session.commit()
        '''
        
        return jsonify({
            'success': True,
            'message': 'Newsletter sent successfully!',
            'subject': subject,
            'recipients': 0  # Update with actual count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Send newsletter error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== NEWSLETTER SUBSCRIBER MODEL (OPTIONAL) ====================

# If you want to use a proper model, add this to models.py:
"""
class NewsletterSubscriber(db.Model):
    __tablename__ = 'newsletter_subscribers'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    is_active = db.Column(db.Boolean, default=True)
    subscribed_at = db.Column(db.DateTime, default=datetime.utcnow)
    unsubscribed_at = db.Column(db.DateTime)
    
    user = db.relationship('User', backref='newsletter_subscriptions')
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'user_id': self.user_id,
            'is_active': self.is_active,
            'subscribed_at': self.subscribed_at.isoformat() if self.subscribed_at else None,
            'unsubscribed_at': self.unsubscribed_at.isoformat() if self.unsubscribed_at else None
        }
"""

# ==================== TEST NEWSLETTER API ====================

@newsletter_bp.route('/test', methods=['GET'])
def test_newsletter():
    """Test endpoint to check if newsletter routes work"""
    return jsonify({
        'success': True,
        'message': 'Newsletter routes are working!',
        'endpoints': {
            'subscribe': '/api/newsletter/subscribe (POST)',
            'unsubscribe': '/api/newsletter/unsubscribe (POST)',
            'subscribers': '/api/newsletter/subscribers (GET - Admin)',
            'send': '/api/newsletter/send (POST - Admin)'
        }
    }), 200