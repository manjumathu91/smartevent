from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db, cache
from models import Review, Event, User, Booking, ActivityLog, Notification
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_, desc, asc
from utils.validators import validate_rating, validate_review_text
from utils.notification import notification_service, NotificationType
import re

reviews_bp = Blueprint('reviews', __name__)

# ==================== CREATE REVIEW ====================

@reviews_bp.route('/', methods=['POST'])
@jwt_required()
def create_review():
    """Create a new review for an event"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate required fields
    if not data.get('event_id'):
        return jsonify({'error': 'Event ID is required'}), 400
    
    if not data.get('rating'):
        return jsonify({'error': 'Rating is required'}), 400
    
    # Validate rating
    if not validate_rating(data['rating']):
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400
    
    # Validate review text (optional)
    if data.get('review') and not validate_review_text(data['review']):
        return jsonify({'error': 'Review text is too long (maximum 2000 characters)'}), 400
    
    # Check if event exists
    event = Event.query.get(data['event_id'])
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    # Check if user has attended/booked this event
    has_booked = Booking.query.filter(
        Booking.user_id == user_id,
        Booking.event_id == event.id,
        Booking.booking_status == 'confirmed'
    ).first()
    
    if not has_booked:
        return jsonify({'error': 'You must attend this event to write a review'}), 403
    
    # Check if user already reviewed this event
    existing_review = Review.query.filter_by(
        user_id=user_id,
        event_id=event.id
    ).first()
    
    if existing_review:
        return jsonify({'error': 'You have already reviewed this event'}), 400
    
    # Check if event is completed or past
    if event.date > datetime.utcnow():
        return jsonify({'error': 'Cannot review an event that has not occurred yet'}), 400
    
    # Create review
    review = Review(
        user_id=user_id,
        event_id=event.id,
        rating=data['rating'],
        title=data.get('title', ''),
        review=data.get('review', ''),
        is_verified=has_booked is not None,
        created_at=datetime.utcnow()
    )
    
    db.session.add(review)
    db.session.commit()
    
    # Log activity
    log = ActivityLog(
        user_id=user_id,
        action='create_review',
        resource_type='review',
        resource_id=review.id,
        details=f"User {user_id} reviewed event {event.id} with rating {review.rating}",
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(log)
    db.session.commit()
    
    # Notify event organizers
    for organizer in event.organizers:
        notification_service.send_notification(
            user_id=organizer.id,
            title="New Review Received",
            message=f"{event.title} received a new review: {review.rating}⭐",
            notification_type=NotificationType.REVIEW_RESPONSE,
            channels=['in_app', 'email'],
            priority='high',
            link=f'/events/{event.id}/reviews',
            icon='⭐'
        )
    
    # Notify user about successful review
    notification_service.send_notification(
        user_id=user_id,
        title="Review Submitted",
        message=f"Your review for {event.title} has been submitted successfully!",
        notification_type='review_submitted',
        channels=['in_app'],
        priority='normal',
        link=f'/events/{event.id}',
        icon='✅'
    )
    
    # Clear cache
    cache.delete(f'event_{event.id}_reviews')
    cache.delete(f'event_{event.id}_rating')
    cache.delete(f'user_{user_id}_reviews')
    
    return jsonify({
        'message': 'Review submitted successfully',
        'review': review.to_dict()
    }), 201

# ==================== GET REVIEWS FOR EVENT ====================

@reviews_bp.route('/event/<int:event_id>', methods=['GET'])
def get_event_reviews(event_id):
    """Get all reviews for a specific event"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = request.args.get('sort_order', 'desc')
    rating_filter = request.args.get('rating', type=int)
    
    # Check if event exists
    event = Event.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    # Build query
    query = Review.query.filter_by(event_id=event_id)
    
    # Apply rating filter
    if rating_filter and 1 <= rating_filter <= 5:
        query = query.filter_by(rating=rating_filter)
    
    # Apply sorting
    if sort_by == 'rating':
        order_col = Review.rating
    elif sort_by == 'created_at':
        order_col = Review.created_at
    elif sort_by == 'helpful':
        order_col = Review.helpful_count
    else:
        order_col = Review.created_at
    
    if sort_order == 'desc':
        query = query.order_by(order_col.desc())
    else:
        query = query.order_by(order_col.asc())
    
    # Paginate
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    
    # Get rating breakdown
    rating_breakdown = db.session.query(
        Review.rating,
        func.count(Review.id).label('count')
    ).filter_by(event_id=event_id).group_by(Review.rating).all()
    
    rating_breakdown_dict = {r.rating: r.count for r in rating_breakdown}
    
    # Get total reviews and average rating
    total_reviews = event.reviews.count()
    average_rating = event.get_average_rating()
    
    # Get verified vs unverified count
    verified_count = Review.query.filter_by(event_id=event_id, is_verified=True).count()
    unverified_count = total_reviews - verified_count
    
    return jsonify({
        'reviews': [review.to_dict() for review in paginated.items],
        'pagination': {
            'total': paginated.total,
            'page': page,
            'pages': paginated.pages,
            'per_page': per_page
        },
        'stats': {
            'total_reviews': total_reviews,
            'average_rating': round(average_rating, 2),
            'rating_breakdown': rating_breakdown_dict,
            'verified_count': verified_count,
            'unverified_count': unverified_count
        }
    }), 200

