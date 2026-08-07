
"""
Validators - Complete validation system
"""

import os
import re
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple, Union
import logging

logger = logging.getLogger(__name__)

# ==================== CONSTANTS ====================

PATTERNS = {
    'email': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    'username': r'^[a-zA-Z0-9_.-]{3,30}$',
    'phone': r'^\+?[0-9]{10,15}$',
    'url': r'^https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+',
    'slug': r'^[a-z0-9]+(?:-[a-z0-9]+)*$',
    'alphanumeric': r'^[a-zA-Z0-9]+$',
    'alphanumeric_space': r'^[a-zA-Z0-9\s]+$',
    'numeric': r'^[0-9]+$',
    'decimal': r'^[0-9]+(\.[0-9]+)?$',
}

# ==================== SAFE IMPORTS ====================

try:
    import bleach
    HAS_BLEACH = True
except ImportError:
    HAS_BLEACH = False

try:
    import phonenumbers
    HAS_PHONENUMBERS = True
except ImportError:
    HAS_PHONENUMBERS = False

try:
    from email_validator import validate_email as validate_email_lib, EmailNotValidError
    HAS_EMAIL_VALIDATOR = True
except ImportError:
    HAS_EMAIL_VALIDATOR = False
    validate_email_lib = None
    EmailNotValidError = None

try:
    import imghdr
    HAS_IMGHDR = True
except ImportError:
    HAS_IMGHDR = False

# ==================== VALIDATION RESULT ====================

class ValidationResult:
    """Validation result container"""
    
    def __init__(self, valid: bool = True, errors: List[str] = None, 
                 data: Any = None, warnings: List[str] = None):
        self.valid = valid
        self.errors = errors or []
        self.data = data
        self.warnings = warnings or []
    
    def add_error(self, error: str):
        self.errors.append(error)
        self.valid = False
    
    def add_warning(self, warning: str):
        self.warnings.append(warning)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'valid': self.valid,
            'errors': self.errors,
            'warnings': self.warnings,
            'data': self.data
        }
    
    @classmethod
    def success(cls, data: Any = None, warnings: List[str] = None):
        return cls(valid=True, data=data, warnings=warnings)
    
    @classmethod
    def failure(cls, error: Union[str, List[str]], data: Any = None):
        errors = [error] if isinstance(error, str) else error
        return cls(valid=False, errors=errors, data=data)

# ==================== BASIC VALIDATORS ====================

def validate_required(value: Any, field_name: str = 'Field') -> ValidationResult:
    """Validate that a value is not empty"""
    if value is None or value == '' or value == [] or value == {}:
        return ValidationResult.failure(f"{field_name} is required")
    
    if isinstance(value, str) and not value.strip():
        return ValidationResult.failure(f"{field_name} is required")
    
    return ValidationResult.success(value)

def validate_string(value: Any, min_length: int = 0, max_length: int = None,
                    field_name: str = 'Field') -> ValidationResult:
    """Validate a string value"""
    result = validate_required(value, field_name)
    if not result.valid:
        return result
    
    if not isinstance(value, str):
        return ValidationResult.failure(f"{field_name} must be a string")
    
    if min_length > 0 and len(value) < min_length:
        return ValidationResult.failure(f"{field_name} must be at least {min_length} characters")
    
    if max_length and len(value) > max_length:
        return ValidationResult.failure(f"{field_name} must be at most {max_length} characters")
    
    return ValidationResult.success(value)

# ==================== EMAIL VALIDATOR ====================

def validate_email(email: str) -> ValidationResult:
    """Validate email address"""
    if not email:
        return ValidationResult.failure("Email is required")
    
    if not re.match(PATTERNS['email'], email):
        return ValidationResult.failure("Invalid email format")
    
    if HAS_EMAIL_VALIDATOR and validate_email_lib:
        try:
            validated = validate_email_lib(email, check_deliverability=False)
            return ValidationResult.success(validated.email)
        except EmailNotValidError as e:
            return ValidationResult.failure(f"Invalid email: {str(e)}")
        except Exception as e:
            logger.warning(f"Email validation error: {str(e)}")
    
    return ValidationResult.success(email)

# ==================== PHONE VALIDATOR ====================

def validate_phone(phone: str) -> ValidationResult:
    """Validate phone number"""
    if not phone:
        return ValidationResult.failure("Phone number is required")
    
    if HAS_PHONENUMBERS:
        try:
            phone_clean = re.sub(r'[\s\-()]', '', phone)
            parsed = phonenumbers.parse(phone_clean, None)
            if not phonenumbers.is_valid_number(parsed):
                return ValidationResult.failure("Invalid phone number")
            formatted = phonenumbers.format_number(
                parsed, 
                phonenumbers.PhoneNumberFormat.INTERNATIONAL
            )
            return ValidationResult.success(formatted)
        except:
            pass
    
    # Fallback to regex
    if re.match(PATTERNS['phone'], phone):
        return ValidationResult.success(phone)
    return ValidationResult.failure("Invalid phone number")

