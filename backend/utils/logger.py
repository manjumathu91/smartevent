
"""
Complete Logging System for Smart Event Management System
"""

import os
import sys
import json
import time
import logging
import logging.handlers
import traceback
from datetime import datetime
import socket
import threading
from functools import wraps
from typing import Dict, Any, Optional, List
import uuid

# ==================== SAFE IMPORTS ====================

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False

try:
    import colorlog
    HAS_COLORLOG = True
except ImportError:
    HAS_COLORLOG = False

# ==================== CONSTANTS ====================

DEFAULT_LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
DEFAULT_DATE_FORMAT = '%Y-%m-%d %H:%M:%S'

# ==================== CUSTOM FORMATTERS ====================

class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""
    
    def __init__(self, include_extra: bool = True, include_request: bool = True,
                 include_system: bool = False, **kwargs):
        super().__init__(**kwargs)
        self.include_extra = include_extra
        self.include_request = include_request
        self.include_system = include_system
    
    def format(self, record):
        """Format log record as JSON"""
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
            'message': self.formatMessage(record),
            'hostname': socket.gethostname(),
            'process_id': record.process,
            'process_name': record.processName,
            'thread_id': record.thread,
            'thread_name': record.threadName,
        }
        
        # Add exception info
        if record.exc_info:
            log_data['exception'] = {
                'type': record.exc_info[0].__name__,
                'message': str(record.exc_info[1]),
                'traceback': ''.join(traceback.format_tb(record.exc_info[2]))
            }
        
        # Add extra fields
        if self.include_extra and hasattr(record, 'extra'):
            log_data.update(record.extra)
        
        # Add request context - SAFELY
        if self.include_request:
            try:
                from flask import has_request_context, request
                if has_request_context():
                    log_data['request'] = {
                        'method': request.method,
                        'path': request.path,
                        'full_path': request.full_path,
                        'ip': request.remote_addr,
                        'user_agent': request.headers.get('User-Agent'),
                        'referer': request.headers.get('Referer'),
                    }
            except:
                pass
        
        return json.dumps(log_data, default=str)

class ColoredFormatter(logging.Formatter):
    """Custom colored formatter for console output"""
    
    COLORS = {
        'DEBUG': '\033[36m',
        'INFO': '\033[32m',
        'WARNING': '\033[33m',
        'ERROR': '\033[31m',
        'CRITICAL': '\033[35m',
        'RESET': '\033[0m',
    }
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
    
    def format(self, record):
        levelname = record.levelname
        if levelname in self.COLORS:
            record.levelname = f"{self.COLORS[levelname]}{levelname}{self.COLORS['RESET']}"
        
        timestamp = datetime.fromtimestamp(record.created).strftime('%Y-%m-%d %H:%M:%S')
        module = record.module
        
        formatted = super().format(record)
        return f"[{timestamp}] [{module}] {formatted}"

# ==================== CUSTOM FILTERS ====================

class RequestIDFilter(logging.Filter):
    """Filter that adds request ID to log records"""
    
    def filter(self, record):
        """Add request ID to record"""
        try:
            from flask import has_request_context, request
            if has_request_context():
                record.request_id = request.headers.get('X-Request-ID', str(uuid.uuid4())[:8])
                record.correlation_id = getattr(request, 'correlation_id', None)
            else:
                record.request_id = 'no-request'
                record.correlation_id = None
        except:
            record.request_id = 'no-request'
            record.correlation_id = None
        return True

class UserFilter(logging.Filter):
    """Filter that adds user info to log records"""
    
    def filter(self, record):
        """Add user info to record"""
        record.user_id = None
        try:
            # Only try to get user if we're in a request context
            from flask import has_request_context
            if has_request_context():
                try:
                    from flask_jwt_extended import get_jwt_identity
                    record.user_id = get_jwt_identity()
                except:
                    pass
        except:
            pass
        return True

class EnvironmentFilter(logging.Filter):
    """Filter to add environment information"""
    
    def filter(self, record):
        record.environment = os.environ.get('FLASK_ENV', 'development')
        record.app_version = os.environ.get('APP_VERSION', '1.0.0')
        return True

# ==================== LOGGER MANAGER ====================

