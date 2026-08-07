
"""
Seed Data Script - Complete Fixed Version
Populates database with sample data
"""

import os
import sys
import random
import string
from datetime import datetime, timedelta
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app
from extensions import db
from models import (
    User, Category, Event, Booking, Review, 
    Notification, Payment, ActivityLog
)

# Sample data
CATEGORIES = [
    {'name': 'Music', 'slug': 'music', 'description': 'Music concerts and festivals', 'icon': '🎵', 'color': '#FF6B6B'},
    {'name': 'Technology', 'slug': 'technology', 'description': 'Tech conferences and workshops', 'icon': '💻', 'color': '#4ECDC4'},
    {'name': 'Sports', 'slug': 'sports', 'description': 'Sports events and competitions', 'icon': '⚽', 'color': '#45B7D1'},
    {'name': 'Art', 'slug': 'art', 'description': 'Art exhibitions and galleries', 'icon': '🎨', 'color': '#96CEB4'},
    {'name': 'Business', 'slug': 'business', 'description': 'Business conferences and networking', 'icon': '💼', 'color': '#FFEAA7'},
    {'name': 'Education', 'slug': 'education', 'description': 'Educational workshops and seminars', 'icon': '📚', 'color': '#DDA0DD'},
    {'name': 'Food', 'slug': 'food', 'description': 'Food festivals and culinary events', 'icon': '🍽️', 'color': '#FF8A5C'},
    {'name': 'Health', 'slug': 'health', 'description': 'Health and wellness events', 'icon': '💪', 'color': '#A8E6CF'},
]

SAMPLE_EVENTS = [
    {
        'title': 'Summer Music Festival 2026',
        'description': 'Join us for the biggest music festival of the year with international artists.',
        'venue': 'Central Park',
        'city': 'New York',
        'address': 'Central Park, New York, NY 10001',
        'date_offset': 30,
        'time': '12:00 PM',
        'duration': '3 days',
        'price': 99.99,
        'total_seats': 5000,
        'status': 'approved',
        'event_type': 'offline',
        'is_featured': True
    },
    {
        'title': 'Tech Conference 2026',
        'description': 'Annual technology conference featuring top speakers from around the world.',
        'venue': 'Convention Center',
        'city': 'San Francisco',
        'address': '747 Howard St, San Francisco, CA 94103',
        'date_offset': 45,
        'time': '9:00 AM',
        'duration': '2 days',
        'price': 299.00,
        'total_seats': 1000,
        'status': 'approved',
        'event_type': 'offline',
        'is_featured': True
    },
    {
        'title': 'Virtual Reality Workshop',
        'description': 'Learn about the latest VR technologies and create your own VR experience.',
        'venue': 'Online',
        'city': 'Global',
        'address': 'Online Event',
        'date_offset': 15,
        'time': '2:00 PM',
        'duration': '3 hours',
        'price': 49.99,
        'total_seats': 200,
        'status': 'approved',
        'event_type': 'online',
        'is_featured': False
    },
    {
        'title': 'Art Exhibition: Modern Masters',
        'description': 'Experience the works of modern art masters in this exclusive exhibition.',
        'venue': 'Art Gallery',
        'city': 'London',
        'address': '123 Art St, London, UK',
        'date_offset': 60,
        'time': '10:00 AM',
        'duration': '1 month',
        'price': 25.00,
        'total_seats': 500,
        'status': 'approved',
        'event_type': 'offline',
        'is_featured': False
    },
    {
        'title': 'Business Networking Summit',
        'description': 'Connect with business leaders and entrepreneurs at this premier networking event.',
        'venue': 'Business Center',
        'city': 'Dubai',
        'address': 'Business Bay, Dubai, UAE',
        'date_offset': 90,
        'time': '8:00 AM',
        'duration': '2 days',
        'price': 199.00,
        'total_seats': 300,
        'status': 'pending',
        'event_type': 'offline',
        'is_featured': False
    },
    {
        'title': 'Health & Wellness Retreat',
        'description': 'A rejuvenating retreat focusing on mental and physical wellness.',
        'venue': 'Mountain Resort',
        'city': 'Switzerland',
        'address': 'Alpine Village, Switzerland',
        'date_offset': 120,
        'time': '6:00 AM',
        'duration': '5 days',
        'price': 499.00,
        'total_seats': 100,
        'status': 'approved',
        'event_type': 'offline',
        'is_featured': False
    },
]

