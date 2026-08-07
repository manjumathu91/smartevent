
"""
Helpers - Complete utility functions
"""

import os
import re
import json
import uuid
import random
import string
import hashlib
import base64
import logging
from datetime import datetime, timedelta
from functools import wraps
from flask import jsonify, request, current_app
from typing import Dict, Any, List, Optional, Tuple
import io

logger = logging.getLogger(__name__)

# ==================== TOKEN AND REFERENCE GENERATORS ====================

def generate_token(length: int = 32) -> str:
    """Generate a secure random token"""
    import secrets
    return secrets.token_urlsafe(length)

def generate_otp(length: int = 6) -> str:
    """Generate a numeric OTP"""
    return ''.join(random.choices(string.digits, k=length))

def generate_reference(prefix: str = '', length: int = 10) -> str:
    """Generate a unique reference number"""
    timestamp = datetime.now().strftime('%Y%m%d')
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
    if prefix:
        return f"{prefix}-{timestamp}-{random_str}"
    return f"{timestamp}-{random_str}"

def generate_booking_reference(prefix: str = 'BK') -> str:
    """
    Generate a unique booking reference number
    """
    timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"{prefix}-{timestamp}-{random_str}"

def generate_ticket_number() -> str:
    """
    Generate a unique ticket number
    """
    timestamp = datetime.utcnow().strftime('%Y%m%d')
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"TKT-{timestamp}-{random_str}"

def generate_serial_number(prefix: str = '', length: int = 8) -> str:
    """Generate a serial number"""
    timestamp = datetime.now().strftime('%Y%m%d')
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
    if prefix:
        return f"{prefix}{timestamp}{random_str}"
    return f"{timestamp}{random_str}"

# ==================== PASSWORD HELPERS ====================

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    try:
        import bcrypt
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    except ImportError:
        # Fallback to hashlib
        return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash"""
    try:
        import bcrypt
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except ImportError:
        # Fallback to hashlib
        return hashlib.sha256(password.encode()).hexdigest() == hashed

# ==================== JWT & USER HELPERS ====================

def get_current_user():
    """Get current authenticated user"""
    try:
        from flask_jwt_extended import get_jwt_identity
        from models import User
        user_id = get_jwt_identity()
        return User.query.get(user_id)
    except:
        return None

def get_current_user_id():
    """Get current user ID"""
    try:
        from flask_jwt_extended import get_jwt_identity
        return get_jwt_identity()
    except:
        return None

def is_admin():
    """Check if current user is admin"""
    user = get_current_user()
    return user and user.role == 'admin'

def is_authenticated():
    """Check if user is authenticated"""
    try:
        from flask_jwt_extended import verify_jwt_in_request
        verify_jwt_in_request()
        return True
    except:
        return False

def admin_required(f):
    """Decorator for admin-only routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

