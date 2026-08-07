import logging
import traceback
import json
import sys
from datetime import datetime
from flask import jsonify, request, current_app, render_template
from werkzeug.exceptions import HTTPException
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, DataError
from jwt.exceptions import PyJWTError
import re

logger = logging.getLogger(__name__)

# ==================== CUSTOM EXCEPTIONS ====================

class AppException(Exception):
    """Base application exception"""
    status_code = 400
    error_code = 'APP_ERROR'
    
    def __init__(self, message, status_code=None, error_code=None, payload=None):
        super().__init__()
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        if error_code is not None:
            self.error_code = error_code
        self.payload = payload or {}
    
    def to_dict(self):
        rv = {
            'success': False,
            'error': {
                'code': self.error_code,
                'message': self.message,
                'status_code': self.status_code
            }
        }
        if self.payload:
            rv['error']['details'] = self.payload
        return rv

class ValidationError(AppException):
    """Validation error"""
    status_code = 400
    error_code = 'VALIDATION_ERROR'

class AuthenticationError(AppException):
    """Authentication error"""
    status_code = 401
    error_code = 'AUTHENTICATION_ERROR'

class AuthorizationError(AppException):
    """Authorization error"""
    status_code = 403
    error_code = 'AUTHORIZATION_ERROR'

class NotFoundError(AppException):
    """Resource not found error"""
    status_code = 404
    error_code = 'NOT_FOUND'

class ConflictError(AppException):
    """Resource conflict error"""
    status_code = 409
    error_code = 'CONFLICT_ERROR'

class RateLimitError(AppException):
    """Rate limit exceeded error"""
    status_code = 429
    error_code = 'RATE_LIMIT_ERROR'

class ServerError(AppException):
    """Internal server error"""
    status_code = 500
    error_code = 'SERVER_ERROR'

class DatabaseError(AppException):
    """Database error"""
    status_code = 500
    error_code = 'DATABASE_ERROR'

class PaymentError(AppException):
    """Payment processing error"""
    status_code = 400
    error_code = 'PAYMENT_ERROR'

class BusinessLogicError(AppException):
    """Business logic validation error"""
    status_code = 422
    error_code = 'BUSINESS_LOGIC_ERROR'

class FileUploadError(AppException):
    """File upload error"""
    status_code = 400
    error_code = 'FILE_UPLOAD_ERROR'

class EmailError(AppException):
    """Email sending error"""
    status_code = 500
    error_code = 'EMAIL_ERROR'

# ==================== ERROR RESPONSE FORMatters ====================

class ErrorResponseFormatter:
    """Format error responses consistently"""
    
    @staticmethod
    def format_error(error, status_code=500, error_code='INTERNAL_ERROR'):
        """Format error response"""
        return {
            'success': False,
            'error': {
                'code': error_code,
                'message': str(error),
                'status_code': status_code,
                'timestamp': datetime.utcnow().isoformat(),
                'path': request.path,
                'method': request.method
            }
        }
    
    @staticmethod
    def format_validation_error(errors):
        """Format validation errors"""
        return {
            'success': False,
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Validation failed',
                'status_code': 400,
                'timestamp': datetime.utcnow().isoformat(),
                'path': request.path,
                'method': request.method,
                'errors': errors
            }
        }
    
    @staticmethod
    def format_http_error(error):
        """Format HTTP error"""
        return {
            'success': False,
            'error': {
                'code': error.name.upper().replace(' ', '_'),
                'message': error.description,
                'status_code': error.code,
                'timestamp': datetime.utcnow().isoformat(),
                'path': request.path,
                'method': request.method
            }
        }

# ==================== ERROR HANDLERS ====================

