"""
Create Admin User Script
Run this to create or update the admin user
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app
from extensions import db
from models import User

def create_admin():
    """Create admin user"""
    print("="*60)
    print("🔧 CREATING ADMIN USER")
    print("="*60)
    
    app = create_app('development')
    
    with app.app_context():
        # Check if admin exists
        admin = User.query.filter_by(email='admin@eventhub.com').first()
        
        if admin:
            print(f"\n✅ Admin already exists:")
            print(f"   Username: {admin.username}")
            print(f"   Email: {admin.email}")
            print(f"   Role: {admin.role}")
            
            # Option to reset password
            reset = input("\nDo you want to reset admin password? (y/n): ").lower()
            if reset == 'y':
                admin.set_password('Admin@123')
                db.session.commit()
                print("✅ Password reset to: Admin@123")
            return
        
        # Create new admin
        admin = User(
            username='admin',
            email='admin@eventhub.com',
            role='admin',
            status='active',
            email_verified=True,
            phone='+1234567890'
        )
        admin.set_password('Admin@123')
        
        db.session.add(admin)
        db.session.commit()
        
        print("\n✅ Admin user created successfully!")
        print("="*60)
        print("📋 Admin Credentials:")
        print(f"   Username: admin")
        print(f"   Email: admin@eventhub.com")
        print(f"   Password: Admin@123")
        print("="*60)
        print("\n⚠️  Please change the password after first login!")

def update_admin_password():
    """Update admin password"""
    print("="*60)
    print("🔧 UPDATING ADMIN PASSWORD")
    print("="*60)
    
    app = create_app('development')
    
    with app.app_context():
        admin = User.query.filter_by(email='admin@eventhub.com').first()
        
        if not admin:
            print("❌ Admin user not found!")
            print("   Run this script without arguments to create admin.")
            return
        
        new_password = input("\nEnter new password (min 8 chars): ")
        
        if len(new_password) < 8:
            print("❌ Password must be at least 8 characters!")
            return
        
        admin.set_password(new_password)
        db.session.commit()
        
        print("✅ Password updated successfully!")

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'update':
        update_admin_password()
    else:
        create_admin()