def role_required(roles: List[str]):
    """Decorator for role-based access control"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user = get_current_user()
            if not user or user.role not in roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# ==================== RESPONSE HELPERS ====================

def success_response(data: Any = None, message: str = "Success", status_code: int = 200) -> tuple:
    """Create a success response"""
    response = {
        'success': True,
        'message': message,
        'timestamp': datetime.utcnow().isoformat()
    }
    if data is not None:
        response['data'] = data
    return jsonify(response), status_code

def error_response(message: str = "Error", error_code: str = "ERROR", 
                  status_code: int = 400, details: Any = None) -> tuple:
    """Create an error response"""
    response = {
        'success': False,
        'error': {
            'code': error_code,
            'message': message,
            'timestamp': datetime.utcnow().isoformat()
        }
    }
    if details is not None:
        response['error']['details'] = details
    return jsonify(response), status_code

def paginated_response(items: List[Any], total: int, page: int, per_page: int, 
                      item_key: str = 'items') -> dict:
    """Create a paginated response"""
    return {
        'success': True,
        'data': {
            item_key: items,
            'pagination': {
                'total': total,
                'page': page,
                'per_page': per_page,
                'pages': (total + per_page - 1) // per_page
            }
        }
    }

# ==================== DATE & TIME HELPERS ====================

def format_datetime(dt: datetime, format: str = '%Y-%m-%d %H:%M:%S') -> str:
    """Format datetime to string"""
    if not dt:
        return None
    return dt.strftime(format)

def parse_datetime(dt_str: str) -> Optional[datetime]:
    """Parse datetime from string"""
    try:
        return datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
    except:
        return None

def get_time_ago(dt: datetime) -> str:
    """Get human readable time ago"""
    if not dt:
        return ''
    
    now = datetime.utcnow()
    diff = now - dt
    
    seconds = diff.total_seconds()
    minutes = seconds / 60
    hours = minutes / 60
    days = hours / 24
    weeks = days / 7
    months = days / 30
    years = days / 365
    
    if seconds < 60:
        return f"{int(seconds)} seconds ago"
    elif minutes < 60:
        return f"{int(minutes)} minutes ago"
    elif hours < 24:
        return f"{int(hours)} hours ago"
    elif days < 7:
        return f"{int(days)} days ago"
    elif weeks < 4:
        return f"{int(weeks)} weeks ago"
    elif months < 12:
        return f"{int(months)} months ago"
    else:
        return f"{int(years)} years ago"

def get_date_range(days: int) -> Tuple[datetime, datetime]:
    """Get date range for past N days"""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    return start_date, end_date

def is_future_date(dt: datetime) -> bool:
    """Check if datetime is in the future"""
    return dt > datetime.utcnow()

def is_past_date(dt: datetime) -> bool:
    """Check if datetime is in the past"""
    return dt < datetime.utcnow()

def get_week_number(dt: datetime = None) -> int:
    """Get ISO week number"""
    if not dt:
        dt = datetime.now()
    return dt.isocalendar()[1]

def get_quarter(dt: datetime = None) -> int:
    """Get quarter of the year"""
    if not dt:
        dt = datetime.now()
    return (dt.month - 1) // 3 + 1

def get_fiscal_year(dt: datetime = None) -> int:
    """Get fiscal year (April to March)"""
    if not dt:
        dt = datetime.now()
    if dt.month >= 4:
        return dt.year
    return dt.year - 1

# ==================== STRING HELPERS ====================

def slugify(text: str) -> str:
    """Convert text to URL-friendly slug"""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')

def truncate_text(text: str, length: int = 100, suffix: str = '...') -> str:
    """Truncate text to specified length"""
    if len(text) <= length:
        return text
    return text[:length].rsplit(' ', 1)[0] + suffix

def sanitize_html(html: str) -> str:
    """Sanitize HTML content"""
    try:
        import bleach
        allowed_tags = [
            'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre', 'span', 'div'
        ]
        allowed_attributes = {
            'a': ['href', 'target', 'rel'],
            'img': ['src', 'alt', 'width', 'height']
        }
        return bleach.clean(html, tags=allowed_tags, attributes=allowed_attributes, strip=True)
    except ImportError:
        return html

def extract_mentions(text: str) -> List[str]:
    """Extract @mentions from text"""
    return re.findall(r'@(\w+)', text)

def extract_hashtags(text: str) -> List[str]:
    """Extract #hashtags from text"""
    return re.findall(r'#(\w+)', text)

# ==================== VALIDATION HELPERS ====================

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_phone(phone: str) -> bool:
    """Validate phone number"""
    phone = re.sub(r'[\s\-()]', '', phone)
    return bool(re.match(r'^\+?[0-9]{10,15}$', phone))

def validate_url(url: str) -> bool:
    """Validate URL"""
    pattern = r'^https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+'
    return bool(re.match(pattern, url))

def validate_username(username: str) -> bool:
    """Validate username"""
    pattern = r'^[a-zA-Z0-9_.-]{3,30}$'
    return bool(re.match(pattern, username))