# ==================== GET REVIEWS BY USER ====================

@reviews_bp.route('/user', methods=['GET'])
@jwt_required()
def get_user_reviews():
    """Get all reviews by the current user"""
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = request.args.get('sort_order', 'desc')
    
    query = Review.query.filter_by(user_id=user_id)
    
    # Apply sorting
    if sort_by == 'rating':
        order_col = Review.rating
    elif sort_by == 'created_at':
        order_col = Review.created_at
    else:
        order_col = Review.created_at
    
    if sort_order == 'desc':
        query = query.order_by(order_col.desc())
    else:
        query = query.order_by(order_col.asc())
    
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'reviews': [review.to_dict() for review in paginated.items],
        'pagination': {
            'total': paginated.total,
            'page': page,
            'pages': paginated.pages,
            'per_page': per_page
        }
    }), 200

# ==================== GET SPECIFIC REVIEW ====================

@reviews_bp.route('/<int:review_id>', methods=['GET'])
def get_review(review_id):
    """Get a specific review by ID"""
    review = Review.query.get(review_id)
    
    if not review:
        return jsonify({'error': 'Review not found'}), 404
    
    return jsonify(review.to_dict()), 200

# ==================== UPDATE REVIEW ====================

@reviews_bp.route('/<int:review_id>', methods=['PUT'])
@jwt_required()
def update_review(review_id):
    """Update a review"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    review = Review.query.get(review_id)
    
    if not review:
        return jsonify({'error': 'Review not found'}), 404
    
    # Check if user owns the review or is admin
    user = User.query.get(user_id)
    if review.user_id != user_id and user.role != 'admin':
        return jsonify({'error': 'Permission denied'}), 403
    
    # Check if review can be updated (within 30 days)
    if review.created_at < datetime.utcnow() - timedelta(days=30):
        return jsonify({'error': 'Reviews can only be updated within 30 days'}), 400
    
    # Update fields
    if data.get('rating'):
        if not validate_rating(data['rating']):
            return jsonify({'error': 'Rating must be between 1 and 5'}), 400
        review.rating = data['rating']
    
    if data.get('title'):
        review.title = data['title'][:100]  # Limit to 100 chars
    
    if data.get('review'):
        if not validate_review_text(data['review']):
            return jsonify({'error': 'Review text is too long (maximum 2000 characters)'}), 400
        review.review = data['review']
    
    review.updated_at = datetime.utcnow()
    db.session.commit()
    
    # Clear cache
    cache.delete(f'event_{review.event_id}_reviews')
    cache.delete(f'event_{review.event_id}_rating')
    cache.delete(f'user_{user_id}_reviews')
    
    return jsonify({
        'message': 'Review updated successfully',
        'review': review.to_dict()
    }), 200

# ==================== DELETE REVIEW ====================

@reviews_bp.route('/<int:review_id>', methods=['DELETE'])
@jwt_required()
def delete_review(review_id):
    """Delete a review"""
    user_id = get_jwt_identity()
    
    review = Review.query.get(review_id)
    
    if not review:
        return jsonify({'error': 'Review not found'}), 404
    
    # Check if user owns the review or is admin
    user = User.query.get(user_id)
    if review.user_id != user_id and user.role != 'admin':
        return jsonify({'error': 'Permission denied'}), 403
    
    event_id = review.event_id
    
    db.session.delete(review)
    db.session.commit()
    
    # Log activity
    log = ActivityLog(
        user_id=user_id,
        action='delete_review',
        resource_type='review',
        resource_id=review_id,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(log)
    db.session.commit()
    
    # Clear cache
    cache.delete(f'event_{event_id}_reviews')
    cache.delete(f'event_{event_id}_rating')
    cache.delete(f'user_{user_id}_reviews')
    
    return jsonify({'message': 'Review deleted successfully'}), 200

# ==================== MARK REVIEW AS HELPFUL ====================

@reviews_bp.route('/<int:review_id>/helpful', methods=['POST'])
@jwt_required()
def mark_review_helpful(review_id):
    """Mark a review as helpful"""
    user_id = get_jwt_identity()
    
    review = Review.query.get(review_id)
    
    if not review:
        return jsonify({'error': 'Review not found'}), 404
    
    # Check if user has already marked this review as helpful
    if user_id in review.helpful_users:
        return jsonify({'error': 'You have already marked this review as helpful'}), 400
    
    # Add user to helpful list
    if not review.helpful_users:
        review.helpful_users = []
    review.helpful_users.append(user_id)
    review.helpful_count = len(review.helpful_users)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Review marked as helpful',
        'helpful_count': review.helpful_count
    }), 200

# ==================== REMOVE HELPFUL MARK ====================

@reviews_bp.route('/<int:review_id>/helpful', methods=['DELETE'])
@jwt_required()
def remove_helpful_mark(review_id):
    """Remove helpful mark from a review"""
    user_id = get_jwt_identity()
    
    review = Review.query.get(review_id)
    
    if not review:
        return jsonify({'error': 'Review not found'}), 404
    
    # Check if user has marked this review as helpful
    if user_id not in (review.helpful_users or []):
        return jsonify({'error': 'You have not marked this review as helpful'}), 400
    
    # Remove user from helpful list
    review.helpful_users.remove(user_id)
    review.helpful_count = len(review.helpful_users)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Helpful mark removed',
        'helpful_count': review.helpful_count
    }), 200

# ==================== REPORT REVIEW ====================

@reviews_bp.route('/<int:review_id>/report', methods=['POST'])
@jwt_required()
def report_review(review_id):
    """Report a review for inappropriate content"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    review = Review.query.get(review_id)
    
    if not review:
        return jsonify({'error': 'Review not found'}), 404
    
    # Check if user has already reported this review
    if user_id in review.reported_by:
        return jsonify({'error': 'You have already reported this review'}), 400
    
    reason = data.get('reason', 'Inappropriate content')
    
    # Add user to reported list
    if not review.reported_by:
        review.reported_by = []
    review.reported_by.append(user_id)
    review.report_count = len(review.reported_by)
    
    db.session.commit()
    
    # Notify admin about reported review
    from models import User
    admins = User.query.filter_by(role='admin').all()
    for admin in admins:
        notification_service.send_notification(
            user_id=admin.id,
            title="Review Reported",
            message=f"A review has been reported by user {user_id}. Reason: {reason}",
            notification_type='review_report',
            channels=['in_app', 'email'],
            priority='high',
            link=f'/admin/reviews/{review_id}',
            icon='🚨'
        )
    
    return jsonify({
        'message': 'Review reported successfully',
        'report_count': review.report_count
    }), 200