# ==================== PASSWORD VALIDATOR ====================

def validate_password(password: str, min_length: int = 8) -> ValidationResult:
    """Validate password strength"""
    if not password:
        return ValidationResult.failure("Password is required")
    
    errors = []
    warnings = []
    strength_score = 0
    
    if len(password) < min_length:
        errors.append(f"Password must be at least {min_length} characters long")
    elif len(password) >= 12:
        strength_score += 1
    
    if not re.search(r'[A-Z]', password):
        errors.append("Password must contain at least one uppercase letter")
    else:
        strength_score += 1
    
    if not re.search(r'[a-z]', password):
        errors.append("Password must contain at least one lowercase letter")
    else:
        strength_score += 1
    
    if not re.search(r'[0-9]', password):
        errors.append("Password must contain at least one number")
    else:
        strength_score += 1
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        warnings.append("Password should contain at least one special character")
    else:
        strength_score += 1
    
    if strength_score >= 5:
        strength = 'strong'
    elif strength_score >= 3:
        strength = 'medium'
    else:
        strength = 'weak'
    
    if errors:
        return ValidationResult.failure(errors)
    
    result = ValidationResult.success(password)
    result.data = {'strength': strength, 'score': strength_score}
    result.warnings = warnings
    return result

# ==================== USERNAME VALIDATOR ====================

def validate_username(username: str) -> ValidationResult:
    """Validate username"""
    if not username:
        return ValidationResult.failure("Username is required")
    
    if len(username) < 3:
        return ValidationResult.failure("Username must be at least 3 characters")
    
    if len(username) > 30:
        return ValidationResult.failure("Username must be at most 30 characters")
    
    if not re.match(PATTERNS['username'], username):
        return ValidationResult.failure("Username can only contain letters, numbers, dots, underscores, and hyphens")
    
    return ValidationResult.success(username)

# ==================== URL VALIDATOR ====================

def validate_url(url: str) -> ValidationResult:
    """Validate URL"""
    if not url:
        return ValidationResult.failure("URL is required")
    
    if not re.match(PATTERNS['url'], url):
        return ValidationResult.failure("Invalid URL format")
    
    return ValidationResult.success(url)

# ==================== DATE VALIDATORS ====================

def validate_date(date_str: str, format: str = '%Y-%m-%d') -> ValidationResult:
    """Validate date string"""
    if not date_str:
        return ValidationResult.failure("Date is required")
    
    try:
        date_obj = datetime.strptime(date_str, format)
        return ValidationResult.success(date_obj)
    except ValueError:
        return ValidationResult.failure(f"Invalid date format. Expected {format}")

def validate_datetime(dt_str: str) -> ValidationResult:
    """Validate datetime string (ISO format)"""
    if not dt_str:
        return ValidationResult.failure("Datetime is required")
    
    try:
        dt_obj = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
        return ValidationResult.success(dt_obj)
    except ValueError:
        return ValidationResult.failure("Invalid datetime format")

def validate_future_date(date_obj: datetime, allow_today: bool = False) -> ValidationResult:
    """Validate that date is in the future"""
    if not date_obj:
        return ValidationResult.failure("Date is required")
    
    now = datetime.utcnow()
    if allow_today:
        if date_obj < now.replace(hour=0, minute=0, second=0, microsecond=0):
            return ValidationResult.failure("Date must be today or in the future")
    else:
        if date_obj <= now:
            return ValidationResult.failure("Date must be in the future")
    
    return ValidationResult.success(date_obj)

# ==================== NUMBER VALIDATORS ====================

def validate_number(value: Any, min_val: float = None, max_val: float = None,
                    field_name: str = 'Field') -> ValidationResult:
    """Validate numeric value"""
    if value is None:
        return ValidationResult.failure(f"{field_name} is required")
    
    try:
        num = float(value)
    except (ValueError, TypeError):
        return ValidationResult.failure(f"{field_name} must be a number")
    
    if min_val is not None and num < min_val:
        return ValidationResult.failure(f"{field_name} must be at least {min_val}")
    
    if max_val is not None and num > max_val:
        return ValidationResult.failure(f"{field_name} must be at most {max_val}")
    
    return ValidationResult.success(num)

