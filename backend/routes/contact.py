# backend/routes/contact.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db, logger
from models import Notification
from datetime import datetime
import re
import traceback

contact_bp = Blueprint('contact', __name__, url_prefix='/api/contact')

# ==================== SEND CONTACT MESSAGE ====================

@contact_bp.route('/', methods=['POST'])
def send_contact():
    """Handle contact form submission"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Invalid request data'
            }), 400
        
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        subject = data.get('subject', '').strip()
        message = data.get('message', '').strip()
        
        # Validate required fields
        if not all([name, email, subject, message]):
            return jsonify({
                'success': False,
                'error': 'All fields are required'
            }), 400
        
        # Validate email format
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            return jsonify({
                'success': False,
                'error': 'Invalid email address'
            }), 400
        
        # Log the contact submission
        logger.info(f"📧 Contact Form Submission:")
        logger.info(f"  Name: {name}")
        logger.info(f"  Email: {email}")
        logger.info(f"  Subject: {subject}")
        logger.info(f"  Message: {message}")
        
        # TODO: Send email notification
        # You can integrate with email service like SendGrid, Mailgun, etc.
        
        # Save to database if you have a Contact model
        # contact = Contact(
        #     name=name,
        #     email=email,
        #     subject=subject,
        #     message=message,
        #     created_at=datetime.utcnow()
        # )
        # db.session.add(contact)
        # db.session.commit()
        
        # Create notification for admin (optional)
        # notification = Notification(
        #     user_id=1,  # Admin user ID
        #     title=f"New Contact Message: {subject}",
        #     message=f"From: {name} ({email})\n{message}",
        #     type='contact',
        #     link='/admin/contacts',
        #     icon='📧'
        # )
        # db.session.add(notification)
        # db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Message sent successfully! We\'ll get back to you soon.'
        }), 200
        
    except Exception as e:
        logger.error(f"Contact error: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': 'Failed to send message. Please try again later.'
        }), 500

# ==================== GET CONTACT MESSAGES (ADMIN) ====================

@contact_bp.route('/messages', methods=['GET'])
@jwt_required()
def get_messages():
    """Get all contact messages - Admin only"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user is admin
        from models import User
        user = User.query.get(user_id)
        if not user or user.role != 'admin':
            return jsonify({
                'success': False,
                'error': 'Permission denied'
            }), 403
        
        # TODO: Fetch from database if you have a Contact model
        # contacts = Contact.query.order_by(Contact.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'messages': []  # Return empty for now
        }), 200
        
    except Exception as e:
        logger.error(f"Get messages error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch messages'
        }), 500