
from datetime import datetime
import json
from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
import hashlib
from sqlalchemy import Index, UniqueConstraint
from datetime import datetime, timedelta

# Custom JSON field for SQLite
class JSONEncodedDict(db.TypeDecorator):
    impl = db.Text
    
    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value)
        return value
    
    def process_result_value(self, value, dialect):
        if value is not None:
            try:
                return json.loads(value)
            except:
                return []
        return value

# Association Tables
event_organizers = db.Table('event_organizers',
    db.Column('event_id', db.Integer, db.ForeignKey('events.id', ondelete='CASCADE')),
    db.Column('user_id', db.Integer, db.ForeignKey('users.id', ondelete='CASCADE')),
    db.PrimaryKeyConstraint('event_id', 'user_id')
)

event_attendees = db.Table('event_attendees',
    db.Column('event_id', db.Integer, db.ForeignKey('events.id', ondelete='CASCADE')),
    db.Column('user_id', db.Integer, db.ForeignKey('users.id', ondelete='CASCADE')),
    db.PrimaryKeyConstraint('event_id', 'user_id')
)

# Models
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(20))
    profile_image = db.Column(db.String(200))
    bio = db.Column(db.Text)
    role = db.Column(db.String(20), default='user', index=True)
    status = db.Column(db.String(20), default='active', index=True)
    email_verified = db.Column(db.Boolean, default=True)
    email_verification_token = db.Column(db.String(100))
    reset_password_token = db.Column(db.String(100))
    reset_password_expires = db.Column(db.DateTime)
    last_login = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    bookings = db.relationship('Booking', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    reviews = db.relationship('Review', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    notifications = db.relationship('Notification', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    events = db.relationship('Event', secondary=event_organizers, back_populates='organizers')
    attending_events = db.relationship('Event', secondary=event_attendees, back_populates='attendees')
    
    __table_args__ = (
        Index('ix_users_email_status', 'email', 'status'),
        UniqueConstraint('email', 'username', name='uq_user_email_username'),
    )
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def generate_email_verification_token(self):
        token = hashlib.sha256(f"{self.email}{datetime.utcnow()}".encode()).hexdigest()
        self.email_verification_token = token
        return token
    
    def generate_reset_password_token(self):
        token = hashlib.sha256(f"{self.id}{self.email}{datetime.utcnow()}".encode()).hexdigest()
        self.reset_password_token = token
        self.reset_password_expires = datetime.utcnow() + timedelta(hours=24)
        return token
    
    def to_dict(self):
        try:
            return {
                'id': self.id,
                'username': self.username,
                'email': self.email,
                'phone': self.phone,
                'profile_image': self.profile_image,
                'bio': self.bio,
                'role': self.role,
                'status': self.status,
                'email_verified': self.email_verified,
                'last_login': self.last_login.isoformat() if self.last_login else None,
                'created_at': self.created_at.isoformat() if self.created_at else None,
                'bookings_count': self.bookings.count(),
                'events_count': len(self.events),
                'reviews_count': self.reviews.count()
            }
        except Exception as e:
            return {
                'id': self.id,
                'username': self.username,
                'email': self.email,
                'role': self.role
            }

class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False, index=True)
    slug = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(200))
    icon = db.Column(db.String(50))
    color = db.Column(db.String(7), default='#6366f1')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    events = db.relationship('Event', backref='category', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        try:
            return {
                'id': self.id,
                'name': self.name,
                'slug': self.slug,
                'description': self.description,
                'icon': self.icon,
                'color': self.color,
                'is_active': self.is_active,
                'event_count': self.events.count()
            }
        except Exception as e:
            return {
                'id': self.id,
                'name': self.name,
                'slug': self.slug
            }

class Event(db.Model):
    __tablename__ = 'events'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False, index=True)
    slug = db.Column(db.String(200), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False, index=True)
    venue = db.Column(db.String(200), nullable=False)
    city = db.Column(db.String(100), nullable=False, index=True)
    address = db.Column(db.String(300))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    date = db.Column(db.DateTime, nullable=False, index=True)
    end_date = db.Column(db.DateTime)
    time = db.Column(db.String(50))
    duration = db.Column(db.String(50))
    contact_email = db.Column(db.String(120))
    contact_phone = db.Column(db.String(20))
    website = db.Column(db.String(200))
    image_url = db.Column(db.String(200))
    banner_url = db.Column(db.String(200))
    gallery_images = db.Column(db.Text, default='[]')
    video_url = db.Column(db.String(200))
    price = db.Column(db.Float, default=0.0)
    discount_price = db.Column(db.Float)
    total_seats = db.Column(db.Integer, nullable=False)
    available_seats = db.Column(db.Integer, nullable=False)
    registration_deadline = db.Column(db.DateTime)
    event_type = db.Column(db.String(20), default='offline', index=True)
    event_link = db.Column(db.String(200))
    location_url = db.Column(db.String(200))
    status = db.Column(db.String(20), default='draft', index=True)
    visibility = db.Column(db.String(20), default='public')
    tags = db.Column(db.String(200))
    schedule = db.Column(db.Text, default='[]')
    speakers = db.Column(db.Text, default='[]')
    sponsors = db.Column(db.Text, default='[]')
    is_featured = db.Column(db.Boolean, default=False)
    is_popular = db.Column(db.Boolean, default=False)
    views_count = db.Column(db.Integer, default=0)
    organizer_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    organizers = db.relationship('User', secondary=event_organizers, back_populates='events')
    attendees = db.relationship('User', secondary=event_attendees, back_populates='attending_events')
    bookings = db.relationship('Booking', backref='event', lazy='dynamic', cascade='all, delete-orphan')
    reviews = db.relationship('Review', backref='event', lazy='dynamic', cascade='all, delete-orphan')
    
    __table_args__ = (
        Index('ix_events_date_status', 'date', 'status'),
        Index('ix_events_category_status', 'category_id', 'status'),
        Index('ix_events_city_status', 'city', 'status'),
    )
    
    def to_dict(self):
        try:
            # Parse JSON fields safely
            gallery = []
            schedule_list = []
            speakers_list = []
            sponsors_list = []
            tags_list = []
            
            try:
                gallery = json.loads(self.gallery_images) if self.gallery_images else []
            except:
                gallery = []
            
            try:
                schedule_list = json.loads(self.schedule) if self.schedule else []
            except:
                schedule_list = []
            
            try:
                speakers_list = json.loads(self.speakers) if self.speakers else []
            except:
                speakers_list = []
            
            try:
                sponsors_list = json.loads(self.sponsors) if self.sponsors else []
            except:
                sponsors_list = []
            
            try:
                tags_list = self.tags.split(',') if self.tags else []
            except:
                tags_list = []
            
            return {
                'id': self.id,
                'title': self.title,
                'slug': self.slug,
                'description': self.description,
                'category': self.category.to_dict() if self.category else None,
                'venue': self.venue,
                'city': self.city,
                'address': self.address,
                'latitude': self.latitude,
                'longitude': self.longitude,
                'date': self.date.isoformat() if self.date else None,
                'end_date': self.end_date.isoformat() if self.end_date else None,
                'time': self.time,
                'duration': self.duration,
                'contact_email': self.contact_email,
                'contact_phone': self.contact_phone,
                'website': self.website,
                'image_url': self.image_url,
                'banner_url': self.banner_url,
                'gallery_images': gallery,
                'video_url': self.video_url,
                'price': float(self.price) if self.price else 0,
                'discount_price': float(self.discount_price) if self.discount_price else None,
                'total_seats': self.total_seats,
                'available_seats': self.available_seats,
                'registration_deadline': self.registration_deadline.isoformat() if self.registration_deadline else None,
                'event_type': self.event_type,
                'event_link': self.event_link,
                'location_url': self.location_url,
                'status': self.status,
                'visibility': self.visibility,
                'tags': tags_list,
                'schedule': schedule_list,
                'speakers': speakers_list,
                'sponsors': sponsors_list,
                'organizers': [organizer.to_dict() for organizer in self.organizers] if self.organizers else [],
                'is_featured': self.is_featured,
                'is_popular': self.is_popular,
                'views_count': self.views_count,
                'bookings_count': self.bookings.count() if self.bookings else 0,
                'reviews_count': self.reviews.count() if self.reviews else 0,
                'average_rating': self.get_average_rating(),
                'created_at': self.created_at.isoformat() if self.created_at else None,
                'updated_at': self.updated_at.isoformat() if self.updated_at else None
            }
        except Exception as e:
            print(f"Event.to_dict() error: {str(e)}")
            return {
                'id': self.id,
                'title': self.title,
                'slug': self.slug,
                'description': self.description,
                'venue': self.venue,
                'city': self.city,
                'price': float(self.price) if self.price else 0,
                'status': self.status
            }
    
    def get_average_rating(self):
        try:
            reviews = self.reviews.all()
            if not reviews:
                return 0
            total = sum(review.rating for review in reviews)
            return round(total / len(reviews), 1)
        except:
            return 0
    
    def increment_views(self):
        self.views_count += 1
        db.session.commit()

class Booking(db.Model):
    __tablename__ = 'bookings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False, index=True)
    booking_reference = db.Column(db.String(20), unique=True, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    booking_date = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    booking_status = db.Column(db.String(20), default='pending', index=True)
    qr_code = db.Column(db.Text)
    ticket_number = db.Column(db.String(50), unique=True)
    payment_status = db.Column(db.String(20), default='pending', index=True)
    payment_method = db.Column(db.String(50))
    transaction_id = db.Column(db.String(100))
    check_in_status = db.Column(db.Boolean, default=False)
    check_in_time = db.Column(db.DateTime)
    cancellation_reason = db.Column(db.Text)
    cancelled_at = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship with payment
    payments = db.relationship('Payment', backref='booking', lazy='dynamic', cascade='all, delete-orphan')
    
    __table_args__ = (
        Index('ix_bookings_user_event', 'user_id', 'event_id'),
        Index('ix_bookings_status_date', 'booking_status', 'booking_date'),
        UniqueConstraint('user_id', 'event_id', 'booking_status', name='uq_user_event_booking'),
    )
    
    def generate_booking_reference(self):
        import random
        import string
        return ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
    
    def to_dict(self):
        try:
            # Get event data safely
            event_data = None
            if self.event:
                try:
                    event_data = self.event.to_dict()
                except:
                    event_data = {
                        'id': self.event.id,
                        'title': self.event.title,
                        'date': self.event.date.isoformat() if self.event.date else None,
                        'venue': self.event.venue,
                        'city': self.event.city,
                        'price': float(self.event.price) if self.event.price else 0
                    }
            
            # Get user data safely
            user_data = None
            if self.user:
                try:
                    user_data = self.user.to_dict()
                except:
                    user_data = {
                        'id': self.user.id,
                        'username': self.user.username,
                        'email': self.user.email
                    }
            
            return {
                'id': self.id,
                'user_id': self.user_id,
                'event_id': self.event_id,
                'booking_reference': self.booking_reference,
                'ticket_number': self.ticket_number,
                'quantity': self.quantity,
                'total_amount': float(self.total_amount) if self.total_amount else 0,
                'booking_status': self.booking_status,
                'payment_status': self.payment_status,
                'booking_date': self.booking_date.isoformat() if self.booking_date else None,
                'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
                'check_in_status': self.check_in_status,
                'check_in_time': self.check_in_time.isoformat() if self.check_in_time else None,
                'payment_method': self.payment_method,
                'qr_code': self.qr_code,
                'event': event_data,
                'user': user_data
            }
        except Exception as e:
            print(f"Booking.to_dict() error for {self.id}: {str(e)}")
            # Return minimal dict
            return {
                'id': self.id,
                'user_id': self.user_id,
                'event_id': self.event_id,
                'booking_reference': self.booking_reference,
                'booking_status': self.booking_status,
                'payment_status': self.payment_status,
                'total_amount': float(self.total_amount) if self.total_amount else 0,
                'quantity': self.quantity
            }

class Review(db.Model):
    __tablename__ = 'reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False, index=True)
    rating = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(100))
    review = db.Column(db.Text)
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        UniqueConstraint('user_id', 'event_id', name='uq_user_event_review'),
        Index('ix_reviews_event_rating', 'event_id', 'rating'),
    )
    
    def to_dict(self):
        try:
            return {
                'id': self.id,
                'user': self.user.to_dict() if self.user else None,
                'event_id': self.event_id,
                'rating': self.rating,
                'title': self.title,
                'review': self.review,
                'is_verified': self.is_verified,
                'created_at': self.created_at.isoformat() if self.created_at else None,
                'updated_at': self.updated_at.isoformat() if self.updated_at else None
            }
        except Exception as e:
            return {
                'id': self.id,
                'rating': self.rating,
                'title': self.title,
                'review': self.review
            }

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    title = db.Column(db.String(100), nullable=False)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='unread', index=True)
    type = db.Column(db.String(50), index=True)
    link = db.Column(db.String(200))
    icon = db.Column(db.String(50))
    priority = db.Column(db.String(20), default='normal')
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    read_at = db.Column(db.DateTime)
    
    def to_dict(self):
        try:
            return {
                'id': self.id,
                'title': self.title,
                'message': self.message,
                'status': self.status,
                'type': self.type,
                'link': self.link,
                'icon': self.icon,
                'priority': self.priority,
                'created_at': self.created_at.isoformat() if self.created_at else None,
                'read_at': self.read_at.isoformat() if self.read_at else None
            }
        except Exception as e:
            return {
                'id': self.id,
                'title': self.title,
                'message': self.message,
                'status': self.status
            }