SAMPLE_USERS = [
    {'username': 'john_doe', 'email': 'john@example.com', 'password': 'John@123'},
    {'username': 'jane_smith', 'email': 'jane@example.com', 'password': 'Jane@123'},
    {'username': 'bob_wilson', 'email': 'bob@example.com', 'password': 'Bob@123'},
    {'username': 'alice_brown', 'email': 'alice@example.com', 'password': 'Alice@123'},
    {'username': 'charlie_davis', 'email': 'charlie@example.com', 'password': 'Charlie@123'},
]

def slugify_text(text):
    """Simple slugify function without external library"""
    import re
    slug = text.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')

def create_categories():
    """Create sample categories"""
    print("📁 Creating categories...")
    created = 0
    for cat_data in CATEGORIES:
        existing = Category.query.filter_by(slug=cat_data['slug']).first()
        if not existing:
            category = Category(**cat_data)
            db.session.add(category)
            created += 1
    db.session.commit()
    print(f"   ✅ Created {created} categories")

def create_users():
    """Create sample users"""
    print("📁 Creating users...")
    created = 0
    for user_data in SAMPLE_USERS:
        existing = User.query.filter_by(email=user_data['email']).first()
        if not existing:
            user = User(
                username=user_data['username'],
                email=user_data['email'],
                role='user',
                status='active',
                email_verified=True
            )
            user.set_password(user_data['password'])
            db.session.add(user)
            created += 1
    db.session.commit()
    print(f"   ✅ Created {created} users")

def create_events():
    """Create sample events"""
    print("📁 Creating events...")
    admin = User.query.filter_by(email='admin@eventhub.com').first()
    categories = Category.query.all()
    
    if not admin:
        print("   ❌ Admin user not found! Run create_admin.py first.")
        return
    
    created = 0
    for event_data in SAMPLE_EVENTS:
        existing = Event.query.filter_by(title=event_data['title']).first()
        if not existing:
            slug = slugify_text(event_data['title'])
            event_date = datetime.utcnow() + timedelta(days=event_data['date_offset'])
            registration_deadline = event_date - timedelta(days=7)
            category = random.choice(categories) if categories else None
            
            event = Event(
                title=event_data['title'],
                slug=slug,
                description=event_data['description'],
                category_id=category.id if category else None,
                venue=event_data['venue'],
                city=event_data['city'],
                address=event_data.get('address'),
                date=event_date,
                time=event_data['time'],
                duration=event_data['duration'],
                price=event_data['price'],
                total_seats=event_data['total_seats'],
                available_seats=event_data['total_seats'] - random.randint(0, 100),
                registration_deadline=registration_deadline,
                event_type=event_data['event_type'],
                status=event_data['status'],
                is_featured=event_data.get('is_featured', False)
            )
            
            event.organizers.append(admin)
            db.session.add(event)
            created += 1
    db.session.commit()
    print(f"   ✅ Created {created} events")

def create_bookings():
    """Create sample bookings"""
    print("📁 Creating bookings...")
    users = User.query.filter_by(role='user').all()
    events = Event.query.filter_by(status='approved').all()
    
    if not users or not events:
        print("   ⚠️ No users or events found for bookings")
        return
    
    created = 0
    for user in users[:3]:
        for event in random.sample(events, min(2, len(events))):
            existing = Booking.query.filter_by(
                user_id=user.id,
                event_id=event.id
            ).first()
            if existing:
                continue
            
            quantity = random.randint(1, 3)
            total_amount = event.price * quantity
            
            # Generate booking reference (FIXED)
            booking_ref = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
            
            booking = Booking(
                user_id=user.id,
                event_id=event.id,
                booking_reference=booking_ref,  # REQUIRED - Added this
                quantity=quantity,
                total_amount=total_amount,
                booking_status='confirmed',
                payment_status='completed',
                ticket_number=f"TKT-{datetime.utcnow().strftime('%Y%m%d')}-{user.id}-{event.id}"
            )
            
            db.session.add(booking)
            created += 1
    db.session.commit()
    print(f"   ✅ Created {created} bookings")

