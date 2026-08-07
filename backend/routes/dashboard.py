from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db, cache
from models import User, Event, Category, Booking, Payment, Review, ActivityLog
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_, extract, desc
from utils.helpers import admin_required
import json
import math

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
@cache.cached(timeout=300, key_prefix='dashboard_stats')
def get_dashboard_stats():
    """Get main dashboard statistics"""
    
    # Get current user
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Basic stats
    total_users = User.query.count()
    active_users = User.query.filter_by(status='active').count()
    blocked_users = User.query.filter_by(status='blocked').count()
    
    total_events = Event.query.count()
    active_events = Event.query.filter_by(status='approved').count()
    pending_events = Event.query.filter_by(status='pending').count()
    completed_events = Event.query.filter_by(status='completed').count()
    cancelled_events = Event.query.filter_by(status='cancelled').count()
    draft_events = Event.query.filter_by(status='draft').count()
    rejected_events = Event.query.filter_by(status='rejected').count()
    
    total_bookings = Booking.query.count()
    confirmed_bookings = Booking.query.filter_by(booking_status='confirmed').count()
    pending_bookings = Booking.query.filter_by(booking_status='pending').count()
    cancelled_bookings = Booking.query.filter_by(booking_status='cancelled').count()
    
    # Revenue calculations
    total_revenue = db.session.query(func.sum(Booking.total_amount)).filter(
        Booking.booking_status == 'confirmed'
    ).scalar() or 0
    
    today_revenue = db.session.query(func.sum(Booking.total_amount)).filter(
        Booking.booking_status == 'confirmed',
        func.date(Booking.booking_date) == datetime.utcnow().date()
    ).scalar() or 0
    
    week_revenue = db.session.query(func.sum(Booking.total_amount)).filter(
        Booking.booking_status == 'confirmed',
        Booking.booking_date >= datetime.utcnow() - timedelta(days=7)
    ).scalar() or 0
    
    month_revenue = db.session.query(func.sum(Booking.total_amount)).filter(
        Booking.booking_status == 'confirmed',
        Booking.booking_date >= datetime.utcnow() - timedelta(days=30)
    ).scalar() or 0
    
    # Payment stats
    total_payments = Payment.query.count()
    completed_payments = Payment.query.filter_by(payment_status='completed').count()
    pending_payments = Payment.query.filter_by(payment_status='pending').count()
    failed_payments = Payment.query.filter_by(payment_status='failed').count()
    refunded_payments = Payment.query.filter_by(payment_status='refunded').count()
    
    # Reviews
    total_reviews = Review.query.count()
    average_rating = db.session.query(func.avg(Review.rating)).scalar() or 0
    
    # User growth
    today_users = User.query.filter(func.date(User.created_at) == datetime.utcnow().date()).count()
    week_users = User.query.filter(User.created_at >= datetime.utcnow() - timedelta(days=7)).count()
    month_users = User.query.filter(User.created_at >= datetime.utcnow() - timedelta(days=30)).count()
    
    return jsonify({
        'users': {
            'total': total_users,
            'active': active_users,
            'blocked': blocked_users,
            'today': today_users,
            'week': week_users,
            'month': month_users
        },
        'events': {
            'total': total_events,
            'active': active_events,
            'pending': pending_events,
            'completed': completed_events,
            'cancelled': cancelled_events,
            'draft': draft_events,
            'rejected': rejected_events
        },
        'bookings': {
            'total': total_bookings,
            'confirmed': confirmed_bookings,
            'pending': pending_bookings,
            'cancelled': cancelled_bookings
        },
        'revenue': {
            'total': total_revenue,
            'today': today_revenue,
            'week': week_revenue,
            'month': month_revenue
        },
        'payments': {
            'total': total_payments,
            'completed': completed_payments,
            'pending': pending_payments,
            'failed': failed_payments,
            'refunded': refunded_payments
        },
        'reviews': {
            'total': total_reviews,
            'average_rating': round(average_rating, 2)
        }
    }), 200

