
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db, cache
from models import Event, Category, User, Review, ActivityLog, Notification, Booking
from utils.validators import validate_event_date, validate_seats
from utils.file_handlers import upload_file, delete_file
from datetime import datetime
from sqlalchemy import or_, and_, func
import json
import re
from slugify import slugify

events_bp = Blueprint('events', __name__)

# ==================== GET ALL EVENTS ====================

@events_bp.route('/', methods=['GET'])
def get_events():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '')
    category = request.args.get('category', '')
    city = request.args.get('city', '')
    event_type = request.args.get('event_type', '')
    status = request.args.get('status', 'approved')
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    date_from = request.args.get('date_from', '')
    date_to = request.args.get('date_to', '')
    sort_by = request.args.get('sort_by', 'date')
    sort_order = request.args.get('sort_order', 'asc')
    featured = request.args.get("featured")

    query = Event.query.filter_by(status=status, visibility='public')
    
    # Search
    if search:
        query = query.filter(
            or_(
                Event.title.ilike(f'%{search}%'),
                Event.description.ilike(f'%{search}%'),
                Event.venue.ilike(f'%{search}%'),
                Event.city.ilike(f'%{search}%'),
                Event.tags.ilike(f'%{search}%')
            )
        )
    
    # Category filter
    if category:
        query = query.join(Category).filter(Category.slug == category)
    
    # City filter
    if city:
        query = query.filter(Event.city.ilike(f'%{city}%'))
    
    # Event type filter
    if event_type:
        query = query.filter_by(event_type=event_type)
    
    # Price range
    if min_price is not None:
        query = query.filter(Event.price >= min_price)
    if max_price is not None:
        query = query.filter(Event.price <= max_price)
    
    # Date range
    if date_from:
        query = query.filter(Event.date >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.filter(Event.date <= datetime.fromisoformat(date_to))
    
    # Featured
    if featured is not None:
        featured = featured.lower() == "true"
        query = query.filter_by(is_featured=featured)
    
    # Sorting
    if sort_by == 'date':
        order_col = Event.date
    elif sort_by == 'price':
        order_col = Event.price
    elif sort_by == 'popularity':
        query = query.outerjoin(Booking).group_by(Event.id)
        order_col = func.count(Booking.id)
    elif sort_by == 'views':
        order_col = Event.views_count
    else:
        order_col = Event.created_at

    if sort_order == 'desc':
        query = query.order_by(order_col.desc())
    else:
        query = query.order_by(order_col.asc())
    
    # Pagination
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'events': [event.to_dict() for event in paginated.items],
        'total': paginated.total,
        'page': page,
        'pages': paginated.pages,
        'per_page': per_page
    }), 200

# ==================== GET CATEGORIES ====================