class LoggerManager:
    """Centralized logger management"""
    
    _instance = None
    _loggers = {}
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.config = self._default_config()
        self._setup_root_logger()
    
    def _default_config(self) -> Dict[str, Any]:
        return {
            'log_dir': 'logs',
            'log_level': 'INFO',
            'max_bytes': 10 * 1024 * 1024,
            'backup_count': 30,
            'console_enabled': True,
            'file_enabled': True,
            'json_enabled': True,
            'color_enabled': True,
        }
    
    def _setup_root_logger(self):
        """Setup root logger"""
        root_logger = logging.getLogger()
        root_logger.setLevel(logging.INFO)
        for handler in root_logger.handlers[:]:
            root_logger.removeHandler(handler)
    
    def configure(self, **kwargs):
        self.config.update(kwargs)
        self._reconfigure_all_loggers()
    
    def _reconfigure_all_loggers(self):
        for logger_name, logger in self._loggers.items():
            self._setup_logger(logger, logger_name)
    
    def _setup_logger(self, logger: logging.Logger, name: str):
        """Setup a logger with handlers"""
        for handler in logger.handlers[:]:
            logger.removeHandler(handler)
        
        log_level = self.config.get('log_level', 'INFO')
        logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
        
        log_dir = self.config.get('log_dir', 'logs')
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)
        
        # Add filters
        logger.addFilter(RequestIDFilter())
        logger.addFilter(UserFilter())
        logger.addFilter(EnvironmentFilter())
        
        # Console handler
        if self.config.get('console_enabled', True):
            console_handler = logging.StreamHandler(sys.stdout)
            console_handler.setLevel(logger.level)
            
            if self.config.get('color_enabled', True):
                console_formatter = ColoredFormatter()
            else:
                console_formatter = logging.Formatter(
                    self.config.get('format', DEFAULT_LOG_FORMAT),
                    self.config.get('date_format', DEFAULT_DATE_FORMAT)
                )
            
            console_handler.setFormatter(console_formatter)
            logger.addHandler(console_handler)
        
        # File handler
        if self.config.get('file_enabled', True):
            log_file = os.path.join(log_dir, f"{name}.log")
            file_handler = logging.handlers.RotatingFileHandler(
                log_file,
                maxBytes=self.config.get('max_bytes', 10 * 1024 * 1024),
                backupCount=self.config.get('backup_count', 30),
                encoding='utf-8'
            )
            file_handler.setLevel(logger.level)
            
            if self.config.get('json_enabled', True):
                file_formatter = JSONFormatter()
            else:
                file_formatter = logging.Formatter(
                    self.config.get('format', DEFAULT_LOG_FORMAT),
                    self.config.get('date_format', DEFAULT_DATE_FORMAT)
                )
            
            file_handler.setFormatter(file_formatter)
            logger.addHandler(file_handler)
        
        self._loggers[name] = logger
    
    def get_logger(self, name: str = None) -> logging.Logger:
        if name is None:
            name = 'app'
        
        if name not in self._loggers:
            logger = logging.getLogger(name)
            self._setup_logger(logger, name)
            self._loggers[name] = logger
        
        return self._loggers[name]

# ==================== GLOBAL LOGGER INSTANCES ====================

_logger_manager = LoggerManager()

def get_logger(name: str = None) -> logging.Logger:
    return _logger_manager.get_logger(name)

def get_access_logger() -> logging.Logger:
    return _logger_manager.get_logger('access')

def get_security_logger() -> logging.Logger:
    return _logger_manager.get_logger('security')

def get_performance_logger() -> logging.Logger:
    return _logger_manager.get_logger('performance')

def get_database_logger() -> logging.Logger:
    return _logger_manager.get_logger('database')

def get_api_logger() -> logging.Logger:
    return _logger_manager.get_logger('api')

def get_error_logger() -> logging.Logger:
    return _logger_manager.get_logger('error')

def get_debug_logger() -> logging.Logger:
    return _logger_manager.get_logger('debug')

# ==================== DECORATORS ====================

def log_function(logger=None, level=logging.INFO, include_args=True):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            log = logger or get_logger()
            start_time = time.time()
            
            log_data = {
                'function': func.__name__,
                'module': func.__module__,
            }
            
            if include_args:
                args_str = str(args)
                if len(args_str) > 500:
                    args_str = args_str[:500] + '...'
                log_data['args'] = args_str
                
                kwargs_str = str(kwargs)
                if len(kwargs_str) > 500:
                    kwargs_str = kwargs_str[:500] + '...'
                log_data['kwargs'] = kwargs_str
            
            log.log(level, f"Calling {func.__name__}", extra=log_data)
            
            try:
                result = func(*args, **kwargs)
                execution_time = (time.time() - start_time) * 1000
                log_data['execution_time_ms'] = f"{execution_time:.2f}"
                log.log(level, f"Completed {func.__name__}", extra=log_data)
                return result
            except Exception as e:
                log.error(f"Error in {func.__name__}: {str(e)}", exc_info=True)
                raise
        return wrapper
    return decorator

