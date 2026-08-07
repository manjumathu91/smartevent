
"""
File Handlers - Complete working version with safe imports
"""

import os
import uuid
import io
import hashlib
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from werkzeug.utils import secure_filename

logger = logging.getLogger(__name__)

# ==================== SAFE IMPORTS ====================

# PIL/Pillow
try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    logger.warning("Pillow not installed. Image processing limited.")

# python-magic
try:
    import magic
    HAS_MAGIC = True
except ImportError:
    HAS_MAGIC = False
    logger.warning("python-magic not installed. MIME detection limited.")

# imghdr (built-in)
try:
    import imghdr
    HAS_IMGHDR = True
except ImportError:
    HAS_IMGHDR = False
    logger.warning("imghdr not available.")

# boto3 (AWS)
try:
    import boto3
    from botocore.exceptions import ClientError
    HAS_BOTO3 = True
except ImportError:
    HAS_BOTO3 = False
    logger.warning("boto3 not installed. S3 upload disabled.")

# Cloudinary
try:
    import cloudinary
    import cloudinary.uploader
    HAS_CLOUDINARY = True
except ImportError:
    HAS_CLOUDINARY = False
    logger.warning("cloudinary not installed. Cloudinary upload disabled.")

# ==================== CONSTANTS ====================

ALLOWED_EXTENSIONS = {
    'image': {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'ico'},
    'document': {'pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'},
    'spreadsheet': {'xls', 'xlsx', 'csv', 'ods'},
    'presentation': {'ppt', 'pptx', 'odp'},
    'video': {'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'},
    'audio': {'mp3', 'wav', 'ogg', 'flac', 'aac'},
    'archive': {'zip', 'rar', '7z', 'tar', 'gz'},
}

MAX_FILE_SIZES = {
    'image': 10 * 1024 * 1024,      # 10MB
    'document': 20 * 1024 * 1024,   # 20MB
    'spreadsheet': 20 * 1024 * 1024,
    'presentation': 50 * 1024 * 1024,
    'video': 500 * 1024 * 1024,     # 500MB
    'audio': 100 * 1024 * 1024,
    'archive': 100 * 1024 * 1024,
    'default': 16 * 1024 * 1024,    # 16MB
}

IMAGE_SIZES = {
    'thumbnail': (150, 150),
    'small': (300, 300),
    'medium': (600, 600),
    'large': (1200, 1200),
    'banner': (1920, 1080),
    'profile': (400, 400),
    'event': (800, 600),
    'cover': (1200, 400),
}

ALLOWED_MIME_TYPES = {
    'image/jpeg': 'image',
    'image/png': 'image',
    'image/gif': 'image',
    'image/webp': 'image',
    'image/svg+xml': 'image',
    'image/bmp': 'image',
    'image/tiff': 'image',
    'application/pdf': 'document',
    'application/msword': 'document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
    'text/plain': 'document',
    'application/vnd.ms-excel': 'spreadsheet',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'spreadsheet',
    'text/csv': 'spreadsheet',
    'application/vnd.ms-powerpoint': 'presentation',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'presentation',
    'video/mp4': 'video',
    'video/quicktime': 'video',
    'video/x-msvideo': 'video',
    'audio/mpeg': 'audio',
    'audio/wav': 'audio',
    'audio/ogg': 'audio',
    'application/zip': 'archive',
    'application/x-rar-compressed': 'archive',
    'application/x-7z-compressed': 'archive',
}

# ==================== FILE VALIDATOR ====================

