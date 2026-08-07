
"""
Notification System - Complete version
"""

import os
import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Union
from enum import Enum
import threading
import queue
import time

logger = logging.getLogger(__name__)

# ==================== NOTIFICATION TYPES ====================

class NotificationType:
    """Notification types as string constants"""
    BOOKING_CONFIRMATION = "booking_confirmation"
    BOOKING_CANCELLATION = "booking_cancellation"
    BOOKING_REMINDER = "booking_reminder"
    EVENT_REMINDER = "event_reminder"
    EVENT_UPDATE = "event_update"
    EVENT_CANCELLED = "event_cancelled"
    PAYMENT_CONFIRMATION = "payment_confirmation"
    PAYMENT_FAILED = "payment_failed"
    REFUND_PROCESSED = "refund_processed"
    ACCOUNT_UPDATE = "account_update"
    PASSWORD_RESET = "password_reset"
    EMAIL_VERIFICATION = "email_verification"
    NEWSLETTER = "newsletter"
    PROMOTIONAL = "promotional"
    SYSTEM_ALERT = "system_alert"
    ADMIN_NOTIFICATION = "admin_notification"
    REVIEW_RESPONSE = "review_response"
    WELCOME = "welcome"
    EVENT_POPULAR = "event_popular"
    TICKET_AVAILABLE = "ticket_available"
    PRICE_DROP = "price_drop"
    FOLLOW_UPDATE = "follow_update"

class Priority:
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"

class Channel:
    IN_APP = "in_app"
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    WHATSAPP = "whatsapp"

# ==================== NOTIFICATION SERVICE ====================

class NotificationService:
    """Main notification service"""
    
    _instance = None
    _queue = queue.Queue()
    _worker_thread = None
    _is_running = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._start_worker()
    
    def _start_worker(self):
        """Start background worker"""
        if self._worker_thread is None or not self._worker_thread.is_alive():
            self._is_running = True
            self._worker_thread = threading.Thread(target=self._process_queue, daemon=True)
            self._worker_thread.start()
            logger.info("Notification worker started")
    
    def _process_queue(self):
        """Process notifications from queue"""
        while self._is_running:
            try:
                notification_data = self._queue.get(timeout=1)
                if notification_data:
                    self._send_notification(notification_data)
                self._queue.task_done()
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Notification processing error: {str(e)}")
    
    def _send_notification(self, notification_data):
        """Send notification through channels"""
        try:
            from extensions import db
            from models import Notification
            
            notification = Notification(
                user_id=notification_data.get('user_id'),
                title=notification_data.get('title', 'Notification'),
                message=notification_data.get('message', ''),
                type=notification_data.get('type', 'system'),
                link=notification_data.get('link'),
                icon=notification_data.get('icon'),
                status='unread',
                created_at=datetime.utcnow()
            )
            
            db.session.add(notification)
            db.session.commit()
            
            logger.info(f"Notification sent to user {notification_data.get('user_id')}")
            
        except Exception as e:
            logger.error(f"Failed to send notification: {str(e)}")
    
    def send_notification(self, user_id: int, title: str, message: str,
                          notification_type: str = 'system',
                          channels: List[str] = None,
                          priority: str = 'normal',
                          link: str = None,
                          icon: str = None,
                          data: Dict = None):
        """Send notification to a user"""
        notification_data = {
            'user_id': user_id,
            'title': title,
            'message': message,
            'type': notification_type,
            'channels': channels or ['in_app'],
            'priority': priority,
            'link': link,
            'icon': icon,
            'data': data or {}
        }
        
        self._queue.put(notification_data)
        return True
    
    def send_bulk(self, user_ids: List[int], title: str, message: str,
                  notification_type: str = 'system',
                  channels: List[str] = None,
                  priority: str = 'normal') -> int:
        """Send notification to multiple users"""
        sent_count = 0
        for user_id in user_ids:
            try:
                self.send_notification(
                    user_id=user_id,
                    title=title,
                    message=message,
                    notification_type=notification_type,
                    channels=channels,
                    priority=priority
                )
                sent_count += 1
            except Exception as e:
                logger.error(f"Failed to send to user {user_id}: {str(e)}")
        
        return sent_count
    
    def stop(self):
        """Stop the notification worker"""
        self._is_running = False
        if self._worker_thread:
            self._worker_thread.join(timeout=5)

# ==================== GLOBAL INSTANCE ====================