def log_performance(logger=None, threshold: float = None):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            log = logger or get_performance_logger()
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                duration = (time.time() - start_time) * 1000
                
                log_data = {
                    'function': func.__name__,
                    'module': func.__module__,
                    'duration_ms': f"{duration:.2f}",
                }
                
                if HAS_PSUTIL:
                    log_data['cpu_percent'] = psutil.cpu_percent(interval=0.1)
                    log_data['memory_mb'] = psutil.Process().memory_info().rss / (1024 * 1024)
                
                if threshold and duration > threshold:
                    log.warning(f"Performance threshold exceeded: {func.__name__}", extra=log_data)
                else:
                    log.info(f"Performance: {func.__name__}", extra=log_data)
                
                return result
            except Exception as e:
                log.error(f"Performance error in {func.__name__}: {str(e)}", exc_info=True)
                raise
        return wrapper
    return decorator

def log_exception(logger=None, reraise=True):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            log = logger or get_error_logger()
            try:
                return func(*args, **kwargs)
            except Exception as e:
                log.error(f"Exception in {func.__name__}: {str(e)}", exc_info=True)
                if reraise:
                    raise
                return None
        return wrapper
    return decorator

# ==================== CONTEXT MANAGERS ====================

class LogContext:
    def __init__(self, logger, message, level=logging.INFO, **kwargs):
        self.logger = logger
        self.message = message
        self.level = level
        self.kwargs = kwargs
        self.start_time = None
    
    def __enter__(self):
        self.start_time = time.time()
        self.logger.log(self.level, f"Starting: {self.message}", extra=self.kwargs)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = (time.time() - self.start_time) * 1000
        self.kwargs['duration_ms'] = f"{duration:.2f}"
        
        if exc_type:
            self.logger.error(f"Failed: {self.message}", extra=self.kwargs, exc_info=True)
        else:
            self.logger.log(self.level, f"Completed: {self.message}", extra=self.kwargs)

# ==================== FLASK INTEGRATION ====================

class FlaskLogger:
    def __init__(self, app=None):
        self.app = app
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        _logger_manager.configure(
            log_dir=app.config.get('LOG_DIR', 'logs'),
            log_level=app.config.get('LOG_LEVEL', 'INFO'),
            max_bytes=app.config.get('LOG_MAX_BYTES', 10 * 1024 * 1024),
            backup_count=app.config.get('LOG_BACKUP_COUNT', 30),
            console_enabled=app.config.get('LOG_CONSOLE_ENABLED', True),
            file_enabled=app.config.get('LOG_FILE_ENABLED', True),
            json_enabled=app.config.get('LOG_JSON_ENABLED', True),
            color_enabled=app.config.get('LOG_COLOR_ENABLED', True),
        )
        
        # Store loggers in app - safely
        app.logger = get_logger()
        app.access_logger = get_access_logger()
        app.security_logger = get_security_logger()
        app.performance_logger = get_performance_logger()
        app.database_logger = get_database_logger()
        app.api_logger = get_api_logger()
        app.error_logger = get_error_logger()
        app.debug_logger = get_debug_logger()
        
        # Use print for initialization message (avoids context issues)
        print("✅ FlaskLogger initialized successfully")
        return app

# ==================== SETUP FUNCTIONS ====================

def init_logger(config: Dict[str, Any] = None):
    if config:
        _logger_manager.configure(**config)
    return _logger_manager

def setup_logging(app=None, config: Dict[str, Any] = None):
    """Setup logging configuration"""
    if app:
        return FlaskLogger(app)
    elif config:
        return init_logger(config)
    else:
        return init_logger()

setup_logger = setup_logging

# ==================== TESTING ====================

def test_logging():
    print("\n📝 Testing logging system...")
    logger = get_logger()
    logger.info("Test message")
    print("✅ Logging test completed!")

# ==================== EXPORTS ====================

__all__ = [
    'get_logger',
    'get_access_logger',
    'get_security_logger',
    'get_performance_logger',
    'get_database_logger',
    'get_api_logger',
    'get_error_logger',
    'get_debug_logger',
    'log_function',
    'log_performance',
    'log_exception',
    'LogContext',
    'FlaskLogger',
    'init_logger',
    'setup_logging',
    'setup_logger',
    'test_logging',
    'LoggerManager',
]

if __name__ == '__main__':
    test_logging()