from fastapi import HTTPException, Request
from datetime import datetime, timedelta
from collections import defaultdict
import threading

# Simple in-memory rate limiter (production: use Redis)
_store: dict = defaultdict(list)
_lock = threading.Lock()

def rate_limit(max_calls: int, period_seconds: int):
    """Decorator factory for rate limiting by IP + endpoint."""
    def decorator(func):
        import functools
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            request: Request = kwargs.get('request') or (args[0] if args and isinstance(args[0], Request) else None)
            client_ip = request.client.host if request and hasattr(request, 'client') and request.client else 'unknown'
            key = f"{func.__name__}:{client_ip}"
            now = datetime.utcnow()
            cutoff = now - timedelta(seconds=period_seconds)
            with _lock:
                _store[key] = [t for t in _store[key] if t > cutoff]
                if len(_store[key]) >= max_calls:
                    raise HTTPException(
                        status_code=429,
                        detail=f"Trop de requêtes. Limite: {max_calls} par {period_seconds}s."
                    )
                _store[key].append(now)
            return await func(*args, **kwargs)
        return wrapper
    return decorator