class Payment(db.Model):
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False, index=True)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), default='USD')
    payment_method = db.Column(db.String(50))
    payment_status = db.Column(db.String(20), default='pending', index=True)
    transaction_id = db.Column(db.String(100), unique=True)
    payment_gateway = db.Column(db.String(50))
    gateway_response = db.Column(db.Text)
    refund_status = db.Column(db.String(20))
    refund_amount = db.Column(db.Float)
    refund_reason = db.Column(db.Text)
    refunded_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        try:
            return {
                'id': self.id,
                'booking_id': self.booking_id,
                'amount': float(self.amount) if self.amount else 0,
                'currency': self.currency,
                'payment_method': self.payment_method,
                'payment_status': self.payment_status,
                'transaction_id': self.transaction_id,
                'payment_gateway': self.payment_gateway,
                'refund_status': self.refund_status,
                'refund_amount': float(self.refund_amount) if self.refund_amount else 0,
                'refund_reason': self.refund_reason,
                'refunded_at': self.refunded_at.isoformat() if self.refunded_at else None,
                'created_at': self.created_at.isoformat() if self.created_at else None
            }
        except Exception as e:
            return {
                'id': self.id,
                'booking_id': self.booking_id,
                'amount': float(self.amount) if self.amount else 0,
                'payment_status': self.payment_status
            }