class FileValidator:
    """File validation utilities"""
    
    @staticmethod
    def get_file_extension(filename: str) -> str:
        """Get file extension from filename"""
        return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    
    @staticmethod
    def get_file_type(filename: str) -> str:
        """Determine file type based on extension"""
        ext = FileValidator.get_file_extension(filename)
        for file_type, extensions in ALLOWED_EXTENSIONS.items():
            if ext in extensions:
                return file_type
        return 'unknown'
    
    @staticmethod
    def is_allowed_extension(filename: str, allowed_extensions: List[str] = None) -> bool:
        """Check if file extension is allowed"""
        ext = FileValidator.get_file_extension(filename)
        if allowed_extensions:
            return ext in allowed_extensions
        # Check against all allowed extensions
        for extensions in ALLOWED_EXTENSIONS.values():
            if ext in extensions:
                return True
        return False
    
    @staticmethod
    def get_file_mime_type(file_content: bytes) -> str:
        """Get MIME type of file"""
        # Try using magic first
        if HAS_MAGIC:
            try:
                return magic.from_buffer(file_content, mime=True)
            except:
                pass
        
        # Fallback to simple detection
        if file_content.startswith(b'\x89PNG\r\n\x1a\n'):
            return 'image/png'
        elif file_content.startswith(b'\xff\xd8'):
            return 'image/jpeg'
        elif file_content.startswith(b'GIF87a') or file_content.startswith(b'GIF89a'):
            return 'image/gif'
        elif file_content.startswith(b'%PDF'):
            return 'application/pdf'
        elif file_content.startswith(b'PK'):
            return 'application/zip'
        elif file_content.startswith(b'RIFF'):
            return 'image/webp'
        
        return 'application/octet-stream'
    
    @staticmethod
    def is_image(file_content: bytes) -> bool:
        """Check if file is an image"""
        # Try using imghdr
        if HAS_IMGHDR:
            try:
                return imghdr.what(None, file_content) is not None
            except:
                pass
        
        # Try using PIL
        if HAS_PIL:
            try:
                Image.open(io.BytesIO(file_content))
                return True
            except:
                pass
        
        # Fallback to signature detection
        signatures = [
            b'\x89PNG\r\n\x1a\n',  # PNG
            b'\xff\xd8',            # JPEG
            b'GIF87a',              # GIF
            b'GIF89a',              # GIF
            b'BM',                  # BMP
            b'RIFF',                # WebP
        ]
        for sig in signatures:
            if file_content.startswith(sig):
                return True
        return False
    
    @staticmethod
    def get_image_dimensions(file_content: bytes) -> Optional[Tuple[int, int]]:
        """Get image dimensions"""
        if HAS_PIL:
            try:
                image = Image.open(io.BytesIO(file_content))
                return image.size
            except:
                pass
        return None
    
    @staticmethod
    def validate_file(file_content: bytes, filename: str, max_size: int = None) -> Dict[str, Any]:
        """Validate file with all checks"""
        results = {
            'valid': True,
            'errors': [],
            'warnings': [],
            'info': {}
        }
        
        # Check file size
        if max_size is None:
            file_type = FileValidator.get_file_type(filename)
            max_size = MAX_FILE_SIZES.get(file_type, MAX_FILE_SIZES['default'])
        
        if len(file_content) > max_size:
            results['valid'] = False
            results['errors'].append(f'File size exceeds {max_size/(1024*1024):.0f}MB limit')
        
        # Check extension
        if not FileValidator.is_allowed_extension(filename):
            results['valid'] = False
            results['errors'].append('File extension not allowed')
        
        # Check MIME type
        mime_type = FileValidator.get_file_mime_type(file_content)
        if mime_type not in ALLOWED_MIME_TYPES:
            results['warnings'].append('Unknown file type')
        
        # Additional info for images
        if FileValidator.is_image(file_content):
            results['info']['is_image'] = True
            dimensions = FileValidator.get_image_dimensions(file_content)
            if dimensions:
                results['info']['width'] = dimensions[0]
                results['info']['height'] = dimensions[1]
            results['info']['mime_type'] = FileValidator.get_file_mime_type(file_content)
        
        return results

# ==================== FILE PROCESSOR ====================

