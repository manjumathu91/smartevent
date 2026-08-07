"""
Complete database permission fix for Windows/Linux/Mac
"""
import os
import sys
import sqlite3
from pathlib import Path
import stat

def fix_database_permissions():
    """Fix database permissions and create proper structure"""
    
    print("="*60)
    print("🔧 DATABASE PERMISSION FIX")
    print("="*60)
    
    # 1. Get base directory
    base_dir = Path(__file__).resolve().parent
    instance_dir = base_dir / 'instance'
    db_path = instance_dir / 'event_management.db'
    
    print(f"\n📁 Base Directory: {base_dir}")
    print(f"📁 Instance Directory: {instance_dir}")
    print(f"📄 Database File: {db_path}")
    
    # 2. Create instance directory
    print("\n📁 Creating instance directory...")
    try:
        if not instance_dir.exists():
            instance_dir.mkdir(parents=True, exist_ok=True)
            print(f"✅ Created: {instance_dir}")
        else:
            print(f"✅ Already exists: {instance_dir}")
    except Exception as e:
        print(f"❌ Failed to create directory: {e}")
        return False
    
    # 3. Remove old database if it exists (corrupted)
    print("\n🗑️ Checking for old database...")
    if db_path.exists():
        try:
            db_path.unlink()
            print(f"✅ Removed old database: {db_path}")
        except PermissionError:
            print(f"⚠️ Could not delete old database. Trying to overwrite...")
        except Exception as e:
            print(f"⚠️ Could not delete: {e}")
    
    # 4. Create new database
    print("\n📄 Creating new database...")
    try:
        conn = sqlite3.connect(str(db_path))
        conn.close()
        print(f"✅ Created: {db_path}")
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        return False
    
    # 5. Set permissions
    print("\n🔐 Setting permissions...")
    try:
        # Set directory permissions
        os.chmod(str(instance_dir), stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)
        print(f"✅ Directory permissions set: {instance_dir}")
    except Exception as e:
        print(f"⚠️ Could not set directory permissions: {e}")
    
    try:
        # Set file permissions - read/write for everyone
        os.chmod(str(db_path), stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IWGRP | stat.S_IROTH | stat.S_IWOTH)
        print(f"✅ File permissions set: {db_path}")
    except Exception as e:
        print(f"⚠️ Could not set file permissions: {e}")
    
    # 6. Verify database
    print("\n🔍 Verifying database...")
    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        cursor.execute("SELECT sqlite_version()")
        version = cursor.fetchone()[0]
        print(f"✅ SQLite version: {version}")
        
        # Create test table to verify write access
        cursor.execute("CREATE TABLE IF NOT EXISTS test (id INTEGER)")
        conn.commit()
        print("✅ Database is writable!")
        
        # Drop test table
        cursor.execute("DROP TABLE test")
        conn.commit()
        conn.close()
        
    except Exception as e:
        print(f"❌ Database verification failed: {e}")
        return False
    
    # 7. Check if migrations need to be initialized
    migrations_dir = base_dir / 'migrations'
    print(f"\n📁 Migrations directory: {migrations_dir}")
    if not migrations_dir.exists():
        print("ℹ️  Migrations not initialized. Run: flask db init")
    else:
        print("✅ Migrations directory exists")
    
    # 8. Summary
    print("\n" + "="*60)
    print("✅ DATABASE SETUP COMPLETE!")
    print("="*60)
    print(f"\n📁 Instance Directory: {instance_dir}")
    print(f"📄 Database File: {db_path}")
    print(f"💾 Database Size: {db_path.stat().st_size} bytes")
    print("\n📝 Next Steps:")
    print("  1. Run: flask db init")
    print("  2. Run: flask db migrate -m 'Initial migration'")
    print("  3. Run: flask db upgrade")
    print("  4. Run: python app.py")
    print("="*60)
    
    return True

def check_database_status():
    """Check database status"""
    print("\n🔍 Checking database status...")
    
    base_dir = Path(__file__).resolve().parent
    instance_dir = base_dir / 'instance'
    db_path = instance_dir / 'event_management.db'
    
    print(f"\n📁 Instance Directory: {instance_dir}")
    print(f"   Exists: {instance_dir.exists()}")
    
    print(f"\n📄 Database File: {db_path}")
    print(f"   Exists: {db_path.exists()}")
    if db_path.exists():
        print(f"   Size: {db_path.stat().st_size} bytes")
        try:
            conn = sqlite3.connect(str(db_path))
            cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = cursor.fetchall()
            print(f"   Tables: {len(tables)}")
            for table in tables:
                print(f"     - {table[0]}")
            conn.close()
        except Exception as e:
            print(f"   ❌ Error reading database: {e}")

if __name__ == '__main__':
    # Fix permissions
    fix_database_permissions()
    
    # Check status
    check_database_status()