def validate_integer(value: Any, min_val: int = None, max_val: int = None,
                     field_name: str = 'Field') -> ValidationResult:
    """Validate integer value"""
    if value is None:
        return ValidationResult.failure(f"{field_name} is required")
    
    try:
        num = int(value)
    except (ValueError, TypeError):
        return ValidationResult.failure(f"{field_name} must be an integer")
    
    if min_val is not None and num < min_val:
        return ValidationResult.failure(f"{field_name} must be at least {min_val}")
    
    if max_val is not None and num > max_val:
        return ValidationResult.failure(f"{field_name} must be at most {max_val}")
    
    return ValidationResult.success(num)

# ==================== RATING VALIDATOR ====================

def validate_rating(rating: int) -> ValidationResult:
    """Validate rating (1-5)"""
    if rating is None:
        return ValidationResult.failure("Rating is required")
    
    try:
        rating = int(rating)
    except (ValueError, TypeError):
        return ValidationResult.failure("Rating must be a number")
    
    if rating < 1 or rating > 5:
        return ValidationResult.failure("Rating must be between 1 and 5")
    
    return ValidationResult.success(rating)

# ==================== REVIEW TEXT VALIDATOR ====================

def validate_review_text(text: str, min_length: int = 0, max_length: int = 2000) -> ValidationResult:
    """
    Validate review text
    
    Args:
        text: Review text to validate
        min_length: Minimum length (default: 0)
        max_length: Maximum length (default: 2000)
    
    Returns:
        ValidationResult
    """
    if text is None:
        return ValidationResult.success('')
    
    if not isinstance(text, str):
        return ValidationResult.failure("Review text must be a string")
    
    # Check length
    if len(text) < min_length:
        return ValidationResult.failure(f"Review text must be at least {min_length} characters")
    
    if len(text) > max_length:
        return ValidationResult.failure(f"Review text must be at most {max_length} characters")
    
    # Sanitize text (remove excessive whitespace)
    text = ' '.join(text.split())
    
    return ValidationResult.success(text)

# ==================== SEAT AND PRICE VALIDATORS ====================

def validate_seats(seats: int, max_seats: int = 10000) -> ValidationResult:
    """Validate seat count"""
    if seats is None:
        return ValidationResult.failure("Seats count is required")
    
    try:
        seats = int(seats)
    except (ValueError, TypeError):
        return ValidationResult.failure("Seats must be a number")
    
    if seats <= 0:
        return ValidationResult.failure("Seats must be greater than 0")
    
    if seats > max_seats:
        return ValidationResult.failure(f"Seats cannot exceed {max_seats}")
    
    return ValidationResult.success(seats)

def validate_price(price: float) -> ValidationResult:
    """Validate price"""
    if price is None:
        return ValidationResult.failure("Price is required")
    
    try:
        price = float(price)
    except (ValueError, TypeError):
        return ValidationResult.failure("Price must be a number")
    
    if price < 0:
        return ValidationResult.failure("Price cannot be negative")
    
    price = round(price, 2)
    
    return ValidationResult.success(price)

# ==================== EVENT DATE VALIDATOR ====================

def validate_event_date(event_date: datetime, registration_deadline: datetime = None) -> ValidationResult:
    """Validate event date with registration deadline"""
    if not event_date:
        return ValidationResult.failure("Event date is required")
    
    result = validate_future_date(event_date, allow_today=True)
    if not result.valid:
        return result
    
    if registration_deadline:
        if registration_deadline >= event_date:
            return ValidationResult.failure("Registration deadline must be before event date")
        
        if registration_deadline <= datetime.utcnow():
            return ValidationResult.failure("Registration deadline has already passed")
    
    return ValidationResult.success(event_date)

# ==================== BOOKING QUANTITY VALIDATOR ====================

def validate_booking_quantity(quantity: int, available_seats: int, max_per_booking: int = 10) -> ValidationResult:
    """Validate booking quantity"""
    if quantity is None:
        return ValidationResult.failure("Quantity is required")
    
    try:
        quantity = int(quantity)
    except (ValueError, TypeError):
        return ValidationResult.failure("Quantity must be a number")
    
    if quantity <= 0:
        return ValidationResult.failure("Quantity must be at least 1")
    
    if quantity > max_per_booking:
        return ValidationResult.failure(f"Maximum {max_per_booking} tickets per booking")
    
    if quantity > available_seats:
        return ValidationResult.failure(f"Only {available_seats} seats available")
    
    return ValidationResult.success(quantity)

# ==================== SANITIZERS ====================

def sanitize_html(html: str) -> str:
    """Sanitize HTML content"""
    if not html:
        return ''
    
    if HAS_BLEACH:
        allowed_tags = [
            'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre', 'span', 'div'
        ]
        allowed_attributes = {
            'a': ['href', 'target', 'rel'],
            'img': ['src', 'alt', 'width', 'height'],
        }
        return bleach.clean(html, tags=allowed_tags, attributes=allowed_attributes, strip=True)
    
    return html