class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True)
    action = db.Column(db.String(50), nullable=False, index=True)
    resource_type = db.Column(db.String(50), index=True)
    resource_id = db.Column(db.Integer)
    details = db.Column(db.Text)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(200))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    user = db.relationship('User', backref='activity_logs')
    
    def to_dict(self):
        try:
            details = {}
            if self.details:
                try:
                    details = json.loads(self.details)
                except:
                    details = {'raw': self.details}
            
            return {
                'id': self.id,
                'user_id': self.user_id,
                'user': self.user.to_dict() if self.user else None,
                'action': self.action,
                'resource_type': self.resource_type,
                'resource_id': self.resource_id,
                'details': details,
                'ip_address': self.ip_address,
                'user_agent': self.user_agent,
                'timestamp': self.timestamp.isoformat() if self.timestamp else None
            }
        except Exception as e:
            return {
                'id': self.id,
                'user_id': self.user_id,
                'action': self.action,
                'timestamp': self.timestamp.isoformat() if self.timestamp else None
            }

class NewsletterSubscriber(db.Model):
    __tablename__ = 'newsletter_subscribers'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    subscribed_at = db.Column(db.DateTime, default=datetime.utcnow)
    unsubscribed_at = db.Column(db.DateTime)
    
    def to_dict(self):
        try:
            return {
                'id': self.id,
                'email': self.email,
                'is_active': self.is_active,
                'subscribed_at': self.subscribed_at.isoformat() if self.subscribed_at else None,
                'unsubscribed_at': self.unsubscribed_at.isoformat() if self.unsubscribed_at else None
            }
        except Exception as e:
            return {
                'id': self.id,
                'email': self.email,
                'is_active': self.is_active
            }