def register_error_handlers(app):
    """Register all error handlers with the Flask app"""
    
    # ===== HTTP Exceptions =====
    
    @app.errorhandler(400)
    def bad_request(error):
        """Handle 400 Bad Request"""
        logger.warning(f"Bad request: {error.description}")
        return jsonify(ErrorResponseFormatter.format_http_error(error)), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        """Handle 401 Unauthorized"""
        logger.warning(f"Unauthorized access: {error.description}")
        return jsonify(ErrorResponseFormatter.format_http_error(error)), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        """Handle 403 Forbidden"""
        logger.warning(f"Forbidden: {error.description}")
        return jsonify(ErrorResponseFormatter.format_http_error(error)), 403
    
    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 Not Found"""
        logger.info(f"Resource not found: {request.path}")
        return jsonify(ErrorResponseFormatter.format_http_error(error)), 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        """Handle 405 Method Not Allowed"""
        logger.warning(f"Method not allowed: {request.method} {request.path}")
        return jsonify(ErrorResponseFormatter.format_http_error(error)), 405
    
    @app.errorhandler(409)
    def conflict(error):
        """Handle 409 Conflict"""
        logger.warning(f"Conflict: {error.description}")
        return jsonify(ErrorResponseFormatter.format_http_error(error)), 409
    
    @app.errorhandler(422)
    def unprocessable_entity(error):
        """Handle 422 Unprocessable Entity"""
        logger.warning(f"Unprocessable entity: {error.description}")
        return jsonify(ErrorResponseFormatter.format_http_error(error)), 422
    
    @app.errorhandler(429)
    def rate_limit_exceeded(error):
        """Handle 429 Too Many Requests"""
        logger.warning(f"Rate limit exceeded: {request.remote_addr}")
        return jsonify(ErrorResponseFormatter.format_http_error(error)), 429
    
    @app.errorhandler(500)
    def internal_server_error(error):
        """Handle 500 Internal Server Error"""
        logger.error(f"Internal server error: {str(error)}")
        logger.error(traceback.format_exc())
        return jsonify(ErrorResponseFormatter.format_http_error(error)), 500
    
    # ===== Custom App Exceptions =====
    
    @app.errorhandler(AppException)
    def handle_app_exception(error):
        """Handle custom application exceptions"""
        logger.error(f"Application error: {error.message}")
        if hasattr(error, 'payload') and error.payload:
            logger.error(f"Error payload: {error.payload}")
        return jsonify(error.to_dict()), error.status_code
    
    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        """Handle validation errors"""
        logger.warning(f"Validation error: {error.message}")
        return jsonify(error.to_dict()), error.status_code
    
    @app.errorhandler(AuthenticationError)
    def handle_authentication_error(error):
        """Handle authentication errors"""
        logger.warning(f"Authentication error: {error.message}")
        return jsonify(error.to_dict()), error.status_code
    
    @app.errorhandler(AuthorizationError)
    def handle_authorization_error(error):
        """Handle authorization errors"""
        logger.warning(f"Authorization error: {error.message}")
        return jsonify(error.to_dict()), error.status_code
    
    @app.errorhandler(NotFoundError)
    def handle_not_found_error(error):
        """Handle not found errors"""
        logger.info(f"Resource not found: {error.message}")
        return jsonify(error.to_dict()), error.status_code
    
    @app.errorhandler(ConflictError)
    def handle_conflict_error(error):
        """Handle conflict errors"""
        logger.warning(f"Conflict error: {error.message}")
        return jsonify(error.to_dict()), error.status_code
    
    @app.errorhandler(RateLimitError)
    def handle_rate_limit_error(error):
        """Handle rate limit errors"""
        logger.warning(f"Rate limit error: {error.message}")
        return jsonify(error.to_dict()), error.status_code
    
    @app.errorhandler(ServerError)
    def handle_server_error(error):
        """Handle server errors"""
        logger.error(f"Server error: {error.message}")
        logger.error(traceback.format_exc())
        return jsonify(error.to_dict()), error.status_code
    
    @app.errorhandler(DatabaseError)
    def handle_database_error(error):
        """Handle database errors"""
        logger.error(f"Database error: {error.message}")
        logger.error(traceback.format_exc())
        return jsonify(error.to_dict()), error.status_code
    
    @app.errorhandler(PaymentError)
    def handle_payment_error(error):
        """Handle payment errors"""
        logger.error(f"Payment error: {error.message}")
        return jsonify(error.to_dict()), error.status_code
    
    @app.errorhandler(BusinessLogicError)
    def handle_business_logic_error(error):
        """Handle business logic errors"""
        logger.warning(f"Business logic error: {error.message}")
        return jsonify(error.to_dict()), error.status_code
    
    @app.errorhandler(FileUploadError)
    def handle_file_upload_error(error):
        """Handle file upload errors"""
        logger.error(f"File upload error: {error.message}")
        return jsonify(error.to_dict()), error.status_code
    
    @app.errorhandler(EmailError)
    def handle_email_error(error):
        """Handle email errors"""
        logger.error(f"Email error: {error.message}")
        return jsonify(error.to_dict()), error.status_code
    
    # ===== Database Exceptions =====
    
    @app.errorhandler(SQLAlchemyError)
    def handle_sqlalchemy_error(error):
        """Handle SQLAlchemy errors"""
        logger.error(f"SQLAlchemy error: {str(error)}")
        logger.error(traceback.format_exc())
        
        if isinstance(error, IntegrityError):
            # Handle integrity errors (duplicate key, foreign key, etc.)
            error_message = str(error.orig) if hasattr(error, 'orig') else str(error)
            
            # Extract meaningful error message
            if 'Duplicate entry' in error_message:
                match = re.search(r"Duplicate entry '(.+?)' for key '(.+?)'", error_message)
                if match:
                    value = match.group(1)
                    key = match.group(2)
                    return jsonify({
                        'success': False,
                        'error': {
                            'code': 'DUPLICATE_ENTRY',
                            'message': f"Duplicate entry '{value}' for field '{key}'",
                            'status_code': 409,
                            'timestamp': datetime.utcnow().isoformat()
                        }
                    }), 409
            
            return jsonify({
                'success': False,
                'error': {
                    'code': 'INTEGRITY_ERROR',
                    'message': 'Database integrity error occurred',
                    'status_code': 409,
                    'timestamp': datetime.utcnow().isoformat()
                }
            }), 409
        
        elif isinstance(error, DataError):
            return jsonify({
                'success': False,
                'error': {
                    'code': 'DATA_ERROR',
                    'message': 'Invalid data format or type',
                    'status_code': 400,
                    'timestamp': datetime.utcnow().isoformat()
                }
            }), 400
        
        return jsonify({
            'success': False,
            'error': {
                'code': 'DATABASE_ERROR',
                'message': 'A database error occurred',
                'status_code': 500,
                'timestamp': datetime.utcnow().isoformat()
            }
        }), 500
    
    # ===== JWT Exceptions =====
    
    @app.errorhandler(PyJWTError)
    def handle_jwt_error(error):
        """Handle JWT errors"""
        logger.warning(f"JWT error: {str(error)}")
        
        error_code = 'INVALID_TOKEN'
        message = 'Invalid or expired token'
        status_code = 401
        
        if 'expired' in str(error).lower():
            error_code = 'TOKEN_EXPIRED'
            message = 'Token has expired'
        elif 'signature' in str(error).lower():
            error_code = 'INVALID_SIGNATURE'
            message = 'Invalid token signature'
        
        return jsonify({
            'success': False,
            'error': {
                'code': error_code,
                'message': message,
                'status_code': status_code,
                'timestamp': datetime.utcnow().isoformat()
            }
        }), status_code
    
    # ===== Generic Exception Handler =====
    
    @app.errorhandler(Exception)
    def handle_generic_exception(error):
        """Handle any unhandled exceptions"""
        logger.error(f"Unhandled exception: {str(error)}")
        logger.error(traceback.format_exc())
        
        # Check if it's a known exception type
        if isinstance(error, HTTPException):
            return jsonify(ErrorResponseFormatter.format_http_error(error)), error.code
        
        # In development mode, return detailed error
        if app.debug:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'UNHANDLED_ERROR',
                    'message': str(error),
                    'status_code': 500,
                    'timestamp': datetime.utcnow().isoformat(),
                    'traceback': traceback.format_exc()
                }
            }), 500
        
        # In production, return generic error
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_SERVER_ERROR',
                'message': 'An unexpected error occurred',
                'status_code': 500,
                'timestamp': datetime.utcnow().isoformat()
            }
        }), 500

# ==================== ERROR LOGGING MIDDLEWARE ====================

class ErrorLoggingMiddleware:
    """Middleware for logging errors with request context"""
    
    def __init__(self, app):
        self.app = app
    
    def __call__(self, environ, start_response):
        try:
            return self.app(environ, start_response)
        except Exception as e:
            # Log the error with request context
            logger.error(f"Request error: {str(e)}")
            logger.error(f"Path: {environ.get('PATH_INFO')}")
            logger.error(f"Method: {environ.get('REQUEST_METHOD')}")
            logger.error(f"Remote Addr: {environ.get('REMOTE_ADDR')}")
            logger.error(traceback.format_exc())
            raise

# ==================== VALIDATION ERROR HELPERS ====================

def handle_validation_errors(errors):
    """Handle validation errors and return formatted response"""
    return ErrorResponseFormatter.format_validation_error(errors)

def create_validation_error_response(errors):
    """Create a validation error response"""
    response = ErrorResponseFormatter.format_validation_error(errors)
    return jsonify(response), 400

# ==================== UTILITY FUNCTIONS ====================

def get_error_code(exception):
    """Get error code from exception"""
    if hasattr(exception, 'error_code'):
        return exception.error_code
    return 'INTERNAL_ERROR'

def get_status_code(exception):
    """Get status code from exception"""
    if hasattr(exception, 'status_code'):
        return exception.status_code
    if isinstance(exception, HTTPException):
        return exception.code
    return 500

def is_client_error(status_code):
    """Check if status code is a client error"""
    return 400 <= status_code < 500

def is_server_error(status_code):
    """Check if status code is a server error"""
    return 500 <= status_code < 600

# ==================== ERROR CONTEXT MANAGER ====================

class ErrorContext:
    """Context manager for handling errors in a block"""
    
    def __init__(self, logger_instance=None, reraise=False):
        self.logger = logger_instance or logger
        self.reraise = reraise
        self.error = None
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_val:
            self.error = exc_val
            self.logger.error(f"Error in context: {str(exc_val)}")
            self.logger.error(traceback.format_exc())
            if self.reraise:
                raise
        return True

# ==================== DECORATORS ====================

def handle_errors(error_type=AppException, status_code=400):
    """Decorator to handle errors in a function"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                if isinstance(e, error_type):
                    raise
                raise AppException(str(e), status_code=status_code)
        return wrapper
    return decorator