@events_bp.route('/categories/', methods=['GET'])
def get_categories():
    """Get all event categories"""
    try:
        categories = Category.query.filter_by(is_active=True).all()
        return jsonify({
            'success': True,
            'categories': [category.to_dict() for category in categories]
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== GET EVENT DETAILS ====================

@events_bp.route('/<int:event_id>', methods=['GET'])
def get_event(event_id):
    event = Event.query.get(event_id)
    
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    if event.status != 'approved' and event.visibility != 'public':
        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                from flask_jwt_extended import decode_token
                token = auth_header.split(' ')[1]
                decoded = decode_token(token)
                user_id = decoded['sub']
                user = User.query.get(user_id)
                if user and (user.role == 'admin' or any(o.id == user_id for o in event.organizers)):
                    pass
                else:
                    return jsonify({'error': 'Event not available'}), 403
            except:
                return jsonify({'error': 'Event not available'}), 403
        else:
            return jsonify({'error': 'Event not available'}), 403
    
    event.increment_views()
    
    return jsonify(event.to_dict()), 200

# ==================== CREATE EVENT ====================

@events_bp.route('/', methods=['POST'])
@jwt_required()
def create_event():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    required_fields = ['title', 'description', 'category_id', 'venue', 'city', 'date', 'total_seats']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    category = Category.query.get(data['category_id'])
    if not category:
        return jsonify({'error': 'Invalid category'}), 400
    
    try:
        event_date = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
        if not validate_event_date(event_date):
            return jsonify({'error': 'Event date must be in the future'}), 400
    except:
        return jsonify({'error': 'Invalid date format'}), 400
    
    if not validate_seats(data['total_seats']):
        return jsonify({'error': 'Invalid seat count'}), 400
    
    slug = slugify(data['title'])
    if Event.query.filter_by(slug=slug).first():
        slug = f"{slug}-{datetime.utcnow().timestamp()}"
    
    event = Event(
        title=data['title'],
        slug=slug,
        description=data['description'],
        category_id=data['category_id'],
        venue=data['venue'],
        city=data['city'],
        address=data.get('address'),
        date=event_date,
        time=data.get('time'),
        duration=data.get('duration'),
        contact_email=data.get('contact_email'),
        contact_phone=data.get('contact_phone'),
        price=data.get('price', 0.0),
        total_seats=data['total_seats'],
        available_seats=data['total_seats'],
        registration_deadline=datetime.fromisoformat(data['registration_deadline'].replace('Z', '+00:00')) if data.get('registration_deadline') else None,
        event_type=data.get('event_type', 'offline'),
        event_link=data.get('event_link'),
        location_url=data.get('location_url'),
        tags=','.join(data.get('tags', [])) if data.get('tags') else None,
        status='pending',
        visibility=data.get('visibility', 'public')
    )
    
    db.session.add(event)
    db.session.commit()
    
    user = User.query.get(user_id)
    event.organizers.append(user)
    db.session.commit()
    
    log = ActivityLog(
        user_id=user_id,
        action='create_event',
        resource_type='event',
        resource_id=event.id,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({
        'message': 'Event created successfully',
        'event': event.to_dict()
    }), 201

# ==================== UPDATE EVENT ====================

@events_bp.route('/<int:event_id>', methods=['PUT'])
@jwt_required()
def update_event(event_id):
    user_id = int(get_jwt_identity())
    event = Event.query.get(event_id)
    
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    user = User.query.get(user_id)
    is_organizer = any(o.id == user_id for o in event.organizers)
    if not is_organizer and user.role != 'admin':
        return jsonify({'error': 'Permission denied'}), 403
    
    data = request.get_json()
    
    if data.get('title'):
        event.title = data['title']
        event.slug = slugify(data['title'])
    
    if data.get('description'):
        event.description = data['description']
    
    if data.get('category_id'):
        category = Category.query.get(data['category_id'])
        if category:
            event.category_id = data['category_id']
    
    if data.get('venue'):
        event.venue = data['venue']
    
    if data.get('city'):
        event.city = data['city']
    
    if data.get('address'):
        event.address = data['address']
    
    if data.get('date'):
        event.date = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
    
    if data.get('time'):
        event.time = data['time']
    
    if data.get('duration'):
        event.duration = data['duration']
    
    if data.get('price') is not None:
        event.price = data['price']
    
    if data.get('total_seats'):
        seats_diff = data['total_seats'] - event.total_seats
        event.total_seats = data['total_seats']
        event.available_seats += seats_diff
    
    if data.get('event_type'):
        event.event_type = data['event_type']
    
    if data.get('status') and user.role == 'admin':
        event.status = data['status']
    
    if data.get('visibility'):
        event.visibility = data['visibility']
    
    if data.get('tags'):
        event.tags = ','.join(data.get('tags', []))
    
    if data.get('schedule'):
        event.schedule = json.dumps(data['schedule'])
    
    if data.get('speakers'):
        event.speakers = json.dumps(data['speakers'])
    
    if data.get('sponsors'):
        event.sponsors = json.dumps(data['sponsors'])
    
    db.session.commit()
    cache.clear()
    
    log = ActivityLog(
        user_id=user_id,
        action='update_event',
        resource_type='event',
        resource_id=event.id,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({
        'message': 'Event updated successfully',
        'event': event.to_dict()
    }), 200

# ==================== DELETE EVENT ====================

@events_bp.route('/<int:event_id>', methods=['DELETE'])
@jwt_required()
def delete_event(event_id):
    user_id = int(get_jwt_identity())
    event = Event.query.get(event_id)
    
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    user = User.query.get(user_id)
    is_organizer = any(o.id == user_id for o in event.organizers)
    if not is_organizer and user.role != 'admin':
        return jsonify({'error': 'Permission denied'}), 403
    
    if event.image_url:
        delete_file(event.image_url)
    if event.banner_url:
        delete_file(event.banner_url)
    if event.gallery_images:
        for img in json.loads(event.gallery_images):
            delete_file(img)
    
    db.session.delete(event)
    db.session.commit()
    cache.clear()
    
    return jsonify({'message': 'Event deleted successfully'}), 200

# ==================== GET EVENT REVIEWS ====================

@events_bp.route('/<int:event_id>/reviews', methods=['GET'])
def get_event_reviews(event_id):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    paginated = Review.query.filter_by(event_id=event_id).order_by(
        Review.created_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'reviews': [review.to_dict() for review in paginated.items],
        'total': paginated.total,
        'page': page,
        'pages': paginated.pages
    }), 200

# ==================== CREATE REVIEW ====================

@events_bp.route('/<int:event_id>/reviews', methods=['POST'])
@jwt_required()
def create_review(event_id):
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data.get('rating'):
        return jsonify({'error': 'Rating is required'}), 400
    
    if not 1 <= data['rating'] <= 5:
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400
    
    booking = Booking.query.filter_by(
        user_id=user_id,
        event_id=event_id,
        booking_status='confirmed'
    ).first()
    
    if not booking:
        return jsonify({'error': 'You must book this event to review it'}), 403
    
    existing = Review.query.filter_by(user_id=user_id, event_id=event_id).first()
    if existing:
        return jsonify({'error': 'You already reviewed this event'}), 400
    
    review = Review(
        user_id=user_id,
        event_id=event_id,
        rating=data['rating'],
        title=data.get('title'),
        review=data.get('review'),
        is_verified=True
    )
    
    db.session.add(review)
    db.session.commit()
    cache.clear()
    
    return jsonify({
        'message': 'Review submitted successfully',
        'review': review.to_dict()
    }), 201