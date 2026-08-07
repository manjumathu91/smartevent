
"""
Configuration module for Smart Event Management System
All configuration settings in one place
"""

import os
from datetime import timedelta
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent


class Config:
    """
    Base Configuration
    """

    # ==========================================================
    # Flask
    # ==========================================================

    SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-change-me-in-production")
    ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = False
    TESTING = False

    # ==========================================================
    # Database
    # ==========================================================

    # Create instance directory if it doesn't exist
    INSTANCE_DIR = BASE_DIR / "instance"
    INSTANCE_DIR.mkdir(exist_ok=True)

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{INSTANCE_DIR / 'event_management.db'}"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False

    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "pool_size": 10,
        "max_overflow": 20,
        "pool_timeout": 30,
    }

    # ==========================================================
    # JWT
    # ==========================================================

    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY",
        "jwt-secret-key-change-me-in-production"
    )

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", 2)))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES", 30)))

    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"
    JWT_COOKIE_SECURE = False
    JWT_COOKIE_CSRF_PROTECT = False
    JWT_CSRF_IN_COOKIES = False

    # ==========================================================
    # Upload Folder
    # ==========================================================

    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", 16 * 1024 * 1024))  # 16MB

    ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"}
    ALLOWED_DOCUMENT_EXTENSIONS = {"pdf", "doc", "docx", "txt", "rtf", "odt"}
    ALLOWED_VIDEO_EXTENSIONS = {"mp4", "avi", "mov", "wmv", "flv", "mkv", "webm"}
    ALLOWED_AUDIO_EXTENSIONS = {"mp3", "wav", "ogg", "flac", "aac"}

    # ==========================================================
    # Mail Configuration
    # ==========================================================

    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "True").lower() in ["true", "1", "t"]
    MAIL_USE_SSL = os.getenv("MAIL_USE_SSL", "False").lower() in ["true", "1", "t"]
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER", MAIL_USERNAME)
    MAIL_MAX_EMAILS = int(os.getenv("MAIL_MAX_EMAILS", 50))
    MAIL_ASCII_ATTACHMENTS = False

    # ==========================================================
    # Flask Cache
    # ==========================================================

    CACHE_TYPE = os.getenv("CACHE_TYPE", "SimpleCache")
    CACHE_DEFAULT_TIMEOUT = int(os.getenv("CACHE_DEFAULT_TIMEOUT", 300))
    CACHE_REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CACHE_KEY_PREFIX = "eventhub_"

    # ==========================================================
    # Flask Limiter
    # ==========================================================

    RATELIMIT_HEADERS_ENABLED = True
    RATELIMIT_STORAGE_URL = os.getenv("RATELIMIT_STORAGE_URL", "memory://")
    RATELIMIT_DEFAULT = os.getenv("RATELIMIT_DEFAULT", "200 per day;50 per hour")
    RATELIMIT_STRATEGY = "fixed-window"
    RATELIMIT_SWALLOW_ERRORS = False

    # ==========================================================
    # CORS
    # ==========================================================

    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    CORS_HEADERS = ["Content-Type", "Authorization", "X-Request-ID"]
    CORS_METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
    CORS_SUPPORTS_CREDENTIALS = True

    # ==========================================================
    # Pagination
    # ==========================================================

    EVENTS_PER_PAGE = int(os.getenv("EVENTS_PER_PAGE", 12))
    BOOKINGS_PER_PAGE = int(os.getenv("BOOKINGS_PER_PAGE", 10))
    USERS_PER_PAGE = int(os.getenv("USERS_PER_PAGE", 20))
    REVIEWS_PER_PAGE = int(os.getenv("REVIEWS_PER_PAGE", 10))
    NOTIFICATIONS_PER_PAGE = int(os.getenv("NOTIFICATIONS_PER_PAGE", 20))

    # ==========================================================
    # Session
    # ==========================================================

    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = False
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)

    # ==========================================================
    # Security
    # ==========================================================

    JSON_SORT_KEYS = False
    JSONIFY_PRETTYPRINT_REGULAR = True
    PROPAGATE_EXCEPTIONS = True
    PRESERVE_CONTEXT_ON_EXCEPTION = False

    # ==========================================================
    # Password Policy
    # ==========================================================

    PASSWORD_MIN_LENGTH = int(os.getenv("PASSWORD_MIN_LENGTH", 8))
    PASSWORD_REQUIRE_UPPERCASE = True
    PASSWORD_REQUIRE_LOWERCASE = True
    PASSWORD_REQUIRE_NUMBERS = True
    PASSWORD_REQUIRE_SPECIAL = True

    # ==========================================================
    # Rate Limiting Specifics
    # ==========================================================

    RATELIMIT_AUTH = os.getenv("RATELIMIT_AUTH", "5 per minute;30 per hour")
    RATELIMIT_API = os.getenv("RATELIMIT_API", "100 per minute;500 per hour")
    RATELIMIT_ADMIN = os.getenv("RATELIMIT_ADMIN", "50 per minute;200 per hour")

    # ==========================================================
    # Razorpay (Payment)
    # ==========================================================

    RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
    RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
    RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET")
    PAYMENT_CURRENCY = os.getenv("PAYMENT_CURRENCY", "INR")
    PAYMENT_CAPTURE = os.getenv("PAYMENT_CAPTURE", "True").lower() in ["true", "1", "t"]

    # ==========================================================
    # Sentry (Error Tracking)
    # ==========================================================

    SENTRY_DSN = os.getenv("SENTRY_DSN")
    SENTRY_ENVIRONMENT = os.getenv("SENTRY_ENVIRONMENT", "development")
    SENTRY_TRACES_SAMPLE_RATE = float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", 0.1))

    # ==========================================================
    # Logging
    # ==========================================================

    LOG_DIR = os.path.join(BASE_DIR, "logs")
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_MAX_BYTES = int(os.getenv("LOG_MAX_BYTES", 10 * 1024 * 1024))
    LOG_BACKUP_COUNT = int(os.getenv("LOG_BACKUP_COUNT", 30))
    LOG_CONSOLE_ENABLED = True
    LOG_FILE_ENABLED = True
    LOG_JSON_ENABLED = True
    LOG_COLOR_ENABLED = True

    # ==========================================================
    # Frontend
    # ==========================================================

    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    FRONTEND_API_URL = os.getenv("FRONTEND_API_URL", "http://localhost:5000/api")

    # ==========================================================
    # Booking Settings
    # ==========================================================

    MAX_BOOKING_QUANTITY = int(os.getenv("MAX_BOOKING_QUANTITY", 10))
    BOOKING_CANCELLATION_WINDOW = int(os.getenv("BOOKING_CANCELLATION_WINDOW", 24))  # Hours
    BOOKING_AUTO_CONFIRM = True

    # ==========================================================
    # Event Settings
    # ==========================================================

    EVENT_REGISTRATION_DEADLINE_DAYS = int(os.getenv("EVENT_REGISTRATION_DEADLINE_DAYS", 7))
    EVENT_MAX_SEATS = int(os.getenv("EVENT_MAX_SEATS", 10000))

    # ==========================================================
    # Miscellaneous
    # ==========================================================

    DEFAULT_LANGUAGE = os.getenv("DEFAULT_LANGUAGE", "en")
    TIMEZONE = os.getenv("TIMEZONE", "UTC")