@dashboard_bp.route('/charts/monthly-bookings', methods=['GET'])
@jwt_required()
def get_monthly_bookings():
    """Get monthly bookings data for charts"""
    
    months = request.args.get('months', 12, type=int)
    start_date = datetime.utcnow() - timedelta(days=months * 30)
    
    # Monthly bookings
    monthly_bookings = db.session.query(
        func.strftime('%Y-%m', Booking.booking_date).label('month'),
        func.count(Booking.id).label('count'),
        func.sum(Booking.total_amount).label('revenue')
    ).filter(
        Booking.booking_date >= start_date,
        Booking.booking_status == 'confirmed'
    ).group_by(func.strftime('%Y-%m', Booking.booking_date)).order_by('month').all()
    
    # Monthly user registrations
    monthly_users = db.session.query(
        func.strftime('%Y-%m', User.created_at).label('month'),
        func.count(User.id).label('count')
    ).filter(
        User.created_at >= start_date
    ).group_by(func.strftime('%Y-%m', User.created_at)).order_by('month').all()
    
    # Monthly events created
    monthly_events = db.session.query(
        func.strftime('%Y-%m', Event.created_at).label('month'),
        func.count(Event.id).label('count')
    ).filter(
        Event.created_at >= start_date
    ).group_by(func.strftime('%Y-%m', Event.created_at)).order_by('month').all()
    
    return jsonify({
        'bookings': [
            {'month': b.month, 'count': b.count, 'revenue': float(b.revenue or 0)}
            for b in monthly_bookings
        ],
        'users': [
            {'month': u.month, 'count': u.count}
            for u in monthly_users
        ],
        'events': [
            {'month': e.month, 'count': e.count}
            for e in monthly_events
        ]
    }), 200

@dashboard_bp.route('/charts/event-categories', methods=['GET'])
@jwt_required()
def get_event_category_stats():
    """Get event distribution by category"""
    
    category_stats = db.session.query(
        Category.name,
        Category.color,
        Category.icon,
        func.count(Event.id).label('count')
    ).outerjoin(Event).group_by(Category.id).order_by(
        func.count(Event.id).desc()
    ).all()
    
    return jsonify([
        {
            'name': c.name,
            'color': c.color,
            'icon': c.icon,
            'count': c.count
        }
        for c in category_stats
    ]), 200

@dashboard_bp.route('/charts/event-status', methods=['GET'])
@jwt_required()
def get_event_status_stats():
    """Get event distribution by status"""
    
    status_stats = db.session.query(
        Event.status,
        func.count(Event.id).label('count')
    ).group_by(Event.status).all()
    
    return jsonify([
        {'status': s.status, 'count': s.count}
        for s in status_stats
    ]), 200

@dashboard_bp.route('/charts/booking-status', methods=['GET'])
@jwt_required()
def get_booking_status_stats():
    """Get booking distribution by status"""
    
    status_stats = db.session.query(
        Booking.booking_status,
        func.count(Booking.id).label('count')
    ).group_by(Booking.booking_status).all()
    
    return jsonify([
        {'status': s.booking_status, 'count': s.count}
        for s in status_stats
    ]), 200

@dashboard_bp.route('/charts/popular-events', methods=['GET'])
@jwt_required()
def get_popular_events():
    """Get most popular events by bookings"""
    
    limit = request.args.get('limit', 10, type=int)
    
    popular_events = db.session.query(
        Event.id,
        Event.title,
        Event.image_url,
        func.count(Booking.id).label('booking_count'),
        func.sum(Booking.total_amount).label('revenue')
    ).outerjoin(Booking).filter(
        Booking.booking_status == 'confirmed'
    ).group_by(Event.id).order_by(
        func.count(Booking.id).desc()
    ).limit(limit).all()
    
    return jsonify([
        {
            'id': e.id,
            'title': e.title,
            'image_url': e.image_url,
            'booking_count': e.booking_count,
            'revenue': float(e.revenue or 0)
        }
        for e in popular_events
    ]), 200