class FileProcessor:
    """File processing utilities"""
    
    @staticmethod
    def process_image(file_content: bytes, size: str = 'medium') -> bytes:
        """Process and resize image"""
        if not HAS_PIL:
            return file_content
        
        try:
            image = Image.open(io.BytesIO(file_content))
            
            # Convert RGBA to RGB if necessary
            if image.mode == 'RGBA':
                image = image.convert('RGB')
            
            # Get target size
            target_size = IMAGE_SIZES.get(size, IMAGE_SIZES['medium'])
            
            # Resize image maintaining aspect ratio
            image.thumbnail(target_size, Image.Resampling.LANCZOS)
            
            # Save to bytes
            output = io.BytesIO()
            image.save(output, format='JPEG', quality=85, optimize=True)
            output.seek(0)
            
            return output.getvalue()
            
        except Exception as e:
            logger.error(f"Image processing error: {str(e)}")
            return file_content
    
    @staticmethod
    def process_avatar(file_content: bytes) -> bytes:
        """Process avatar image (square crop)"""
        if not HAS_PIL:
            return file_content
        
        try:
            image = Image.open(io.BytesIO(file_content))
            
            # Convert RGBA to RGB if necessary
            if image.mode == 'RGBA':
                image = image.convert('RGB')
            
            # Crop to square
            width, height = image.size
            size = min(width, height)
            left = (width - size) // 2
            top = (height - size) // 2
            right = left + size
            bottom = top + size
            
            image = image.crop((left, top, right, bottom))
            image.thumbnail(IMAGE_SIZES['profile'], Image.Resampling.LANCZOS)
            
            output = io.BytesIO()
            image.save(output, format='JPEG', quality=85, optimize=True)
            output.seek(0)
            
            return output.getvalue()
            
        except Exception as e:
            logger.error(f"Avatar processing error: {str(e)}")
            return file_content
    
    @staticmethod
    def generate_thumbnail(file_content: bytes, size: Tuple[int, int] = (150, 150)) -> bytes:
        """Generate thumbnail image"""
        if not HAS_PIL:
            return file_content
        
        try:
            image = Image.open(io.BytesIO(file_content))
            image.thumbnail(size, Image.Resampling.LANCZOS)
            
            output = io.BytesIO()
            image.save(output, format='JPEG', quality=75, optimize=True)
            output.seek(0)
            
            return output.getvalue()
            
        except Exception as e:
            logger.error(f"Thumbnail generation error: {str(e)}")
            return file_content
    
    @staticmethod
    def compress_image(file_content: bytes, quality: int = 85) -> bytes:
        """Compress image with specified quality"""
        if not HAS_PIL:
            return file_content
        
        try:
            image = Image.open(io.BytesIO(file_content))
            
            output = io.BytesIO()
            image.save(output, format='JPEG', quality=quality, optimize=True)
            output.seek(0)
            
            return output.getvalue()
            
        except Exception as e:
            logger.error(f"Image compression error: {str(e)}")
            return file_content
    
    @staticmethod
    def generate_filename(original_filename: str, prefix: str = '') -> str:
        """Generate unique filename"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_id = uuid.uuid4().hex[:8]
        ext = FileValidator.get_file_extension(original_filename)
        
        if not ext:
            ext = 'file'
        
        if prefix:
            return f"{prefix}_{timestamp}_{unique_id}.{ext}"
        return f"{timestamp}_{unique_id}.{ext}"

# ==================== FILE STORAGE ====================

class FileStorage:
    """File storage utilities"""
    
    @staticmethod
    def save_file(file_content: bytes, filename: str, folder: str = 'uploads',
                  subfolder: str = None, process: bool = True) -> Dict[str, Any]:
        """Save file to storage"""
        try:
            # Validate file
            validation = FileValidator.validate_file(file_content, filename)
            if not validation['valid']:
                return {
                    'success': False,
                    'errors': validation['errors']
                }
            
            # Generate secure filename
            secure_name = secure_filename(filename)
            if not secure_name:
                secure_name = filename.replace(' ', '_')
            
            # Generate unique filename
            unique_filename = FileProcessor.generate_filename(secure_name)
            
            # Build path
            if subfolder:
                folder_path = os.path.join('uploads', folder, subfolder)
            else:
                folder_path = os.path.join('uploads', folder)
            
            # Create directory if it doesn't exist
            Path(folder_path).mkdir(parents=True, exist_ok=True)
            
            file_path = os.path.join(folder_path, unique_filename)
            
            # Process file based on type
            processed_content = file_content
            file_type = FileValidator.get_file_type(secure_name)
            
            if process and file_type == 'image' and HAS_PIL:
                processed_content = FileProcessor.compress_image(file_content)
            
            # Save file
            with open(file_path, 'wb') as f:
                f.write(processed_content)
            
            # Generate URL
            relative_path = os.path.join(folder, subfolder or '', unique_filename).replace('\\', '/')
            file_url = f"/uploads/{relative_path}"
            
            result = {
                'success': True,
                'filename': unique_filename,
                'original_filename': secure_name,
                'path': file_path,
                'url': file_url,
                'relative_path': relative_path,
                'size': len(processed_content),
                'type': file_type,
                'info': validation.get('info', {})
            }
            
            logger.info(f"File saved: {file_url}")
            return result
            
        except Exception as e:
            logger.error(f"File save error: {str(e)}")
            return {
                'success': False,
                'errors': [str(e)]
            }
    
    @staticmethod
    def delete_file(file_path: str) -> bool:
        """Delete a file"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"File deleted: {file_path}")
                return True
            return False
        except Exception as e:
            logger.error(f"File deletion error: {str(e)}")
            return False
    
    @staticmethod
    def get_file(file_path: str) -> Optional[bytes]:
        """Get file content"""
        try:
            if os.path.exists(file_path):
                with open(file_path, 'rb') as f:
                    return f.read()
            return None
        except Exception as e:
            logger.error(f"File read error: {str(e)}")
            return None