class DevelopmentConfig(Config):
    """Development Configuration"""
    
    DEBUG = True
    ENV = "development"
    SQLALCHEMY_ECHO = True
    LOG_LEVEL = "DEBUG"
    
    # Development specific
    SESSION_COOKIE_SECURE = False
    CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173", "*"]
    JWT_COOKIE_SECURE = False
    RATELIMIT_ENABLED = False


class TestingConfig(Config):
    """Testing Configuration"""
    
    TESTING = True
    DEBUG = True
    ENV = "testing"
    
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_ECHO = False
    
    WTF_CSRF_ENABLED = False
    SESSION_COOKIE_SECURE = False
    JWT_COOKIE_SECURE = False
    
    RATELIMIT_ENABLED = False
    CACHE_TYPE = "NullCache"
    MAIL_SUPPRESS_SEND = True


class ProductionConfig(Config):
    """Production Configuration"""
    
    DEBUG = False
    ENV = "production"
    SQLALCHEMY_ECHO = False
    
    # Security
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True
    JWT_COOKIE_SECURE = True
    JWT_COOKIE_CSRF_PROTECT = True
    
    PREFERRED_URL_SCHEME = "https"
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "https://yourdomain.com").split(",")
    
    # Logging
    LOG_LEVEL = "WARNING"
    LOG_CONSOLE_ENABLED = False
    LOG_FILE_ENABLED = True
    LOG_JSON_ENABLED = True
    
    # Rate Limiting
    RATELIMIT_ENABLED = True
    
    # Cache
    CACHE_TYPE = "RedisCache"
    CACHE_REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://user:password@localhost/eventhub_db"
    )
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "pool_size": 20,
        "max_overflow": 40,
        "pool_timeout": 30,
    }


class StagingConfig(ProductionConfig):
    """Staging Configuration"""
    
    ENV = "staging"
    DEBUG = False
    LOG_LEVEL = "INFO"
    SESSION_COOKIE_SECURE = True
    CORS_ORIGINS = ["https://staging.yourdomain.com"]


# Configuration dictionary
config = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "staging": StagingConfig,
    "default": DevelopmentConfig,
}


def get_config():
    """Get current configuration based on environment"""
    env = os.getenv("FLASK_ENV", "development")
    return config.get(env, DevelopmentConfig)