def sanitize_input(text: str, max_length: int = 1000) -> str:
    """Sanitize input text"""
    if not text:
        return ''
    
    text = re.sub(r'[<>]', '', text)
    
    if len(text) > max_length:
        text = text[:max_length]
    
    return text.strip()

def sanitize_filename(filename: str) -> str:
    """Sanitize filename"""
    if not filename:
        return ''
    
    filename = os.path.basename(filename)
    filename = re.sub(r'[<>:"/\\|?*]', '', filename)
    
    if len(filename) > 255:
        name, ext = os.path.splitext(filename)
        filename = name[:250] + ext
    
    return filename

# ==================== COMPOSITE VALIDATORS ====================

class ValidatorChain:
    """Chain multiple validators together"""
    
    def __init__(self, validators: List[callable] = None):
        self.validators = validators or []
    
    def add(self, validator: callable) -> 'ValidatorChain':
        self.validators.append(validator)
        return self
    
    def validate(self, value: Any) -> ValidationResult:
        current_value = value
        all_errors = []
        all_warnings = []
        
        for validator in self.validators:
            result = validator(current_value)
            if not result.valid:
                all_errors.extend(result.errors)
            if result.warnings:
                all_warnings.extend(result.warnings)
            if result.data is not None and result.data != current_value:
                current_value = result.data
        
        if all_errors:
            return ValidationResult.failure(all_errors, current_value)
        
        return ValidationResult.success(current_value, all_warnings)

# ==================== VALIDATOR FACTORY ====================

class ValidatorFactory:
    """Factory for creating validator chains"""
    
    @staticmethod
    def create_user_validator() -> ValidatorChain:
        return ValidatorChain([
            lambda data: validate_required(data, 'User data'),
            lambda data: validate_dict(data, ['username', 'email', 'password']),
            lambda data: validate_username(data.get('username')),
            lambda data: validate_email(data.get('email')),
            lambda data: validate_password(data.get('password')),
        ])
    
    @staticmethod
    def create_event_validator() -> ValidatorChain:
        return ValidatorChain([
            lambda data: validate_required(data, 'Event data'),
            lambda data: validate_dict(data, ['title', 'description', 'category_id', 'date']),
            lambda data: validate_string(data.get('title'), 1, 200, 'Title'),
            lambda data: validate_string(data.get('description'), 1, 5000, 'Description'),
            lambda data: validate_integer(data.get('category_id'), 1, 'Category ID'),
            lambda data: validate_date(data.get('date')),
        ])
    
    @staticmethod
    def create_booking_validator() -> ValidatorChain:
        return ValidatorChain([
            lambda data: validate_required(data, 'Booking data'),
            lambda data: validate_dict(data, ['event_id', 'quantity']),
            lambda data: validate_integer(data.get('event_id'), 1, 'Event ID'),
            lambda data: validate_integer(data.get('quantity'), 1, 10, 'Quantity'),
        ])

# ==================== DICT VALIDATOR ====================

def validate_dict(data: Dict, required_fields: List[str] = None) -> ValidationResult:
    """Validate dictionary"""
    if data is None:
        return ValidationResult.failure("Data is required")
    
    if not isinstance(data, dict):
        return ValidationResult.failure("Data must be a dictionary")
    
    errors = []
    
    if required_fields:
        for field in required_fields:
            if field not in data or data[field] is None or data[field] == '':
                errors.append(f"Required field '{field}' is missing")
    
    if errors:
        return ValidationResult.failure(errors)
    
    return ValidationResult.success(data)

# ==================== INITIALIZATION ====================

def init_validators(app):
    """Initialize validators with Flask app"""
    app.config['VALIDATORS'] = {
        'email': validate_email,
        'phone': validate_phone,
        'password': validate_password,
        'username': validate_username,
        'url': validate_url,
        'date': validate_date,
        'datetime': validate_datetime,
        'rating': validate_rating,
        'review_text': validate_review_text,
        'seats': validate_seats,
        'price': validate_price,
    }
    
    logger.info("Validators initialized successfully")
    return app

# ==================== EXPORTS ====================

__all__ = [
    'ValidationResult',
    'validate_required',
    'validate_string',
    'validate_email',
    'validate_phone',
    'validate_password',
    'validate_username',
    'validate_url',
    'validate_date',
    'validate_datetime',
    'validate_future_date',
    'validate_number',
    'validate_integer',
    'validate_rating',
    'validate_review_text',
    'validate_seats',
    'validate_price',
    'validate_event_date',
    'validate_booking_quantity',
    'sanitize_html',
    'sanitize_input',
    'sanitize_filename',
    'ValidatorChain',
    'ValidatorFactory',
    'validate_dict',
    'init_validators',
]