"""In-memory sliding window rate limiter for FastAPI."""
import time
import asyncio
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, Tuple, Optional
from fastapi import Request, HTTPException, status
from functools import wraps


@dataclass
class RateLimitConfig:
    """Configuration for a rate limit rule."""
    max_requests: int
    window_seconds: int
    key_prefix: str = ""


@dataclass
class _WindowEntry:
    """Single request timestamp entry."""
    timestamp: float


class SlidingWindowRateLimiter:
    """
    In-memory sliding window rate limiter.

    Uses asyncio locks for thread safety in async context.
    Not distributed - suitable for single-instance deployments.
    For multi-instance, use Redis-based limiter.
    """

    def __init__(self):
        # key -> list of timestamps
        self._windows: Dict[str, list] = defaultdict(list)
        # key -> asyncio lock for thread safety
        self._locks: Dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)
        # Config registry: endpoint_path -> RateLimitConfig
        self._configs: Dict[str, RateLimitConfig] = {}

    def register(self, path: str, config: RateLimitConfig) -> None:
        """Register a rate limit config for a path."""
        self._configs[path] = config

    def _get_client_key(self, request: Request, prefix: str = "") -> str:
        """Extract client identifier from request."""
        # Try X-Forwarded-For first (behind proxy)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"
        return f"{prefix}{client_ip}"

    async def check_limit(self, request: Request, path: str) -> Tuple[bool, dict]:
        """
        Check if request is within rate limit.
        Returns (allowed, headers_dict).
        """
        config = self._configs.get(path)
        if not config:
            # No limit configured for this path
            return True, {}

        client_key = self._get_client_key(request, config.key_prefix)
        now = time.time()
        window_start = now - config.window_seconds

        async with self._locks[client_key]:
            # Clean old entries
            window = self._windows[client_key]
            # Remove timestamps outside the window
            while window and window[0] < window_start:
                window.pop(0)

            current_count = len(window)

            if current_count >= config.max_requests:
                # Rate limited
                retry_after = int(window[0] - window_start) + 1 if window else config.window_seconds
                headers = {
                    "X-RateLimit-Limit": str(config.max_requests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(now) + retry_after),
                    "Retry-After": str(retry_after),
                }
                return False, headers

            # Add current request
            window.append(now)
            remaining = config.max_requests - current_count - 1

            headers = {
                "X-RateLimit-Limit": str(config.max_requests),
                "X-RateLimit-Remaining": str(remaining),
                "X-RateLimit-Reset": str(int(now) + config.window_seconds),
            }
            return True, headers


# Global rate limiter instance
rate_limiter = SlidingWindowRateLimiter()


def rate_limit(path: str):
    """
    FastAPI dependency for rate limiting.
    Usage:
        @router.post("/auth/login", dependencies=[Depends(rate_limit("/api/v1/auth/login"))])
    """
    async def _rate_limit_dep(request: Request):
        allowed, headers = await rate_limiter.check_limit(request, path)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later.",
                headers=headers,
            )
        # Add rate limit headers to response via request.state
        request.state.rate_limit_headers = headers
    return _rate_limit_dep


def add_rate_limit_headers(response, request: Request):
    """Middleware helper to add rate limit headers to response."""
    headers = getattr(request.state, "rate_limit_headers", {})
    for key, value in headers.items():
        response.headers[key] = value
    return response