# ==================== ADMIN - GET ALL REVIEWS ====================

@reviews_bp.route('/admin/all', methods=['GET'])
@jwt_required()
def admin_get_all_reviews():
    """Admin endpoint to get all reviews"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    search = request.args.get('search', '')
    rating = request.args.get('rating', type=int)
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = request.args.get('sort_order', 'desc')
    reported = request.args.get('reported', type=bool)
    
    query = Review.query
    
    # Apply filters
    if search:
        query = query.join(Event).join(User).filter(
            or_(
                Review.title.ilike(f'%{search}%'),
                Review.review.ilike(f'%{search}%'),
                Event.title.ilike(f'%{search}%'),
                User.username.ilike(f'%{search}%')
            )
        )
    
    if rating and 1 <= rating <= 5:
        query = query.filter_by(rating=rating)
    
    if reported:
        query = query.filter(Review.report_count > 0)
    
    # Apply sorting
    if sort_by == 'rating':
        order_col = Review.rating
    elif sort_by == 'created_at':
        order_col = Review.created_at
    elif sort_by == 'report_count':
        order_col = Review.report_count
    else:
        order_col = Review.created_at
    
    if sort_order == 'desc':
        query = query.order_by(order_col.desc())
    else:
        query = query.order_by(order_col.asc())
    
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'reviews': [review.to_dict() for review in paginated.items],
        'pagination': {
            'total': paginated.total,
            'page': page,
            'pages': paginated.pages,
            'per_page': per_page
        }
    }), 200

# ==================== ADMIN - DELETE REVIEW ====================

@reviews_bp.route('/admin/<int:review_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_review(review_id):
    """Admin endpoint to delete any review"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    review = Review.query.get(review_id)
    
    if not review:
        return jsonify({'error': 'Review not found'}), 404
    
    # Get user who wrote the review
    review_user = User.query.get(review.user_id)
    
    # Delete review
    db.session.delete(review)
    db.session.commit()
    
    # Notify user about deletion
    notification_service.send_notification(
        user_id=review_user.id,
        title="Review Deleted",
        message=f"Your review for event {review.event.title} has been deleted by admin.",
        notification_type='review_deleted',
        channels=['in_app', 'email'],
        priority='normal',
        icon='⚠️'
    )
    
    # Clear cache
    cache.delete(f'event_{review.event_id}_reviews')
    cache.delete(f'event_{review.event_id}_rating')
    
    return jsonify({'message': 'Review deleted successfully'}), 200

