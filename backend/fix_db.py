
"""
ONE FILE TO FIX DATABASE - Run this once and done!
"""
import os
import sqlite3
import shutil
from pathlib import Path

print("="*50)
print("FIXING DATABASE...")
print("="*50)

# Get current folder
base = Path(__file__).resolve().parent

# STEP 1: Delete old folders
print("1. Cleaning old files...")
if (base / 'migrations').exists():
    shutil.rmtree(base / 'migrations')
if (base / 'instance').exists():
    shutil.rmtree(base / 'instance')
print("   ✅ Cleaned")

# STEP 2: Create new folders
print("2. Creating new folders...")
(base / 'instance').mkdir(exist_ok=True)
print("   ✅ Created instance folder")

# STEP 3: Create database
print("3. Creating database...")
db_path = base / 'instance' / 'event_management.db'
conn = sqlite3.connect(str(db_path))
conn.close()
print(f"   ✅ Created: {db_path}")

# STEP 4: Set permissions (Windows)
print("4. Setting permissions...")
try:
    os.chmod(str(db_path), 0o666)
    os.chmod(str(base / 'instance'), 0o777)
except:
    pass
print("   ✅ Permissions set")

# STEP 5: Update config.py
print("5. Updating config.py...")
config_file = base / 'config.py'
if config_file.exists():
    with open(config_file, 'r') as f:
        content = f.read()
    
    # Fix database path
    if "SQLALCHEMY_DATABASE_URI" in content:
        # Replace with absolute path
        new_content = content.replace(
            "SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///instance/event_management.db'",
            f"SQLALCHEMY_DATABASE_URI = 'sqlite:///{db_path}'"
        )
        with open(config_file, 'w') as f:
            f.write(new_content)
        print("   ✅ Updated config.py")
else:
    print("   ⚠️ config.py not found")

# STEP 6: Create .env file
print("6. Creating .env file...")
env_file = base / '.env'
with open(env_file, 'w') as f:
    f.write(f"""
FLASK_APP=app:app
FLASK_ENV=development
FLASK_DEBUG=1
DATABASE_URL=sqlite:///{db_path}
JWT_SECRET_KEY=your-secret-key
""")
print("   ✅ Created .env")

# STEP 7: Verify database
print("7. Verifying database...")
try:
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    cursor.execute("SELECT sqlite_version()")
    version = cursor.fetchone()[0]
    print(f"   ✅ SQLite version: {version}")
    conn.close()
except Exception as e:
    print(f"   ❌ Error: {e}")

print("="*50)
print("✅ DATABASE FIX COMPLETE!")
print("="*50)
print(f"\n📁 Database: {db_path}")
print("\n📝 NOW RUN:")
print("   flask db init")
print("   flask db migrate -m 'Initial migration'")
print("   flask db upgrade")
print("   python app.py")
print("="*50)