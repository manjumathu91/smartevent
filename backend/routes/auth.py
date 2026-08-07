
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token, create_refresh_token, 
    jwt_required, get_jwt_identity, set_access_cookies,
    set_refresh_cookies, unset_jwt_cookies, get_jwt
)
from extensions import db, limiter
from models import User, ActivityLog
from utils.validators import validate_email, validate_password, validate_phone
from utils.email import send_verification_email, send_reset_password_email
from datetime import datetime, timedelta
import re
import hashlib

auth_bp = Blueprint('auth', __name__)

# ==================== REGISTER ====================

@auth_bp.route('/register', methods=['POST'])
@limiter.limit('10 per minute')
def register():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['username', 'email', 'password', 'confirm_password']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Validate email
    if not validate_email(data['email']):
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Validate username
    if len(data['username']) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400
    
    if not re.match(r'^[a-zA-Z0-9_]+$', data['username']):
        return jsonify({'error': 'Username can only contain letters, numbers and underscore'}), 400
    
    # Check email
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    # Check username
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already taken'}), 400
    
    # Validate password
    if not validate_password(data['password']):
        return jsonify({'error': 'Password must be at least 8 characters with uppercase, lowercase, number and special character'}), 400
    
    if data['password'] != data['confirm_password']:
        return jsonify({'error': 'Passwords do not match'}), 400
    
    # Validate phone (optional)
    if data.get('phone') and not validate_phone(data['phone']):
        return jsonify({'error': 'Invalid phone number format'}), 400
    
    # Create user
    user = User(
        username=data['username'],
        email=data['email'],
        phone=data.get('phone'),
        role='user',
        status='active',        # ✅ Add this
        email_verified=True     # ✅ Set to True for now (skip email verification)
    )
    user.set_password(data['password'])
    
    # Generate email verification token (optional)
    # user.generate_email_verification_token()
    
    db.session.add(user)
    db.session.commit()
    
    # Send verification email (optional - comment out if email not configured)
    # send_verification_email(user.email, user.email_verification_token)
    
    # Log activity
    log = ActivityLog(
        user_id=user.id,
        action='register',
        resource_type='user',
        resource_id=user.id,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'User registered successfully',
        'user': user.to_dict()
    }), 201

# ==================== VERIFY EMAIL ====================

@auth_bp.route('/verify-email/<token>', methods=['GET'])
def verify_email(token):
    user = User.query.filter_by(email_verification_token=token).first()
    
    if not user:
        return jsonify({'error': 'Invalid verification token'}), 400
    
    user.email_verified = True
    user.email_verification_token = None
    db.session.commit()
    
    return jsonify({'message': 'Email verified successfully'}), 200

# ==================== LOGIN ====================

@auth_bp.route('/login', methods=['POST'])
@limiter.limit('20 per minute')
def login():
    data = request.get_json()
    
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    if user.status == 'blocked':
        return jsonify({'error': 'Account is blocked. Please contact admin.'}), 403
    
    if not user.email_verified:
        return jsonify({'error': 'Please verify your email first'}), 403
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    # Create tokens
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    
    # Log activity
    log = ActivityLog(
        user_id=user.id,
        action='login',
        resource_type='user',
        resource_id=user.id,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(log)
    db.session.commit()
    
    response = jsonify({
        'success': True,
        'message': 'Login successful',
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    })
    
    # Set cookies if remember me
    if data.get('remember_me'):
        set_access_cookies(response, access_token)
        set_refresh_cookies(response, refresh_token)
    
    return response, 200

# ==================== REFRESH TOKEN ====================

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    user_id = get_jwt_identity()  # ✅ No int() conversion needed
    access_token = create_access_token(identity=user_id)
    
    response = jsonify({'access_token': access_token})
    set_access_cookies(response, access_token)
    
    return response, 200

# ==================== LOGOUT ====================

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    user_id = get_jwt_identity()
    
    # Log activity
    log = ActivityLog(
        user_id=user_id,
        action='logout',
        resource_type='user',
        resource_id=user_id,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(log)
    db.session.commit()
    
    response = jsonify({
        'success': True,
        'message': 'Logout successful'
    })
    unset_jwt_cookies(response)
    
    return response, 200

# ==================== FORGOT PASSWORD ====================

@auth_bp.route('/forgot-password', methods=['POST'])
@limiter.limit('5 per hour')
def forgot_password():
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    user = User.query.filter_by(email=email).first()
    
    if not user:
        # Don't reveal if email exists or not (security best practice)
        return jsonify({'message': 'If the email exists, a reset link will be sent'}), 200
    
    # Generate reset token
    token = user.generate_reset_password_token()
    db.session.commit()
    
    # Send reset email
    send_reset_password_email(user.email, token)
    
    return jsonify({'message': 'Password reset link sent to your email'}), 200

# ==================== RESET PASSWORD ====================

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('password')
    confirm_password = data.get('confirm_password')
    
    if not token or not new_password:
        return jsonify({'error': 'Token and password are required'}), 400
    
    if new_password != confirm_password:
        return jsonify({'error': 'Passwords do not match'}), 400
    
    if not validate_password(new_password):
        return jsonify({'error': 'Password must be at least 8 characters with uppercase, lowercase, number and special character'}), 400
    
    user = User.query.filter_by(reset_password_token=token).first()
    
    if not user:
        return jsonify({'error': 'Invalid or expired token'}), 400
    
    if user.reset_password_expires and user.reset_password_expires < datetime.utcnow():
        return jsonify({'error': 'Token has expired'}), 400
    
    # Update password
    user.set_password(new_password)
    user.reset_password_token = None
    user.reset_password_expires = None
    db.session.commit()
    
    return jsonify({'message': 'Password reset successful'}), 200

# ==================== CHANGE PASSWORD ====================

@auth_bp.route('/change-password', methods=['POST'])
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
    
    if not validate_password(data['new_password']):
        return jsonify({'error': 'New password must be at least 8 characters with uppercase, lowercase, number and special character'}), 400
    
    user.set_password(data['new_password'])
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Password changed successfully'
    }), 200

# ==================== GET CURRENT USER ====================

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current logged in user"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'success': True,
        'user': user.to_dict()
    }), 200