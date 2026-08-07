
"""
Initialize Database Script
Creates all tables and sets up the database
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app
from extensions import db
from models import (
    User, Category, Event, Booking, Review, 
    Notification, Payment, ActivityLog
)

def init_database():
    """Initialize database with all tables"""
    print("="*60)
    print("🔧 INITIALIZING DATABASE")
    print("="*60)
    
    app = create_app('development')
    
    with app.app_context():
        # Create all tables
        print("\n📁 Creating database tables...")
        db.create_all()
        print("✅ Tables created successfully!")
        
        # List all tables
        print("\n📊 Tables created:")
        inspector = db.inspect(db.engine)
        for table in inspector.get_table_names():
            print(f"   - {table}")
        
        print("\n✅ Database initialization complete!")
        print("="*60)
        print("\n📝 Next Steps:")
        print("  1. Run: python scripts/create_admin.py")
        print("  2. Run: python scripts/seed_data.py")
        print("  3. Run: python app.py")

def drop_all_tables():
    """Drop all tables (Dangerous!)"""
    print("="*60)
    print("⚠️  DANGER: DROPPING ALL TABLES")
    print("="*60)
    
    confirm = input("\nAre you sure you want to drop all tables? (yes/no): ")
    
    if confirm.lower() != 'yes':
        print("❌ Operation cancelled!")
        return
    
    app = create_app('development')
    
    with app.app_context():
        print("\n🗑️ Dropping all tables...")
        db.drop_all()
        print("✅ All tables dropped!")
        
        print("\n📁 Recreating tables...")
        db.create_all()
        print("✅ Tables recreated!")

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'drop':
        drop_all_tables()
    else:
        init_database()