@dashboard_bp.route('/charts/revenue-overview', methods=['GET'])
@jwt_required()
def get_revenue_overview():
    """Get revenue overview with trends"""
    
    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Daily revenue for the period
    daily_revenue = db.session.query(
        func.date(Booking.booking_date).label('date'),
        func.sum(Booking.total_amount).label('revenue'),
        func.count(Booking.id).label('bookings')
    ).filter(
        Booking.booking_date >= start_date,
        Booking.booking_status == 'confirmed'
    ).group_by(func.date(Booking.booking_date)).order_by('date').all()
    
    # Revenue by event type
    revenue_by_type = db.session.query(
        Event.event_type,
        func.sum(Booking.total_amount).label('revenue'),
        func.count(Booking.id).label('bookings')
    ).join(Event).filter(
        Booking.booking_status == 'confirmed'
    ).group_by(Event.event_type).all()
    
    # Revenue by city
    revenue_by_city = db.session.query(
        Event.city,
        func.sum(Booking.total_amount).label('revenue'),
        func.count(Booking.id).label('bookings')
    ).join(Event).filter(
        Booking.booking_status == 'confirmed'
    ).group_by(Event.city).order_by(
        func.sum(Booking.total_amount).desc()
    ).limit(10).all()
    
    return jsonify({
        'daily': [
            {
                'date': r.date,
                'revenue': float(r.revenue or 0),
                'bookings': r.bookings
            }
            for r in daily_revenue
        ],
        'by_type': [
            {
                'type': r.event_type,
                'revenue': float(r.revenue or 0),
                'bookings': r.bookings
            }
            for r in revenue_by_type
        ],
        'by_city': [
            {
                'city': r.city,
                'revenue': float(r.revenue or 0),
                'bookings': r.bookings
            }
            for r in revenue_by_city
        ]
    }), 200

@dashboard_bp.route('/charts/user-activity', methods=['GET'])
@jwt_required()
def get_user_activity():
    """Get user activity metrics"""
    
    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Daily active users (based on bookings and logins)
    daily_activity = db.session.query(
        func.date(ActivityLog.timestamp).label('date'),
        func.count(func.distinct(ActivityLog.user_id)).label('active_users'),
        func.count(ActivityLog.id).label('actions')
    ).filter(
        ActivityLog.timestamp >= start_date
    ).group_by(func.date(ActivityLog.timestamp)).order_by('date').all()
    
    # User activity by action type
    action_stats = db.session.query(
        ActivityLog.action,
        func.count(ActivityLog.id).label('count')
    ).filter(
        ActivityLog.timestamp >= start_date
    ).group_by(ActivityLog.action).order_by(
        func.count(ActivityLog.id).desc()
    ).limit(10).all()
    
    return jsonify({
        'daily': [
            {
                'date': a.date,
                'active_users': a.active_users,
                'actions': a.actions
            }
            for a in daily_activity
        ],
        'actions': [
            {
                'action': a.action,
                'count': a.count
            }
            for a in action_stats
        ]
    }), 200

@dashboard_bp.route('/charts/booking-analytics', methods=['GET'])
@jwt_required()
def get_booking_analytics():
    """Get detailed booking analytics"""
    
    # Booking trends by hour
    hourly_trends = db.session.query(
        extract('hour', Booking.booking_date).label('hour'),
        func.count(Booking.id).label('count')
    ).filter(
        Booking.booking_status == 'confirmed'
    ).group_by(extract('hour', Booking.booking_date)).order_by('hour').all()
    
    # Booking trends by day of week
    weekly_trends = db.session.query(
        extract('dow', Booking.booking_date).label('day_of_week'),
        func.count(Booking.id).label('count')
    ).filter(
        Booking.booking_status == 'confirmed'
    ).group_by(extract('dow', Booking.booking_date)).order_by('day_of_week').all()
    
    # Average booking value
    avg_booking_value = db.session.query(
        func.avg(Booking.total_amount).label('average'),
        func.min(Booking.total_amount).label('minimum'),
        func.max(Booking.total_amount).label('maximum')
    ).filter(
        Booking.booking_status == 'confirmed'
    ).first()
    
    # Booking conversion rate
    total_visitors = db.session.query(func.count(func.distinct(ActivityLog.user_id))).filter(
        ActivityLog.action == 'view_event'
    ).scalar() or 1
    
    total_bookers = db.session.query(func.count(func.distinct(Booking.user_id))).filter(
        Booking.booking_status == 'confirmed'
    ).scalar() or 0
    
    conversion_rate = (total_bookers / total_visitors) * 100 if total_visitors > 0 else 0
    
    return jsonify({
        'hourly': [
            {'hour': int(h.hour), 'count': h.count}
            for h in hourly_trends
        ],
        'weekly': [
            {'day': int(w.day_of_week), 'count': w.count}
            for w in weekly_trends
        ],
        'average_booking': {
            'average': float(avg_booking_value.average or 0),
            'minimum': float(avg_booking_value.minimum or 0),
            'maximum': float(avg_booking_value.maximum or 0)
        },
        'conversion_rate': round(conversion_rate, 2)
    }), 200