# ==================== GET REVIEW STATISTICS ====================

@reviews_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_review_statistics():
    """Get review statistics for the current user"""
    user_id = get_jwt_identity()
    
    # Total reviews by user
    total_reviews = Review.query.filter_by(user_id=user_id).count()
    
    # Average rating by user
    avg_rating = db.session.query(func.avg(Review.rating)).filter_by(user_id=user_id).scalar() or 0
    
    # Most helpful reviews
    most_helpful = Review.query.filter_by(user_id=user_id).order_by(
        Review.helpful_count.desc()
    ).limit(5).all()
    
    # Rating distribution
    rating_distribution = db.session.query(
        Review.rating,
        func.count(Review.id).label('count')
    ).filter_by(user_id=user_id).group_by(Review.rating).all()
    
    # Activity timeline (last 6 months)
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    monthly_reviews = db.session.query(
        func.strftime('%Y-%m', Review.created_at).label('month'),
        func.count(Review.id).label('count')
    ).filter(
        Review.user_id == user_id,
        Review.created_at >= six_months_ago
    ).group_by(func.strftime('%Y-%m', Review.created_at)).order_by('month').all()
    
    return jsonify({
        'total_reviews': total_reviews,
        'average_rating': round(avg_rating, 2),
        'most_helpful': [review.to_dict() for review in most_helpful],
        'rating_distribution': [
            {'rating': r.rating, 'count': r.count}
            for r in rating_distribution
        ],
        'monthly_reviews': [
            {'month': m.month, 'count': m.count}
            for m in monthly_reviews
        ]
    }), 200

# ==================== GET EVENT RATING SUMMARY ====================

@reviews_bp.route('/event/<int:event_id>/rating-summary', methods=['GET'])
def get_event_rating_summary(event_id):
    """Get rating summary for an event"""
    event = Event.query.get(event_id)
    
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    total_reviews = Review.query.filter_by(event_id=event_id).count()
    average_rating = event.get_average_rating()
    
    # Get rating breakdown
    rating_breakdown = db.session.query(
        Review.rating,
        func.count(Review.id).label('count')
    ).filter_by(event_id=event_id).group_by(Review.rating).all()
    
    # Calculate percentages
    rating_distribution = []
    for r in range(5, 0, -1):
        count = next((rb.count for rb in rating_breakdown if rb.rating == r), 0)
        percentage = (count / total_reviews * 100) if total_reviews > 0 else 0
        rating_distribution.append({
            'rating': r,
            'count': count,
            'percentage': round(percentage, 2)
        })
    
    # Get recent reviews (last 5)
    recent_reviews = Review.query.filter_by(event_id=event_id).order_by(
        Review.created_at.desc()
    ).limit(5).all()
    
    return jsonify({
        'event_id': event_id,
        'event_title': event.title,
        'total_reviews': total_reviews,
        'average_rating': round(average_rating, 2),
        'rating_distribution': rating_distribution,
        'recent_reviews': [review.to_dict() for review in recent_reviews]
    }), 200

