
"""
Utility middleware functions for Flask applications
This file contains reusable middleware components and helper functions
"""

import os
import time
import json
import uuid
import re
import hashlib
import hmac
from datetime import datetime, timedelta
from functools import wraps
from typing import Dict, Any, Optional, List, Callable
from flask import request, g, jsonify, current_app, session, Response, abort
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from werkzeug.exceptions import HTTPException
import logging
from collections import defaultdict
import traceback

logger = logging.getLogger(__name__)

# ==================== DECORATOR MIDDLEWARE ====================

def timing_middleware(func):
    """Decorator to measure function execution time"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        duration = (end_time - start_time) * 1000  # milliseconds
        
        # Log timing
        logger.debug(f"{func.__name__} took {duration:.2f}ms")
        
        # Add timing header if response
        if hasattr(result, 'headers'):
            result.headers['X-Execution-Time'] = f"{duration:.2f}ms"
        
        return result
    return wrapper

def cache_middleware(timeout=300, key_prefix=None):
    """Decorator to cache function results"""
    cache = {}
    
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = f"{key_prefix or func.__name__}:{args}:{kwargs}"
            cache_key = hashlib.md5(cache_key.encode()).hexdigest()
            
            # Check cache
            if cache_key in cache:
                cached_data, timestamp = cache[cache_key]
                if (datetime.utcnow() - timestamp).total_seconds() < timeout:
                    return cached_data
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Store in cache
            cache[cache_key] = (result, datetime.utcnow())
            
            return result
        return wrapper
    return decorator

def retry_middleware(max_retries=3, delay=1, backoff=2, exceptions=(Exception,)):
    """Decorator to retry function on failure"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            retries = 0
            current_delay = delay
            
            while retries < max_retries:
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    retries += 1
                    if retries >= max_retries:
                        raise
                    
                    logger.warning(f"Retry {retries}/{max_retries} for {func.__name__}: {str(e)}")
                    time.sleep(current_delay)
                    current_delay *= backoff
            
            return None
        return wrapper
    return decorator

def rate_limit_middleware(requests_per_minute=60):
    """Decorator for rate limiting"""
    requests = defaultdict(list)
    
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Get client identifier
            client_id = request.remote_addr
            
            # Clean old requests
            now = time.time()
            requests[client_id] = [t for t in requests[client_id] if now - t < 60]
            
            # Check limit
            if len(requests[client_id]) >= requests_per_minute:
                abort(429, description="Rate limit exceeded")
            
            # Add current request
            requests[client_id].append(now)
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

def validate_json_middleware(required_fields=None):
    """Decorator to validate JSON request body"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Check if request has JSON
            if not request.is_json:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 'INVALID_CONTENT_TYPE',
                        'message': 'Content-Type must be application/json',
                        'status_code': 400
                    }
                }), 400
            
            data = request.get_json()
            
            # Validate required fields
            if required_fields:
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    return jsonify({
                        'success': False,
                        'error': {
                            'code': 'MISSING_FIELDS',
                            'message': f'Missing required fields: {", ".join(missing_fields)}',
                            'status_code': 400,
                            'details': {'missing_fields': missing_fields}
                        }
                    }), 400
            
            # Store validated data in g
            g.validated_data = data
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

def role_required_middleware(required_roles: List[str]):
    """Decorator to check if user has required roles"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
                user_id = get_jwt_identity()
                
                # Get user role from database
                from models import User
                user = User.query.get(user_id)
                
                if not user or user.role not in required_roles:
                    return jsonify({
                        'success': False,
                        'error': {
                            'code': 'INSUFFICIENT_PERMISSIONS',
                            'message': 'You do not have permission to access this resource',
                            'status_code': 403
                        }
                    }), 403
                
                return func(*args, **kwargs)
                
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 'AUTHENTICATION_REQUIRED',
                        'message': 'Authentication required',
                        'status_code': 401
                    }
                }), 401
        return wrapper
    return decorator