# ==================== UPLOAD HANDLERS ====================

class UploadHandler:
    """Handle file uploads from requests"""
    
    @staticmethod
    def handle_single_upload(request_file, folder: str = 'uploads',
                             subfolder: str = None, process: bool = True) -> Dict[str, Any]:
        """Handle single file upload from request"""
        if not request_file:
            return {
                'success': False,
                'errors': ['No file provided']
            }
        
        if request_file.filename == '':
            return {
                'success': False,
                'errors': ['No file selected']
            }
        
        file_content = request_file.read()
        filename = request_file.filename
        
        return FileStorage.save_file(file_content, filename, folder, subfolder, process)
    
    @staticmethod
    def handle_base64_upload(base64_string: str, filename: str,
                            folder: str = 'uploads') -> Dict[str, Any]:
        """Handle base64 encoded file upload"""
        try:
            # Remove data URL prefix if present
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            
            import base64 as b64
            file_content = b64.b64decode(base64_string)
            return FileStorage.save_file(file_content, filename, folder)
            
        except Exception as e:
            logger.error(f"Base64 upload error: {str(e)}")
            return {
                'success': False,
                'errors': [str(e)]
            }

# ==================== IMAGE HANDLERS ====================

class ImageHandler:
    """Specialized image handling"""
    
    @staticmethod
    def upload_profile_image(request_file, user_id: int) -> Dict[str, Any]:
        """Upload profile image"""
        result = UploadHandler.handle_single_upload(
            request_file,
            folder='avatars',
            subfolder=str(user_id),
            process=True
        )
        
        if result['success'] and HAS_PIL:
            # Process avatar
            file_content = FileStorage.get_file(result['path'])
            if file_content:
                avatar_content = FileProcessor.process_avatar(file_content)
                with open(result['path'], 'wb') as f:
                    f.write(avatar_content)
                result['size'] = len(avatar_content)
        
        return result
    
    @staticmethod
    def upload_event_image(request_file, event_id: int, image_type: str = 'regular') -> Dict[str, Any]:
        """Upload event image"""
        folder = 'events'
        subfolder = str(event_id)
        
        if image_type == 'banner':
            result = UploadHandler.handle_single_upload(
                request_file, folder, subfolder, process=True
            )
            if result['success'] and HAS_PIL:
                file_content = FileStorage.get_file(result['path'])
                if file_content:
                    banner_content = FileProcessor.process_image(file_content, 'banner')
                    with open(result['path'], 'wb') as f:
                        f.write(banner_content)
                    result['size'] = len(banner_content)
            return result
        else:
            return UploadHandler.handle_single_upload(
                request_file, folder, subfolder, process=True
            )

