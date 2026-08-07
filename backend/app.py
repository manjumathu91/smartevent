
"""
Smart Event Management System - Main Application Entry Point
"""

import os
import time
import uuid
from datetime import datetime
from flask import Flask, jsonify, request, g, send_from_directory
from flask_cors import CORS
from extensions import db, migrate, jwt, mail, limiter, cache
from config import config
from models import User
import logging

logger = logging.getLogger(__name__)


def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    mail.init_app(app)
    limiter.init_app(app)
    cache.init_app(app)

    # ============ CORS - SINGLE SOURCE OF TRUTH ============
    # flask-cors handles preflight (OPTIONS) requests and sets
    # Access-Control-Allow-Origin dynamically based on the request's
    # actual Origin header, matched against this list.
    # Do NOT add any manual Access-Control-* headers anywhere else
    # in this app (after_request, error handlers, custom OPTIONS
    # routes, etc.) - they will conflict with these and cause the
    # "header value does not match supplied origin" CORS error.

    allowed_origins = os.environ.get(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:5173,http://127.0.0.1:5173,https://smartevent-1.onrender.com'
    ).split(',')

    CORS(
        app,
        origins=allowed_origins,
        supports_credentials=True,
        allow_headers=[
            "Content-Type",
            "Authorization",
            "X-Request-ID",
            "Accept"
        ],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        expose_headers=["Content-Type", "Authorization"],
        max_age=3600
    )
    # =========================================================

    # Register blueprints
    from routes.auth import auth_bp
    from routes.users import users_bp
    from routes.events import events_bp
    from routes.bookings import bookings_bp
    from routes.admin import admin_bp
    from routes.dashboard import dashboard_bp
    from routes.reviews import reviews_bp
    from routes.newsletter import newsletter_bp
    from routes.payments import payments_bp
    from routes.contact import contact_bp
    from routes.admin_events import admin_events_bp
    from routes.notifications import notifications_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(events_bp, url_prefix='/api/events')
    app.register_blueprint(bookings_bp, url_prefix='/api/bookings')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(reviews_bp, url_prefix='/api/reviews')
    app.register_blueprint(newsletter_bp, url_prefix='/api/newsletter')
    app.register_blueprint(payments_bp, url_prefix='/api/payments')
    app.register_blueprint(contact_bp, url_prefix='/api/contact')
    app.register_blueprint(admin_events_bp, url_prefix='/api/admin/events')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')

    # JWT Handlers
    @jwt.unauthorized_loader
    def unauthorized_response(callback):
        return jsonify({
            'success': False,
            'error': {
                'code': 'UNAUTHORIZED',
                'message': 'Authentication required',
                'status_code': 401
            }
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_response(callback):
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_TOKEN',
                'message': 'Invalid or expired token',
                'status_code': 401
            }
        }), 401

    @jwt.expired_token_loader
    def expired_token_response(callback):
        return jsonify({
            'success': False,
            'error': {
                'code': 'TOKEN_EXPIRED',
                'message': 'Token has expired',
                'status_code': 401
            }
        }), 401

    # ==================== REQUEST HANDLERS ====================

    @app.before_request
    def before_request():
        g.start_time = time.time()
        if not hasattr(g, 'request_id'):
            g.request_id = request.headers.get('X-Request-ID', str(uuid.uuid4())[:8])

    @app.after_request
    def after_request(response):
        # Add request ID
        if hasattr(g, 'request_id'):
            response.headers['X-Request-ID'] = g.request_id

        # Remove compression headers (only if you're not actually compressing)
        response.headers.pop('Content-Encoding', None)

        # NOTE: No manual Access-Control-* headers here.
        # flask-cors already added the correct ones above.

        return response

    # ==================== ERROR HANDLERS ====================

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Resource not found',
                'status_code': 404
            }
        }), 404

    @app.errorhandler(500)
    def internal_server_error(error):
        logger.error(f"Internal server error: {str(error)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_SERVER_ERROR',
                'message': 'An internal server error occurred',
                'status_code': 500
            }
        }), 500

    @app.errorhandler(Exception)
    def handle_exception(error):
        logger.error(f"Unhandled exception: {str(error)}", exc_info=True)
        if app.debug:
            import traceback
            return jsonify({
                'success': False,
                'error': {
                    'code': 'INTERNAL_ERROR',
                    'message': str(error),
                    'status_code': 500,
                    'traceback': traceback.format_exc()
                }
            }), 500
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_SERVER_ERROR',
                'message': 'An unexpected error occurred',
                'status_code': 500
            }
        }), 500

    # ==================== ROUTES ====================

    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'version': '1.0.0',
            'environment': app.config.get('ENV', 'development'),
            'timestamp': datetime.utcnow().isoformat()
        }), 200

    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'name': 'Smart Event Management System API',
            'version': '1.0.0',
            'status': 'running',
            'endpoints': {
                'auth': '/api/auth',
                'users': '/api/users',
                'events': '/api/events',
                'bookings': '/api/bookings',
                'admin': '/api/admin',
                'health': '/health'
            }
        }), 200

    @app.route('/favicon.ico')
    def favicon():
        return '', 204

    # ==================== CREATE DIRECTORIES ====================

    os.makedirs(app.config.get('UPLOAD_FOLDER', 'uploads'), exist_ok=True)
    os.makedirs('logs', exist_ok=True)
    os.makedirs('instance', exist_ok=True)

    # ==================== CREATE ADMIN USER ====================

    with app.app_context():
        try:
            admin = User.query.filter_by(email='admin@eventhub.com').first()
            if not admin:
                admin = User(
                    username='admin',
                    email='admin@eventhub.com',
                    role='admin',
                    status='active',
                    email_verified=True
                )
                admin.set_password('Admin@123')
                db.session.add(admin)
                db.session.commit()
                logger.info("✅ Default admin created: admin@eventhub.com / Admin@123")
        except Exception as e:
            logger.warning(f"⚠️ Could not create admin: {str(e)}")

    # ==================== CREATE TABLES ====================

    with app.app_context():
        db.create_all()
        logger.info("✅ Tables created/verified!")

    logger.info("=" * 60)
    logger.info("🚀 Smart Event Management System")
    logger.info(f"📦 Version: 1.0.0")
    logger.info(f"🌍 Environment: {app.config.get('ENV', 'development')}")
    logger.info("=" * 60)

    return app


# This is what gunicorn/render will import: `app:app`
app = create_app()

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=int(os.environ.get('PORT', 5000)), debug=app.config.get('DEBUG', False))