def validate_password_strength(password: str) -> Dict[str, Any]:
    """Check password strength"""
    result = {
        'valid': True,
        'strength': 'weak',
        'score': 0,
        'errors': []
    }
    
    if len(password) < 8:
        result['valid'] = False
        result['errors'].append('Password must be at least 8 characters')
    
    if not re.search(r'[A-Z]', password):
        result['valid'] = False
        result['errors'].append('Password must contain at least one uppercase letter')
    
    if not re.search(r'[a-z]', password):
        result['valid'] = False
        result['errors'].append('Password must contain at least one lowercase letter')
    
    if not re.search(r'[0-9]', password):
        result['valid'] = False
        result['errors'].append('Password must contain at least one number')
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        result['valid'] = False
        result['errors'].append('Password must contain at least one special character')
    
    score = 0
    if len(password) >= 8:
        score += 1
    if len(password) >= 12:
        score += 1
    if re.search(r'[A-Z]', password):
        score += 1
    if re.search(r'[a-z]', password):
        score += 1
    if re.search(r'[0-9]', password):
        score += 1
    if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        score += 1
    
    result['score'] = score
    
    if score >= 5:
        result['strength'] = 'strong'
    elif score >= 3:
        result['strength'] = 'medium'
    else:
        result['strength'] = 'weak'
    
    return result

# ==================== FILE HELPERS ====================

def get_file_extension(filename: str) -> str:
    """Get file extension from filename"""
    return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''

def is_allowed_file(filename: str, allowed_extensions: List[str] = None) -> bool:
    """Check if file extension is allowed"""
    if not allowed_extensions:
        allowed_extensions = ['png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx', 'txt']
    ext = get_file_extension(filename)
    return ext in allowed_extensions

def generate_filename(original_filename: str, prefix: str = '') -> str:
    """Generate a unique filename"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    unique_id = uuid.uuid4().hex[:8]
    ext = get_file_extension(original_filename)
    
    if prefix:
        return f"{prefix}_{timestamp}_{unique_id}.{ext}"
    return f"{timestamp}_{unique_id}.{ext}"

def get_file_size_str(size_in_bytes: int) -> str:
    """Convert file size to human readable format"""
    units = ['B', 'KB', 'MB', 'GB', 'TB']
    size = float(size_in_bytes)
    unit_index = 0
    
    while size >= 1024 and unit_index < len(units) - 1:
        size /= 1024
        unit_index += 1
    
    return f"{size:.2f} {units[unit_index]}"

# ==================== QR CODE HELPERS ====================

def generate_qr_code(data: str, size: int = 10, border: int = 4) -> str:
    """Generate QR code as base64 string"""
    try:
        import qrcode
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=size,
            border=border,
        )
        qr.add_data(data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return f"data:image/png;base64,{img_str}"
    except ImportError:
        return ""

# ==================== PDF GENERATION HELPERS ====================

def generate_ticket_pdf(booking) -> io.BytesIO:
    """Generate ticket PDF for booking"""
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors
        from reportlab.lib.units import inch
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.blue,
            alignment=1
        )
        story.append(Paragraph("Event Ticket", title_style))
        story.append(Spacer(1, 0.25*inch))
        
        # Event details
        event = booking.event
        ticket_data = [
            ['Ticket Number', booking.ticket_number],
            ['Booking Reference', booking.booking_reference],
            ['Event', event.title],
            ['Date', event.date.strftime('%B %d, %Y')],
            ['Time', event.time],
            ['Venue', event.venue],
            ['City', event.city],
            ['Quantity', str(booking.quantity)],
            ['Total Amount', f"${booking.total_amount:.2f}"],
            ['Status', booking.booking_status.upper()]
        ]
        
        table = Table(ticket_data, colWidths=[2*inch, 3*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(table)
        story.append(Spacer(1, 0.25*inch))
        
        # Footer
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.grey,
            alignment=1
        )
        story.append(Paragraph("Thank you for booking with EventHub!", footer_style))
        story.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", footer_style))
        
        doc.build(story)
        buffer.seek(0)
        return buffer
    except ImportError:
        return io.BytesIO()

# ==================== DATA MANIPULATION HELPERS ====================

def dict_merge(dict1: Dict, dict2: Dict) -> Dict:
    """Deep merge two dictionaries"""
    result = dict1.copy()
    for key, value in dict2.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = dict_merge(result[key], value)
        else:
            result[key] = value
    return result

def flatten_dict(d: Dict, parent_key: str = '', sep: str = '_') -> Dict:
    """Flatten a nested dictionary"""
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)

def chunk_list(lst: List, chunk_size: int) -> List[List]:
    """Split list into chunks"""
    return [lst[i:i + chunk_size] for i in range(0, len(lst), chunk_size)]

def unique_list(lst: List) -> List:
    """Get unique items from list while preserving order"""
    seen = set()
    return [x for x in lst if x not in seen and not seen.add(x)]

# ==================== CACHE HELPERS ====================

def generate_cache_key(*args, **kwargs) -> str:
    """Generate a cache key from arguments"""
    key_parts = [str(arg) for arg in args]
    key_parts.extend([f"{k}={v}" for k, v in sorted(kwargs.items())])
    key_string = ':'.join(key_parts)
    return hashlib.md5(key_string.encode()).hexdigest()

def memoize(timeout: int = 300):
    """Memoization decorator with timeout"""
    def decorator(f):
        cache = {}
        @wraps(f)
        def decorated_function(*args, **kwargs):
            key = generate_cache_key(*args, **kwargs)
            if key in cache:
                value, timestamp = cache[key]
                if datetime.utcnow() - timestamp < timedelta(seconds=timeout):
                    return value
            result = f(*args, **kwargs)
            cache[key] = (result, datetime.utcnow())
            return result
        return decorated_function
    return decorator

# ==================== API HELPERS ====================

def get_client_ip() -> str:
    """Get client IP address"""
    from flask import request
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0]
    return request.remote_addr

def get_user_agent() -> str:
    """Get user agent from request"""
    from flask import request
    return request.headers.get('User-Agent', '')

def is_ajax_request() -> bool:
    """Check if request is AJAX"""
    from flask import request
    return request.headers.get('X-Requested-With') == 'XMLHttpRequest'

def get_request_data() -> Dict:
    """Get request data from JSON or form"""
    from flask import request
    if request.is_json:
        return request.get_json() or {}
    return request.form.to_dict() or {}

# ==================== LOGGING HELPERS ====================

def log_activity(user_id: int, action: str, resource_type: str = None, 
                resource_id: int = None, details: str = None, 
                ip_address: str = None, user_agent: str = None) -> None:
    """Log user activity"""
    try:
        from models import ActivityLog
        from extensions import db
        log = ActivityLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address or get_client_ip(),
            user_agent=user_agent or get_user_agent()
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        logger.error(f"Activity logging error: {str(e)}")

def log_exception(func):
    """Decorator to log exceptions"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            logger.error(f"Exception in {func.__name__}: {str(e)}")
            logger.exception(e)
            raise
    return wrapper

