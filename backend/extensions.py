
"""
extensions.py
-------------------------
Initialize all Flask extensions in one place.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_mail import Mail
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_caching import Cache
# from celery import Celery  # ← REMOVE OR COMMENT THIS LINE

import logging

logger = logging.getLogger(__name__)

# ==========================================================
# Database
# ==========================================================

db = SQLAlchemy()

# ==========================================================
# Database Migration
# ==========================================================

migrate = Migrate()

# ==========================================================
# JWT Authentication
# ==========================================================

jwt = JWTManager()

# ==========================================================
# CORS
# ==========================================================

cors = CORS()

# ==========================================================
# Mail
# ==========================================================

mail = Mail()

# ==========================================================
# Rate Limiter
# ==========================================================

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
)

# ==========================================================
# Cache
# ==========================================================

cache = Cache()

# ==========================================================
# Celery (Task Queue) - Commented out for now
# ==========================================================

# celery = Celery(__name__, broker="redis://localhost:6379/0")

# ==========================================================
# JWT Error Handlers
# ==========================================================

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    """Handle expired token"""
    return {
        "success": False,
        "error": {
            "code": "TOKEN_EXPIRED",
            "message": "Token has expired. Please login again.",
            "status_code": 401
        }
    }, 401


@jwt.invalid_token_loader
def invalid_token_callback(error):
    """Handle invalid token"""
    return {
        "success": False,
        "error": {
            "code": "INVALID_TOKEN",
            "message": "Invalid token. Please login again.",
            "status_code": 401
        }
    }, 401


@jwt.unauthorized_loader
def missing_token_callback(error):
    """Handle missing token"""
    return {
        "success": False,
        "error": {
            "code": "UNAUTHORIZED",
            "message": "Authorization token is missing. Please login.",
            "status_code": 401
        }
    }, 401


@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_payload):
    """Handle revoked token"""
    return {
        "success": False,
        "error": {
            "code": "TOKEN_REVOKED",
            "message": "Token has been revoked. Please login again.",
            "status_code": 401
        }
    }, 401


@jwt.needs_fresh_token_loader
def fresh_token_required(jwt_header, jwt_payload):
    """Handle fresh token required"""
    return {
        "success": False,
        "error": {
            "code": "FRESH_TOKEN_REQUIRED",
            "message": "Fresh token required. Please re-authenticate.",
            "status_code": 401
        }
    }, 401

# ==========================================================
# JWT Callbacks
# ==========================================================

@jwt.additional_claims_loader
def add_claims_to_access_token(identity):
    """Add additional claims to JWT token"""
    from models import User
    user = User.query.get(identity)
    if user:
        return {
            "username": user.username,
            "email": user.email,
            "role": user.role
        }
    return {}


@jwt.user_identity_loader
def user_identity_lookup(user):
    """Get user identity for JWT"""
    if isinstance(user, int):
        return user
    if hasattr(user, 'id'):
        return user.id
    return user


@jwt.user_lookup_loader
def user_lookup_callback(jwt_header, jwt_data):
    """Get user from JWT identity"""
    from models import User
    identity = jwt_data["sub"]
    return User.query.get(identity)

# ==========================================================
# JWT Token Blocklist (Optional)
# ==========================================================

# In-memory blocklist for demo (use Redis in production)
blocklist = set()

@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    """Check if token is revoked"""
    jti = jwt_payload["jti"]
    return jti in blocklist

def revoke_token(jti):
    """Revoke a token"""
    blocklist.add(jti)

def unrevoke_token(jti):
    """Unrevoke a token"""
    blocklist.discard(jti)

# ==========================================================
# Helper Function
# ==========================================================

def init_extensions(app):
    """
    Initialize all Flask extensions with the app.
    """
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app)
    mail.init_app(app)
    limiter.init_app(app)
    cache.init_app(app)
    
    # Initialize Celery (optional - only if installed)
    # from tasks import init_celery
    # init_celery(app)
    
    logger.info("✅ All extensions initialized successfully")
    return app