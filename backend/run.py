"""
Entry point for running the application
"""
from app import create_app

# Create app instance
app = create_app('development')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)