def log_request_middleware(func):
    """Decorator to log request details"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        # Log request
        logger.info(f"Request: {request.method} {request.path}", extra={
            'method': request.method,
            'path': request.path,
            'ip': request.remote_addr,
            'user_agent': request.headers.get('User-Agent'),
            'content_type': request.headers.get('Content-Type'),
            'args': dict(request.args),
            'form': dict(request.form),
            'json': request.get_json(silent=True) if request.is_json else None
        })
        
        start_time = time.time()
        response = func(*args, **kwargs)
        duration = (time.time() - start_time) * 1000
        
        # Log response
        status_code = response.status_code if hasattr(response, 'status_code') else 200
        logger.info(f"Response: {request.method} {request.path} - {status_code} ({duration:.2f}ms)", extra={
            'method': request.method,
            'path': request.path,
            'status_code': status_code,
            'duration_ms': f"{duration:.2f}"
        })
        
        return response
    return wrapper

# ==================== ERROR HANDLING MIDDLEWARE ====================

def error_handler_middleware(func):
    """Decorator to handle exceptions in routes"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except HTTPException as e:
            return jsonify({
                'success': False,
                'error': {
                    'code': e.name.upper().replace(' ', '_'),
                    'message': e.description,
                    'status_code': e.code
                }
            }), e.code
        except Exception as e:
            logger.error(f"Unhandled exception: {str(e)}")
            logger.error(traceback.format_exc())
            
            # In development, return detailed error
            if current_app.debug:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 'INTERNAL_ERROR',
                        'message': str(e),
                        'status_code': 500,
                        'traceback': traceback.format_exc()
                    }
                }), 500
            
            return jsonify({
                'success': False,
                'error': {
                    'code': 'INTERNAL_SERVER_ERROR',
                    'message': 'An internal error occurred',
                    'status_code': 500
                }
            }), 500
    return wrapper

# ==================== REQUEST VALIDATION MIDDLEWARE ====================

class RequestValidator:
    """Utility class for request validation"""
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    @staticmethod
    def validate_phone(phone: str) -> bool:
        """Validate phone number"""
        phone = re.sub(r'[\s\-()]', '', phone)
        return bool(re.match(r'^\+?[0-9]{10,15}$', phone))
    
    @staticmethod
    def validate_url(url: str) -> bool:
        """Validate URL"""
        pattern = r'^https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+'
        return bool(re.match(pattern, url))
    
    @staticmethod
    def validate_date(date_str: str) -> bool:
        """Validate date string"""
        try:
            datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return True
        except:
            return False
    
    @staticmethod
    def sanitize_input(text: str) -> str:
        """Sanitize input string"""
        # Remove potentially dangerous characters
        text = re.sub(r'[<>]', '', text)
        # Limit length
        text = text[:1000]
        return text.strip()