# ==================== MATH HELPERS ====================

def safe_divide(numerator: float, denominator: float, default: float = 0) -> float:
    """Safe division avoiding ZeroDivisionError"""
    if denominator == 0:
        return default
    return numerator / denominator

def percentage(part: float, whole: float) -> float:
    """Calculate percentage"""
    if whole == 0:
        return 0
    return (part / whole) * 100

# ==================== EXPORTS ====================

__all__ = [
    'generate_token',
    'generate_otp',
    'generate_reference',
    'generate_booking_reference',
    'generate_ticket_number',
    'generate_serial_number',
    'hash_password',
    'verify_password',
    'get_current_user',
    'get_current_user_id',
    'is_admin',
    'is_authenticated',
    'admin_required',
    'role_required',
    'success_response',
    'error_response',
    'paginated_response',
    'format_datetime',
    'parse_datetime',
    'get_time_ago',
    'get_date_range',
    'is_future_date',
    'is_past_date',
    'get_week_number',
    'get_quarter',
    'get_fiscal_year',
    'slugify',
    'truncate_text',
    'sanitize_html',
    'extract_mentions',
    'extract_hashtags',
    'validate_email',
    'validate_phone',
    'validate_url',
    'validate_username',
    'validate_password_strength',
    'get_file_extension',
    'is_allowed_file',
    'generate_filename',
    'get_file_size_str',
    'generate_qr_code',
    'generate_ticket_pdf',
    'dict_merge',
    'flatten_dict',
    'chunk_list',
    'unique_list',
    'generate_cache_key',
    'memoize',
    'get_client_ip',
    'get_user_agent',
    'is_ajax_request',
    'get_request_data',
    'log_activity',
    'log_exception',
    'safe_divide',
    'percentage'
]