def create_reviews():
    """Create sample reviews"""
    print("📁 Creating reviews...")
    bookings = Booking.query.filter_by(booking_status='confirmed').all()
    
    if not bookings:
        print("   ⚠️ No bookings found for reviews")
        return
    
    created = 0
    for booking in bookings[:5]:
        existing = Review.query.filter_by(
            user_id=booking.user_id,
            event_id=booking.event_id
        ).first()
        if existing:
            continue
        
        review = Review(
            user_id=booking.user_id,
            event_id=booking.event_id,
            rating=random.randint(3, 5),
            review=random.choice([
                "Great event! Highly recommended.",
                "Amazing experience! Will come again.",
                "Good organization and fun event.",
                "Excellent event with great speakers.",
                "Wonderful experience, learned a lot."
            ]),
            is_verified=True
        )
        db.session.add(review)
        created += 1
    db.session.commit()
    print(f"   ✅ Created {created} reviews")

def create_notifications():
    """Create sample notifications"""
    print("📁 Creating notifications...")
    users = User.query.filter_by(role='user').all()
    
    if not users:
        print("   ⚠️ No users found for notifications")
        return
    
    created = 0
    for user in users[:5]:
        notification = Notification(
            user_id=user.id,
            title="Welcome to EventHub!",
            message=f"Welcome {user.username}! Start exploring amazing events.",
            type='welcome',
            status='unread',
            icon='👋'
        )
        db.session.add(notification)
        created += 1
    db.session.commit()
    print(f"   ✅ Created {created} notifications")

def seed_all():
    """Seed all data"""
    print("="*60)
    print("🌱 SEEDING DATABASE WITH SAMPLE DATA")
    print("="*60)
    
    app = create_app('development')
    
    with app.app_context():
        # Check if tables exist
        try:
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            if not tables:
                print("\n❌ No tables found! Run init_db.py first.")
                print("   Command: python scripts/init_db.py")
                return
        except:
            print("\n❌ Database not initialized! Run init_db.py first.")
            print("   Command: python scripts/init_db.py")
            return
        
        print("\n📊 Seeding data...")
        
        create_categories()
        create_users()
        create_events()
        create_bookings()
        create_reviews()
        create_notifications()
        
        print("\n" + "="*60)
        print("✅ SEEDING COMPLETE!")
        print("="*60)
        
        print("\n📊 Database Summary:")
        print(f"   Users: {User.query.count()}")
        print(f"   Categories: {Category.query.count()}")
        print(f"   Events: {Event.query.count()}")
        print(f"   Bookings: {Booking.query.count()}")
        print(f"   Reviews: {Review.query.count()}")
        print(f"   Notifications: {Notification.query.count()}")
        print("="*60)
        
        print("\n🎉 Sample data created successfully!")

def clear_all_data():
    """Clear all data"""
    print("="*60)
    print("⚠️  DANGER: CLEARING ALL DATA")
    print("="*60)
    
    confirm = input("\nAre you sure you want to clear all data? (yes/no): ")
    
    if confirm.lower() != 'yes':
        print("❌ Operation cancelled!")
        return
    
    app = create_app('development')
    
    with app.app_context():
        print("\n🗑️ Clearing all data...")
        
        db.session.query(Payment).delete()
        db.session.query(Review).delete()
        db.session.query(Booking).delete()
        db.session.query(Event).delete()
        db.session.query(Notification).delete()
        db.session.query(ActivityLog).delete()
        db.session.query(User).filter(User.role == 'user').delete()
        
        db.session.commit()
        print("✅ All data cleared!")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        if sys.argv[1] == 'clear':
            clear_all_data()
        elif sys.argv[1] == 'help':
            print("\nAvailable commands:")
            print("  python scripts/seed_data.py      - Seed sample data")
            print("  python scripts/seed_data.py clear - Clear all data")
            print("  python scripts/seed_data.py help  - Show this help")
    else:
        seed_all()