# backend/create_users.py
from app import create_app
from extensions import db
from models import User

def create_users():
    app = create_app('development')
    
    with app.app_context():
        print("=" * 50)
        print("👤 CREATING USERS")
        print("=" * 50)
        
        # Admin User
        admin = User.query.filter_by(email='admin@eventhub.com').first()
        if not admin:
            admin = User(
                username='admin',
                email='admin@eventhub.com',
                role='admin',
                status='active'
            )
            admin.set_password('Admin@123')
            db.session.add(admin)
            print("✅ Admin user created")
        else:
            print("✅ Admin user already exists")
            # Reset password if needed
            admin.set_password('Admin@123')
            db.session.commit()
            print("✅ Admin password reset")
        
        # Regular User
        user = User.query.filter_by(email='nira@example.com').first()
        if not user:
            user = User(
                username='Nir_nira',
                email='nira@example.com',
                role='user',
                status='active'
            )
            user.set_password('Niran@123')
            db.session.add(user)
            print("✅ Regular user created")
        else:
            print("✅ Regular user already exists")
            user.set_password('Niran@123')
            db.session.commit()
            print("✅ Regular user password reset")
        
        db.session.commit()
        
        print("=" * 50)
        print("✅ USERS CREATED SUCCESSFULLY!")
        print("=" * 50)
        print("\n📋 Admin Login:")
        print("   Email: admin@eventhub.com")
        print("   Password: Admin@123")
        print("\n📋 User Login:")
        print("   Email: nira@example.com")
        print("   Password: Niran@123")
        print("=" * 50)

if __name__ == '__main__':
    create_users()