# ✅ Create global instance
notification_service = NotificationService()

def get_notification_service() -> NotificationService:
    """Get the global notification service instance"""
    return notification_service

# ==================== HELPER FUNCTIONS ====================

def send_booking_confirmation(booking):
    """Send booking confirmation notification"""
    service = get_notification_service()
    user = booking.user
    event = booking.event
    
    service.send_notification(
        user_id=user.id,
        title=f"Booking Confirmed: {event.title}",
        message=f"Your booking for {event.title} has been confirmed. Reference: {booking.booking_reference}",
        notification_type='booking_confirmation',
        channels=['in_app', 'email'],
        priority='high',
        link=f'/bookings/{booking.id}',
        icon='🎫'
    )

def send_event_reminder(booking):
    """Send event reminder notification"""
    service = get_notification_service()
    user = booking.user
    event = booking.event
    
    service.send_notification(
        user_id=user.id,
        title=f"Reminder: {event.title} Tomorrow!",
        message=f"This is a reminder that {event.title} is happening tomorrow!",
        notification_type='event_reminder',
        channels=['in_app', 'email', 'sms'],
        priority='high',
        link=f'/events/{event.id}',
        icon='⏰'
    )

def send_payment_confirmation(payment):
    """Send payment confirmation notification"""
    service = get_notification_service()
    booking = payment.booking
    user = booking.user
    event = booking.event
    
    service.send_notification(
        user_id=user.id,
        title="Payment Confirmed",
        message=f"Your payment of ${payment.amount:.2f} for {event.title} has been confirmed.",
        notification_type='payment_confirmation',
        channels=['in_app', 'email'],
        priority='normal',
        link=f'/bookings/{booking.id}',
        icon='💳'
    )

def send_event_cancelled(event):
    """Send event cancellation notification to all attendees"""
    service = get_notification_service()
    from models import Booking
    
    bookings = Booking.query.filter_by(event_id=event.id, booking_status='confirmed').all()
    
    for booking in bookings:
        service.send_notification(
            user_id=booking.user.id,
            title=f"Event Cancelled: {event.title}",
            message=f"We regret to inform you that {event.title} has been cancelled.",
            notification_type='event_cancelled',
            channels=['in_app', 'email', 'sms'],
            priority='high',
            link=f'/events/{event.id}',
            icon='❌'
        )

def send_password_reset(user, reset_token):
    """Send password reset email"""
    service = get_notification_service()
    from flask import current_app
    
    reset_url = f"{current_app.config.get('FRONTEND_URL', 'http://localhost:5173')}/reset-password?token={reset_token}"
    
    service.send_notification(
        user_id=user.id,
        title="Password Reset Request",
        message=f"Click the link to reset your password: {reset_url}",
        notification_type='password_reset',
        channels=['email'],
        priority='high',
        icon='🔐'
    )

def send_email_verification(user, token):
    """Send email verification email"""
    service = get_notification_service()
    from flask import current_app
    
    verify_url = f"{current_app.config.get('FRONTEND_URL', 'http://localhost:5173')}/verify-email?token={token}"
    
    service.send_notification(
        user_id=user.id,
        title="Verify Your Email",
        message=f"Click the link to verify your email: {verify_url}",
        notification_type='email_verification',
        channels=['email'],
        priority='high',
        icon='✉️'
    )

def send_welcome_email(user):
    """Send welcome email to new user"""
    service = get_notification_service()
    
    service.send_notification(
        user_id=user.id,
        title="Welcome to EventHub!",
        message=f"Welcome {user.username}! We're excited to have you on board.",
        notification_type='welcome',
        channels=['in_app', 'email'],
        priority='normal',
        icon='👋'
    )

def send_review_response(review, response_text, responder):
    """Send review response notification"""
    service = get_notification_service()
    user = review.user
    event = review.event
    
    service.send_notification(
        user_id=user.id,
        title=f"Review Response from {responder.username}",
        message=f"{responder.username} has responded to your review for {event.title}: {response_text}",
        notification_type='review_response',
        channels=['in_app', 'email'],
        priority='normal',
        link=f'/events/{event.id}',
        icon='💬'
    )

def send_ticket_available(event, user_ids: List[int]):
    """Send ticket available notification to users"""
    service = get_notification_service()
    
    for user_id in user_ids:
        service.send_notification(
            user_id=user_id,
            title=f"Tickets Available: {event.title}",
            message=f"Tickets for {event.title} are now available!",
            notification_type='ticket_available',
            channels=['in_app', 'email'],
            priority='normal',
            link=f'/events/{event.id}',
            icon='🎟️'
        )