# ==================== FLASK RESPONSE HELPERS ====================

def create_upload_response(result: Dict[str, Any]) -> tuple:
    """Create Flask response for upload result"""
    from flask import jsonify
    
    if result.get('success', False):
        return jsonify({
            'success': True,
            'message': 'File uploaded successfully',
            'data': result
        }), 200
    else:
        return jsonify({
            'success': False,
            'errors': result.get('errors', ['Upload failed'])
        }), 400

def create_multiple_upload_response(results: List[Dict[str, Any]]) -> tuple:
    """Create Flask response for multiple upload results"""
    from flask import jsonify
    
    successful = [r for r in results if r.get('success', False)]
    failed = [r for r in results if not r.get('success', False)]
    
    return jsonify({
        'success': len(successful) > 0,
        'message': f"Uploaded {len(successful)} files, {len(failed)} failed",
        'data': {
            'successful': successful,
            'failed': failed,
            'total': len(results)
        }
    }), 200

# ==================== INITIALIZATION ====================

def init_file_handlers(app):
    """Initialize file handlers with Flask app"""
    # Create upload directories
    upload_folder = app.config.get('UPLOAD_FOLDER', 'uploads')
    directories = [
        upload_folder,
        os.path.join(upload_folder, 'avatars'),
        os.path.join(upload_folder, 'events'),
        os.path.join(upload_folder, 'documents'),
        os.path.join(upload_folder, 'archives'),
        os.path.join(upload_folder, 'temp')
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
    
    logger.info("File handlers initialized successfully")
    return app

# ==================== EXPORTS ====================

__all__ = [
    'FileValidator',
    'FileProcessor',
    'FileStorage',
    'UploadHandler',
    'ImageHandler',
    'create_upload_response',
    'create_multiple_upload_response',
    'init_file_handlers',
    'ALLOWED_EXTENSIONS',
    'MAX_FILE_SIZES',
    'IMAGE_SIZES',
]

# ==================== TEST ====================

if __name__ == '__main__':
    print("✅ File handlers module loaded successfully!")
    print(f"Pillow available: {HAS_PIL}")
    print(f"python-magic available: {HAS_MAGIC}")
    print(f"imghdr available: {HAS_IMGHDR}")
    print(f"boto3 available: {HAS_BOTO3}")
    print(f"Cloudinary available: {HAS_CLOUDINARY}")

# ==================== COMPATIBILITY FUNCTIONS ====================

def upload_file(file, folder: str = 'uploads', subfolder: str = None, 
                allowed_extensions: List[str] = None, max_size: int = None) -> Dict[str, Any]:
    """
    Upload a file (compatibility function)
    
    Args:
        file: File object from request
        folder: Main folder name
        subfolder: Subfolder name
        allowed_extensions: List of allowed extensions
        max_size: Maximum file size in bytes
    
    Returns:
        Dictionary with upload result
    """
    result = UploadHandler.handle_single_upload(file, folder, subfolder, process=True)
    
    # Add additional validation if needed
    if result['success'] and allowed_extensions:
        ext = FileValidator.get_file_extension(result['original_filename'])
        if ext not in allowed_extensions:
            FileStorage.delete_file(result['path'])
            return {
                'success': False,
                'errors': [f'File extension {ext} not allowed. Allowed: {", ".join(allowed_extensions)}']
            }
    
    return result

def delete_file(file_path: str) -> bool:
    """
    Delete a file (compatibility function)
    
    Args:
        file_path: Path to the file to delete
    
    Returns:
        True if deleted, False otherwise
    """
    return FileStorage.delete_file(file_path)

def get_file_url(file_path: str) -> str:
    """
    Get URL for a file (compatibility function)
    
    Args:
        file_path: Path to the file
    
    Returns:
        URL string
    """
    if file_path:
        # Remove uploads/ prefix if present
        url_path = file_path.replace('uploads/', '')
        return f"/uploads/{url_path}"
    return None