@dashboard_bp.route('/charts/attendance-analytics', methods=['GET'])
@jwt_required()
def get_attendance_analytics():
    """Get attendance analytics for events"""
    
    # Overall attendance rate
    total_bookings = Booking.query.filter_by(booking_status='confirmed').count()
    checked_in = Booking.query.filter_by(booking_status='confirmed', check_in_status=True).count()
    
    attendance_rate = (checked_in / total_bookings * 100) if total_bookings > 0 else 0
    
    # Attendance by event type
    attendance_by_type = db.session.query(
        Event.event_type,
        func.count(Booking.id).label('total'),
        func.sum(Booking.check_in_status.cast(db.Integer)).label('checked_in')
    ).join(Event).filter(
        Booking.booking_status == 'confirmed'
    ).group_by(Event.event_type).all()
    
    # Top events by attendance
    top_attendance = db.session.query(
        Event.id,
        Event.title,
        func.count(Booking.id).label('total_bookings'),
        func.sum(Booking.check_in_status.cast(db.Integer)).label('checked_in')
    ).join(Event).filter(
        Booking.booking_status == 'confirmed'
    ).group_by(Event.id).order_by(
        func.sum(Booking.check_in_status.cast(db.Integer)).desc()
    ).limit(10).all()
    
    # Daily attendance trend
    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    daily_attendance = db.session.query(
        func.date(Booking.check_in_time).label('date'),
        func.count(Booking.id).label('checked_in')
    ).filter(
        Booking.check_in_status == True,
        Booking.check_in_time >= start_date
    ).group_by(func.date(Booking.check_in_time)).order_by('date').all()
    
    return jsonify({
        'overall': {
            'total_bookings': total_bookings,
            'checked_in': checked_in,
            'attendance_rate': round(attendance_rate, 2)
        },
        'by_type': [
            {
                'type': a.event_type,
                'total': a.total,
                'checked_in': a.checked_in or 0,
                'rate': round((a.checked_in / a.total * 100) if a.total > 0 else 0, 2)
            }
            for a in attendance_by_type
        ],
        'top_events': [
            {
                'id': t.id,
                'title': t.title,
                'total_bookings': t.total_bookings,
                'checked_in': t.checked_in or 0,
                'rate': round((t.checked_in / t.total_bookings * 100) if t.total_bookings > 0 else 0, 2)
            }
            for t in top_attendance
        ],
        'daily': [
            {
                'date': d.date,
                'checked_in': d.checked_in
            }
            for d in daily_attendance
        ]
    }), 200

@dashboard_bp.route('/charts/event-performance', methods=['GET'])
@jwt_required()
def get_event_performance():
    """Get event performance metrics"""
    
    # Event performance by category
    category_performance = db.session.query(
        Category.name,
        func.count(Event.id).label('total_events'),
        func.sum(Booking.total_amount).label('revenue'),
        func.count(Booking.id).label('bookings')
    ).outerjoin(Event).outerjoin(Booking).filter(
        Booking.booking_status == 'confirmed'
    ).group_by(Category.id).order_by(
        func.sum(Booking.total_amount).desc()
    ).all()
    
    # Best performing events
    best_performing = db.session.query(
        Event.id,
        Event.title,
        func.count(Booking.id).label('bookings'),
        func.sum(Booking.total_amount).label('revenue'),
        func.avg(Review.rating).label('rating')
    ).outerjoin(Booking).outerjoin(Review).filter(
        Booking.booking_status == 'confirmed'
    ).group_by(Event.id).order_by(
        func.sum(Booking.total_amount).desc()
    ).limit(10).all()
    
    return jsonify({
        'by_category': [
            {
                'category': c.name,
                'total_events': c.total_events,
                'revenue': float(c.revenue or 0),
                'bookings': c.bookings,
                'average_revenue': float((c.revenue / c.total_events) if c.total_events > 0 else 0)
            }
            for c in category_performance
        ],
        'best_performing': [
            {
                'id': e.id,
                'title': e.title,
                'bookings': e.bookings,
                'revenue': float(e.revenue or 0),
                'rating': round(e.rating or 0, 2)
            }
            for e in best_performing
        ]
    }), 200