# ==================== BOOKING CANCELLATION FUNCTIONS ====================

def send_booking_cancellation(booking, refund_amount=0, was_paid=False):
    """Send booking cancellation notification with refund info"""
    service = get_notification_service()
    user = booking.user
    event = booking.event
    
    if was_paid and refund_amount > 0:
        title = f"Booking Cancelled & Refund Initiated"
        message = f"Your booking for '{event.title}' has been cancelled. A refund of ₹{refund_amount:.2f} will be processed to your original payment method within 5-7 business days."
        icon = '💸'
        notification_type = 'refund_processed'
    else:
        title = f"Booking Cancelled"
        message = f"Your booking for '{event.title}' has been cancelled successfully."
        icon = '❌'
        notification_type = 'booking_cancellation'
    
    service.send_notification(
        user_id=user.id,
        title=title,
        message=message,
        notification_type=notification_type,
        channels=['in_app', 'email'],
        priority='high',
        link=f'/bookings/{booking.id}',
        icon=icon
    )

def send_refund_processed(booking, refund_amount):
    """Send refund processed notification"""
    service = get_notification_service()
    user = booking.user
    event = booking.event
    
    service.send_notification(
        user_id=user.id,
        title=f"Refund Processed 💰",
        message=f"Refund of ₹{refund_amount:.2f} for '{event.title}' has been processed successfully.",
        notification_type='refund_processed',
        channels=['in_app', 'email'],
        priority='high',
        link=f'/bookings/{booking.id}',
        icon='💰'
    )

# ==================== USER NOTIFICATION FUNCTIONS ====================

def get_user_notifications(user_id: int, status: str = None, 
                           limit: int = 50, offset: int = 0):
    """Get notifications for a user"""
    from models import Notification
    from extensions import db
    
    query = Notification.query.filter_by(user_id=user_id)
    
    if status:
        query = query.filter_by(status=status)
    
    return query.order_by(Notification.created_at.desc()).offset(offset).limit(limit).all()

def get_unread_count(user_id: int) -> int:
    """Get count of unread notifications"""
    from models import Notification
    
    return Notification.query.filter_by(user_id=user_id, status='unread').count()

def mark_notification_read(notification_id: int) -> bool:
    """Mark a notification as read"""
    from models import Notification
    from extensions import db
    
    notification = Notification.query.get(notification_id)
    if notification:
        notification.status = 'read'
        notification.read_at = datetime.utcnow()
        db.session.commit()
        return True
    return False

def mark_all_notifications_read(user_id: int) -> int:
    """Mark all notifications as read"""
    from models import Notification
    from extensions import db
    
    notifications = Notification.query.filter_by(user_id=user_id, status='unread').all()
    for notification in notifications:
        notification.status = 'read'
        notification.read_at = datetime.utcnow()
    db.session.commit()
    return len(notifications)

def delete_notification(notification_id: int) -> bool:
    """Delete a notification"""
    from models import Notification
    from extensions import db
    
    notification = Notification.query.get(notification_id)
    if notification:
        db.session.delete(notification)
        db.session.commit()
        return True
    return False

def delete_all_notifications(user_id: int) -> int:
    """Delete all notifications for a user"""
    from models import Notification
    from extensions import db
    
    count = Notification.query.filter_by(user_id=user_id).delete()
    db.session.commit()
    return count

# ==================== INITIALIZATION ====================

def init_notification_service(app):
    """Initialize notification service with Flask app"""
    service = get_notification_service()
    logger.info("Notification service initialized")
    return service

# ==================== EXPORTS ====================

__all__ = [
    'NotificationType',
    'Priority',
    'Channel',
    'NotificationService',
    'notification_service',
    'get_notification_service',
    'send_booking_confirmation',
    'send_event_reminder',
    'send_payment_confirmation',
    'send_event_cancelled',
    'send_password_reset',
    'send_email_verification',
    'send_welcome_email',
    'send_review_response',
    'send_ticket_available',
    'send_booking_cancellation',
    'send_refund_processed',
    'get_user_notifications',
    'get_unread_count',
    'mark_notification_read',
    'mark_all_notifications_read',
    'delete_notification',
    'delete_all_notifications',
    'init_notification_service',
]