def log_errors(logger_instance=None):
    """Decorator to log errors in a function"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            logger_instance = logger_instance or logger
            try:
                return func(*args, **kwargs)
            except Exception as e:
                logger_instance.error(f"Error in {func.__name__}: {str(e)}")
                logger_instance.error(traceback.format_exc())
                raise
        return wrapper
    return decorator

# ==================== TEMPLATE ERROR HANDLERS ====================

def register_template_error_handlers(app):
    """Register error handlers that return HTML templates"""
    
    @app.errorhandler(400)
    def bad_request_template(error):
        """Return 400 error page"""
        return render_template('errors/400.html'), 400
    
    @app.errorhandler(403)
    def forbidden_template(error):
        """Return 403 error page"""
        return render_template('errors/403.html'), 403
    
    @app.errorhandler(404)
    def not_found_template(error):
        """Return 404 error page"""
        return render_template('errors/404.html'), 404
    
    @app.errorhandler(500)
    def server_error_template(error):
        """Return 500 error page"""
        return render_template('errors/500.html'), 500

# ==================== INITIALIZATION ====================

def init_error_handlers(app):
    """Initialize error handlers for the app"""
    # Register JSON error handlers
    register_error_handlers(app)
    
    # Register template error handlers (if using templates)
    # register_template_error_handlers(app)
    
    # Add error logging middleware
    app.wsgi_app = ErrorLoggingMiddleware(app.wsgi_app)
    
    logger.info("Error handlers initialized successfully")
    return app

# ==================== EXAMPLE USAGE ====================

if __name__ == '__main__':
    # Test error handlers
    from flask import Flask
    
    app = Flask(__name__)
    init_error_handlers(app)
    
    @app.route('/test-validation')
    def test_validation():
        raise ValidationError("Invalid email format", payload={'field': 'email', 'value': 'invalid'})
    
    @app.route('/test-notfound')
    def test_notfound():
        raise NotFoundError("Event not found", payload={'id': 123})
    
    @app.route('/test-database')
    def test_database():
        raise DatabaseError("Connection failed", payload={'host': 'localhost'})
    
    print("✅ Error handlers initialized successfully!")
    print("Test endpoints available:")
    print("  - /test-validation")
    print("  - /test-notfound")
    print("  - /test-database")