"""Structured logging configuration for Ayush API."""
import logging
import sys
import json
from datetime import datetime
from typing import Any, Dict, Optional
from contextvars import ContextVar

# Context variable to store request ID for tracing
request_id_var: ContextVar[Optional[str]] = ContextVar("request_id", default=None)


class StructuredFormatter(logging.Formatter):
    """JSON formatter for structured logging."""

    def format(self, record: logging.LogRecord) -> str:
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add request ID if available
        request_id = request_id_var.get()
        if request_id:
            log_data["request_id"] = request_id

        # Add extra fields from record
        for key, value in record.__dict__.items():
            if key not in {
                "name", "msg", "args", "created", "filename", "funcName",
                "levelname", "levelno", "lineno", "module", "msecs",
                "message", "msg", "name", "pathname", "process", "processName",
                "relativeCreated", "thread", "threadName", "exc_info", "exc_text",
                "stack_info"
            }:
                log_data[key] = value

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data, default=str)


def setup_logging(level: str = "INFO") -> None:
    """Configure structured logging for the application."""
    log_level = getattr(logging, level.upper(), logging.INFO)

    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Console handler with structured formatter
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(StructuredFormatter())
    root_logger.addHandler(console_handler)

    # Set specific loggers
    logging.getLogger("uvicorn").setLevel(log_level)
    logging.getLogger("uvicorn.access").setLevel(log_level)
    logging.getLogger("motor").setLevel(logging.WARNING)
    logging.getLogger("pymongo").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Get a logger with the given name."""
    return logging.getLogger(name)


class RequestLogger:
    """Helper for logging requests with structured data."""

    @staticmethod
    def log_request(logger: logging.Logger, method: str, path: str, status_code: int,
                    duration_ms: float, request_id: Optional[str] = None,
                    user_id: Optional[str] = None, **extra):
        """Log an HTTP request."""
        logger.info(
            "HTTP request",
            extra={
                "http_method": method,
                "http_path": path,
                "http_status": status_code,
                "duration_ms": duration_ms,
                "request_id": request_id,
                "user_id": user_id,
                **extra
            }
        )

    @staticmethod
    def log_error(logger: logging.Logger, message: str, error: Exception,
                  request_id: Optional[str] = None, user_id: Optional[str] = None, **extra):
        """Log an error with context."""
        logger.error(
            message,
            extra={
                "error_type": type(error).__name__,
                "error_message": str(error),
                "request_id": request_id,
                "user_id": user_id,
                **extra
            },
            exc_info=True
        )

    @staticmethod
    def log_business_event(logger: logging.Logger, event: str,
                           user_id: Optional[str] = None, profile_id: Optional[str] = None,
                           request_id: Optional[str] = None, **extra):
        """Log a business event (user action, system event, etc.)."""
        logger.info(
            f"Business event: {event}",
            extra={
                "event": event,
                "user_id": user_id,
                "profile_id": profile_id,
                "request_id": request_id,
                **extra
            }
        )