def validate_request_middleware(validators: Dict[str, Callable]):
    """Decorator to validate request data using validators"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            data = request.get_json() if request.is_json else request.form.to_dict()
            
            errors = {}
            for field, validator in validators.items():
                if field in data:
                    value = data[field]
                    if not validator(value):
                        errors[field] = f"Invalid value for {field}"
            
            if errors:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 'VALIDATION_ERROR',
                        'message': 'Validation failed',
                        'status_code': 400,
                        'details': errors
                    }
                }), 400
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

# ==================== PERFORMANCE MIDDLEWARE ====================

class PerformanceMiddleware:
    """Performance monitoring middleware"""
    
    def __init__(self, app, slow_threshold=1000, log_slow=True):
        self.app = app
        self.slow_threshold = slow_threshold  # milliseconds
        self.log_slow = log_slow
    
    def __call__(self, environ, start_response):
        start_time = time.time()
        
        def _start_response(status, headers, *args):
            duration = (time.time() - start_time) * 1000
            
            # Log slow requests
            if self.log_slow and duration > self.slow_threshold:
                path = environ.get('PATH_INFO', '')
                method = environ.get('REQUEST_METHOD', '')
                logger.warning(f"Slow request: {method} {path} - {duration:.2f}ms")
            
            headers.append(('X-Response-Time', f"{duration:.2f}ms"))
            
            return start_response(status, headers, *args)
        
        return self.app(environ, _start_response)

# ==================== CACHE CONTROL MIDDLEWARE ====================

class CacheControlMiddleware:
    """Cache control middleware"""
    
    def __init__(self, app, default_max_age=300, public=False):
        self.app = app
        self.default_max_age = default_max_age
        self.public = public
    
    def __call__(self, environ, start_response):
        def _start_response(status, headers, *args):
            # Add cache control headers
            cache_header = f"max-age={self.default_max_age}"
            if self.public:
                cache_header += ", public"
            else:
                cache_header += ", private"
            
            headers.append(('Cache-Control', cache_header))
            
            return start_response(status, headers, *args)
        
        return self.app(environ, _start_response)

# ==================== COMPRESSION MIDDLEWARE (DISABLED) ====================

class CompressionMiddleware:
    """Response compression middleware - DISABLED to fix Content Encoding Error"""
    
    def __init__(self, app, compress_level=6, min_size=1024):
        self.app = app
        self.compress_level = compress_level
        self.min_size = min_size
    
    def __call__(self, environ, start_response):
        # DISABLED - Returns app directly without compression
        return self.app(environ, start_response)

# ==================== SECURITY MIDDLEWARE ====================

class SecurityHeadersMiddleware:
    """Add security headers to responses"""
    
    def __init__(self, app):
        self.app = app
    
    def __call__(self, environ, start_response):
        def _start_response(status, headers, *args):
            # Security headers
            headers.extend([
                ('X-Content-Type-Options', 'nosniff'),
                ('X-Frame-Options', 'DENY'),
                ('X-XSS-Protection', '1; mode=block'),
                ('Referrer-Policy', 'strict-origin-when-cross-origin'),
            ])
            
            # CSP header for non-development
            if not current_app.debug:
                headers.append((
                    'Content-Security-Policy',
                    "default-src 'self'; "
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                    "style-src 'self' 'unsafe-inline'; "
                    "img-src 'self' data: https:; "
                    "font-src 'self' data:; "
                    "connect-src 'self' https:;"
                ))
            
            return start_response(status, headers, *args)
        
        return self.app(environ, _start_response)

# ==================== RATE LIMITING MIDDLEWARE ====================

class RateLimiter:
    """Rate limiting utility"""
    
    def __init__(self, storage=None):
        self.storage = storage or defaultdict(lambda: defaultdict(int))
        self.blocked = set()
    
    def is_rate_limited(self, key: str, limit: int, period: int) -> bool:
        """Check if key is rate limited"""
        if key in self.blocked:
            return True
        
        now = time.time()
        window = now - period
        
        # Clean old requests
        self.storage[key] = {
            t: count for t, count in self.storage[key].items()
            if t > window
        }
        
        # Count requests
        total = sum(self.storage[key].values())
        
        if total >= limit:
            return True
        
        # Add current request
        self.storage[key][now] = self.storage[key].get(now, 0) + 1
        return False
    
    def block_key(self, key: str):
        """Block a key"""
        self.blocked.add(key)
    
    def unblock_key(self, key: str):
        """Unblock a key"""
        self.blocked.discard(key)

# ==================== REQUEST ID MIDDLEWARE ====================

def generate_request_id():
    """Generate unique request ID"""
    return f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:8]}"

class RequestIDMiddleware:
    """Add request ID to each request"""
    
    def __init__(self, app):
        self.app = app
    
    def __call__(self, environ, start_response):
        request_id = environ.get('HTTP_X_REQUEST_ID')
        if not request_id:
            request_id = generate_request_id()
        
        environ['REQUEST_ID'] = request_id
        
        def _start_response(status, headers, *args):
            headers.append(('X-Request-ID', request_id))
            return start_response(status, headers, *args)
        
        return self.app(environ, _start_response)

# ==================== IP BLOCKING MIDDLEWARE ====================

class IPBlockMiddleware:
    """Block specific IP addresses"""
    
    def __init__(self, app, blocked_ips=None):
        self.app = app
        self.blocked_ips = set(blocked_ips or [])
    
    def __call__(self, environ, start_response):
        client_ip = self.get_client_ip(environ)
        
        if client_ip in self.blocked_ips:
            response = Response(
                json.dumps({
                    'success': False,
                    'error': {
                        'code': 'IP_BLOCKED',
                        'message': 'Your IP has been blocked',
                        'status_code': 403
                    }
                }),
                status=403,
                headers={'Content-Type': 'application/json'}
            )
            return response(environ, start_response)
        
        return self.app(environ, start_response)
    
    def get_client_ip(self, environ):
        """Get client IP"""
        forwarded = environ.get('HTTP_X_FORWARDED_FOR')
        if forwarded:
            return forwarded.split(',')[0].strip()
        return environ.get('REMOTE_ADDR', 'unknown')
    
    def block_ip(self, ip):
        """Block an IP"""
        self.blocked_ips.add(ip)
    
    def unblock_ip(self, ip):
        """Unblock an IP"""
        self.blocked_ips.discard(ip)

# ==================== USER AGENT BLOCKING ====================

class UserAgentBlockMiddleware:
    """Block specific user agents"""
    
    def __init__(self, app, blocked_agents=None, blocked_patterns=None):
        self.app = app
        self.blocked_agents = set(blocked_agents or [])
        self.blocked_patterns = [re.compile(p) for p in (blocked_patterns or [])]
    
    def __call__(self, environ, start_response):
        user_agent = environ.get('HTTP_USER_AGENT', '')
        
        # Check exact matches
        if user_agent in self.blocked_agents:
            return self.block_response(environ, start_response)
        
        # Check patterns
        for pattern in self.blocked_patterns:
            if pattern.search(user_agent):
                return self.block_response(environ, start_response)
        
        return self.app(environ, start_response)
    
    def block_response(self, environ, start_response):
        """Return block response"""
        response = Response(
            json.dumps({
                'success': False,
                'error': {
                    'code': 'USER_AGENT_BLOCKED',
                    'message': 'Access denied',
                    'status_code': 403
                }
            }),
            status=403,
            headers={'Content-Type': 'application/json'}
        )
        return response(environ, start_response)

# ==================== CORS MIDDLEWARE ====================

class CORSMiddleware:
    """CORS middleware with options"""
    
    def __init__(self, app, origins=None, methods=None, headers=None,
                 allow_credentials=True, max_age=86400):
        self.app = app
        self.origins = origins or ['*']
        self.methods = methods or ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
        self.headers = headers or ['Content-Type', 'Authorization', 'X-Request-ID']
        self.allow_credentials = allow_credentials
        self.max_age = max_age
    
    def __call__(self, environ, start_response):
        # Handle preflight
        if environ.get('REQUEST_METHOD') == 'OPTIONS':
            response = Response()
            response.headers.add('Access-Control-Allow-Origin', self.get_origin(environ))
            response.headers.add('Access-Control-Allow-Methods', ', '.join(self.methods))
            response.headers.add('Access-Control-Allow-Headers', ', '.join(self.headers))
            response.headers.add('Access-Control-Max-Age', str(self.max_age))
            if self.allow_credentials:
                response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response(environ, start_response)
        
        def _start_response(status, headers, *args):
            headers.append(('Access-Control-Allow-Origin', self.get_origin(environ)))
            if self.allow_credentials:
                headers.append(('Access-Control-Allow-Credentials', 'true'))
            return start_response(status, headers, *args)
        
        return self.app(environ, _start_response)
    
    def get_origin(self, environ):
        origin = environ.get('HTTP_ORIGIN')
        if '*' in self.origins or origin in self.origins:
            return origin or '*'
        return self.origins[0] if self.origins else '*'

# ==================== INITIALIZATION ====================

def init_utils_middleware(app):
    """Initialize all utility middleware"""
    
    # Register middleware
    app.wsgi_app = RequestIDMiddleware(app.wsgi_app)
    app.wsgi_app = SecurityHeadersMiddleware(app.wsgi_app)
    app.wsgi_app = CORSMiddleware(app.wsgi_app, origins=['*'])
    app.wsgi_app = PerformanceMiddleware(app.wsgi_app)
    
    # CompressionMiddleware is DISABLED to fix Content Encoding Error
    # app.wsgi_app = CompressionMiddleware(app.wsgi_app)
    
    app.wsgi_app = CacheControlMiddleware(app.wsgi_app)
    
    logger.info("Utility middleware initialized successfully")
    return app

# ==================== EXAMPLE USAGE ====================

if __name__ == '__main__':
    from flask import Flask
    
    app = Flask(__name__)
    
    # Initialize middleware
    init_utils_middleware(app)
    
    # Example route with decorators
    @app.route('/test')
    @log_request_middleware
    @error_handler_middleware
    @timing_middleware
    def test():
        return {'message': 'Test successful'}
    
    # Example route with validation
    @app.route('/register', methods=['POST'])
    @validate_json_middleware(required_fields=['email', 'password'])
    @validate_request_middleware({
        'email': RequestValidator.validate_email,
        'password': lambda x: len(x) >= 8
    })
    def register():
        data = g.validated_data
        return {'message': 'Registration successful'}
    
    # Example route with rate limiting
    @app.route('/api/data')
    @rate_limit_middleware(requests_per_minute=10)
    def get_data():
        return {'data': ['item1', 'item2']}
    
    print("✅ Utility middleware initialized!")
    print("\nAvailable middleware:")
    print("  - Request ID")
    print("  - Security Headers")
    print("  - CORS")
    print("  - Performance")
    print("  - Cache Control")
    print("  - Compression (DISABLED - Fixed Content Encoding Error)")