# ==================== RESPOND TO REVIEW (Admin/Organizer) ====================

@reviews_bp.route('/<int:review_id>/respond', methods=['POST'])
@jwt_required()
def respond_to_review(review_id):
    """Respond to a review (admin or event organizer)"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    review = Review.query.get(review_id)
    
    if not review:
        return jsonify({'error': 'Review not found'}), 404
    
    # Check if user is admin or event organizer
    user = User.query.get(user_id)
    event = Event.query.get(review.event_id)
    is_organizer = any(o.id == user_id for o in event.organizers)
    
    if user.role != 'admin' and not is_organizer:
        return jsonify({'error': 'Permission denied'}), 403
    
    response_text = data.get('response')
    if not response_text:
        return jsonify({'error': 'Response text is required'}), 400
    
    review.response = response_text
    review.response_by = user_id
    review.response_at = datetime.utcnow()
    
    db.session.commit()
    
    # Notify reviewer
    notification_service.send_notification(
        user_id=review.user_id,
        title="Review Response",
        message=f"Organizer has responded to your review for {event.title}",
        notification_type='review_response',
        channels=['in_app', 'email'],
        priority='normal',
        link=f'/events/{event.id}',
        icon='💬'
    )
    
    return jsonify({
        'message': 'Response added successfully',
        'review': review.to_dict()
    }), 200

# ==================== SEARCH REVIEWS ====================

@reviews_bp.route('/search', methods=['GET'])
def search_reviews():
    """Search reviews by keyword"""
    query_text = request.args.get('q', '')
    limit = request.args.get('limit', 20, type=int)
    
    if not query_text:
        return jsonify({'error': 'Search query is required'}), 400
    
    # Search in review text and title
    results = Review.query.filter(
        or_(
            Review.title.ilike(f'%{query_text}%'),
            Review.review.ilike(f'%{query_text}%')
        )
    ).order_by(Review.created_at.desc()).limit(limit).all()
    
    return jsonify({
        'query': query_text,
        'results': [review.to_dict() for review in results],
        'total': len(results)
    }), 200

# ==================== HELPER FUNCTIONS ====================

def get_event_rating_stats(event_id):
    """Helper function to get rating stats for an event"""
    total_reviews = Review.query.filter_by(event_id=event_id).count()
    
    if total_reviews == 0:
        return {
            'total': 0,
            'average': 0,
            'distribution': {}
        }
    
    avg_rating = db.session.query(func.avg(Review.rating)).filter_by(event_id=event_id).scalar()
    
    distribution = db.session.query(
        Review.rating,
        func.count(Review.id).label('count')
    ).filter_by(event_id=event_id).group_by(Review.rating).all()
    
    return {
        'total': total_reviews,
        'average': round(avg_rating or 0, 2),
        'distribution': {r.rating: r.count for r in distribution}
    }

def get_user_review_stats(user_id):
    """Helper function to get review stats for a user"""
    total_reviews = Review.query.filter_by(user_id=user_id).count()
    
    if total_reviews == 0:
        return {
            'total': 0,
            'average': 0,
            'most_helpful': None
        }
    
    avg_rating = db.session.query(func.avg(Review.rating)).filter_by(user_id=user_id).scalar()
    
    most_helpful = Review.query.filter_by(user_id=user_id).order_by(
        Review.helpful_count.desc()
    ).first()
    
    return {
        'total': total_reviews,
        'average': round(avg_rating or 0, 2),
        'most_helpful': most_helpful.to_dict() if most_helpful else None
    }

# ==================== BULK REVIEW OPERATIONS ====================

@reviews_bp.route('/bulk', methods=['POST'])
@jwt_required()
def bulk_create_reviews():
    """Create multiple reviews at once (admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    data = request.get_json()
    reviews_data = data.get('reviews', [])
    
    if not reviews_data:
        return jsonify({'error': 'No reviews provided'}), 400
    
    created = []
    failed = []
    
    for review_data in reviews_data:
        try:
            # Validate required fields
            if not review_data.get('event_id') or not review_data.get('user_id'):
                failed.append({
                    'data': review_data,
                    'error': 'Missing event_id or user_id'
                })
                continue
            
            event = Event.query.get(review_data['event_id'])
            if not event:
                failed.append({
                    'data': review_data,
                    'error': 'Event not found'
                })
                continue
            
            user_to_review = User.query.get(review_data['user_id'])
            if not user_to_review:
                failed.append({
                    'data': review_data,
                    'error': 'User not found'
                })
                continue
            
            # Create review
            review = Review(
                user_id=review_data['user_id'],
                event_id=review_data['event_id'],
                rating=review_data.get('rating', 5),
                title=review_data.get('title', ''),
                review=review_data.get('review', ''),
                is_verified=review_data.get('is_verified', False),
                created_at=datetime.utcnow()
            )
            
            db.session.add(review)
            created.append(review)
            
        except Exception as e:
            failed.append({
                'data': review_data,
                'error': str(e)
            })
    
    db.session.commit()
    
    # Clear cache
    for review in created:
        cache.delete(f'event_{review.event_id}_reviews')
        cache.delete(f'event_{review.event_id}_rating')
    
    return jsonify({
        'message': f'Created {len(created)} reviews',
        'created': len(created),
        'failed': len(failed),
        'failed_details': failed
    }), 201

# ==================== REVIEW ANALYTICS ====================

@reviews_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_review_analytics():
    """Get analytics for reviews (admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    # Get date range
    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Total reviews in period
    total_reviews = Review.query.filter(Review.created_at >= start_date).count()
    
    # Average rating
    avg_rating = db.session.query(func.avg(Review.rating)).filter(
        Review.created_at >= start_date
    ).scalar() or 0
    
    # Reviews by rating
    rating_distribution = db.session.query(
        Review.rating,
        func.count(Review.id).label('count')
    ).filter(
        Review.created_at >= start_date
    ).group_by(Review.rating).order_by(Review.rating.desc()).all()
    
    # Daily review trends
    daily_trends = db.session.query(
        func.date(Review.created_at).label('date'),
        func.count(Review.id).label('count')
    ).filter(
        Review.created_at >= start_date
    ).group_by(func.date(Review.created_at)).order_by('date').all()
    
    # Most reviewed events
    most_reviewed = db.session.query(
        Event.id,
        Event.title,
        func.count(Review.id).label('review_count')
    ).join(Review).filter(
        Review.created_at >= start_date
    ).group_by(Event.id).order_by(
        func.count(Review.id).desc()
    ).limit(10).all()
    
    # Top reviewers
    top_reviewers = db.session.query(
        User.id,
        User.username,
        func.count(Review.id).label('review_count'),
        func.avg(Review.rating).label('avg_rating')
    ).join(Review).filter(
        Review.created_at >= start_date
    ).group_by(User.id).order_by(
        func.count(Review.id).desc()
    ).limit(10).all()
    
    return jsonify({
        'period': {
            'days': days,
            'start_date': start_date.isoformat(),
            'end_date': datetime.utcnow().isoformat()
        },
        'total_reviews': total_reviews,
        'average_rating': round(avg_rating, 2),
        'rating_distribution': [
            {'rating': r.rating, 'count': r.count}
            for r in rating_distribution
        ],
        'daily_trends': [
            {'date': t.date, 'count': t.count}
            for t in daily_trends
        ],
        'most_reviewed_events': [
            {'id': e.id, 'title': e.title, 'review_count': e.review_count}
            for e in most_reviewed
        ],
        'top_reviewers': [
            {
                'id': u.id,
                'username': u.username,
                'review_count': u.review_count,
                'avg_rating': round(u.avg_rating, 2)
            }
            for u in top_reviewers
        ]
    }), 200

# Register blueprint
def init_reviews(app):
    """Initialize reviews blueprint"""
    app.register_blueprint(reviews_bp, url_prefix='/api/reviews')
    return app