@dashboard_bp.route('/recent-activity', methods=['GET'])
@jwt_required()
def get_recent_activity():
    """Get recent activity logs"""
    
    limit = request.args.get('limit', 20, type=int)
    
    recent_activity = ActivityLog.query.order_by(
        ActivityLog.timestamp.desc()
    ).limit(limit).all()
    
    return jsonify([
        {
            'id': a.id,
            'user': a.user.to_dict() if a.user else None,
            'action': a.action,
            'resource_type': a.resource_type,
            'resource_id': a.resource_id,
            'details': json.loads(a.details) if a.details else None,
            'timestamp': a.timestamp.isoformat() if a.timestamp else None,
            'ip_address': a.ip_address
        }
        for a in recent_activity
    ]), 200

@dashboard_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_dashboard_notifications():
    """Get dashboard notifications"""
    
    # Get recent important events
    recent_bookings = Booking.query.filter(
        Booking.booking_date >= datetime.utcnow() - timedelta(hours=24)
    ).count()
    
    pending_events = Event.query.filter_by(status='pending').count()
    
    pending_payments = Payment.query.filter_by(payment_status='pending').count()
    
    new_users = User.query.filter(
        User.created_at >= datetime.utcnow() - timedelta(hours=24)
    ).count()
    
    notifications = []
    
    if pending_events > 0:
        notifications.append({
            'type': 'warning',
            'title': f'{pending_events} Events Pending Approval',
            'message': f'There are {pending_events} events waiting for your review and approval.',
            'link': '/admin/events?status=pending',
            'timestamp': datetime.utcnow().isoformat()
        })
    
    if pending_payments > 0:
        notifications.append({
            'type': 'info',
            'title': f'{pending_payments} Pending Payments',
            'message': f'There are {pending_payments} payments waiting to be processed.',
            'link': '/admin/payments?status=pending',
            'timestamp': datetime.utcnow().isoformat()
        })
    
    if recent_bookings > 10:
        notifications.append({
            'type': 'success',
            'title': f'{recent_bookings} Bookings in Last 24 Hours',
            'message': f'You have received {recent_bookings} new bookings in the last 24 hours.',
            'link': '/admin/bookings',
            'timestamp': datetime.utcnow().isoformat()
        })
    
    if new_users > 5:
        notifications.append({
            'type': 'info',
            'title': f'{new_users} New Users Registered',
            'message': f'{new_users} new users have registered in the last 24 hours.',
            'link': '/admin/users',
            'timestamp': datetime.utcnow().isoformat()
        })
    
    return jsonify(notifications), 200

@dashboard_bp.route('/export/dashboard-data', methods=['GET'])
@jwt_required()
@admin_required
def export_dashboard_data():
    """Export dashboard data as JSON"""
    
    # Gather all dashboard data
    stats = get_dashboard_stats().get_json()
    monthly = get_monthly_bookings().get_json()
    categories = get_event_category_stats().get_json()
    popular = get_popular_events().get_json()
    revenue = get_revenue_overview().get_json()
    performance = get_event_performance().get_json()
    
    export_data = {
        'export_date': datetime.utcnow().isoformat(),
        'stats': stats,
        'monthly_data': monthly,
        'category_stats': categories,
        'popular_events': popular,
        'revenue_overview': revenue,
        'event_performance': performance,
        'generated_by': get_jwt_identity()
    }
    
    return jsonify(export_data), 200

@dashboard_bp.route('/cache/clear', methods=['POST'])
@jwt_required()
@admin_required
def clear_dashboard_cache():
    """Clear dashboard cache"""
    
    cache.clear()
    
    return jsonify({
        'message': 'Dashboard cache cleared successfully'
    }), 200

# Helper function to get admin dashboard data
def get_admin_dashboard_data():
    """Get comprehensive admin dashboard data"""
    
    # This can be used by admin.py for the full dashboard view
    return {
        'stats': get_dashboard_stats().get_json(),
        'monthly': get_monthly_bookings().get_json(),
        'categories': get_event_category_stats().get_json(),
        'popular': get_popular_events().get_json(),
        'revenue': get_revenue_overview().get_json(),
        'user_activity': get_user_activity().get_json(),
        'booking_analytics': get_booking_analytics().get_json(),
        'attendance': get_attendance_analytics().get_json(),
        'performance': get_event_performance().get_json(),
        'notifications': get_dashboard_notifications().get_json()
    }