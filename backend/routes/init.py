
from .auth import auth_bp
from .users import users_bp
from .categories import categories_bp
from .events import events_bp
from .bookings import bookings_bp
from .dashboard import dashboard_bp
from .admin import admin_bp
from .reviews import reviews_bp
from .payments import payments_bp

__all__ = [
    'auth_bp',
    'users_bp',
    'categories_bp',
    'events_bp',
    'bookings_bp',
    'dashboard_bp',
    'admin_bp',
    'reviews_bp',
    'payments_bp'
]