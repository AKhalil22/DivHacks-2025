"""Shared dependencies: auth, rate limiting."""

from __future__ import annotations
from fastapi import Header, HTTPException, Depends
from .firebase import verify_token, get_db
import time
from typing import Optional, Dict, Any

RATE_LIMIT_PER_MIN = int(__import__("os").getenv("RATE_LIMIT_PER_MINUTE", "120"))

# Simple in-memory rate limiter {key: (window_start, count)}
_rate_state: Dict[str, tuple[float, int]] = {}


class UserContext(Dict[str, Any]):
    uid: str  # type: ignore[assignment]


async def get_current_user(authorization: Optional[str] = Header(None)) -> UserContext:
    """Return authenticated user context.

    Test bypass mode (TEST_BYPASS_AUTH=1) now only supplies a dummy user when *no* Authorization
    header is provided. This lets tests that monkeypatch deps.get_current_user still take effect
    and allows explicit Bearer tokens (patched verify flows) to be exercised. This change fixes
    /auth/me 404 caused by always returning a synthetic uid that did not correspond to test-created
    profiles.
    """
    bypass = __import__("os").getenv("TEST_BYPASS_AUTH") == "1"
    if (not authorization or not authorization.startswith("Bearer ")) and bypass:
        return UserContext(uid="test-user", email_verified=None)
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.split(" ", 1)[1].strip()
    try:
        decoded = verify_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token")
    return UserContext(uid=decoded.get("uid"), email_verified=decoded.get("email_verified"))


async def rate_limit(user: UserContext = Depends(get_current_user)):
    # Always enforce even in bypass so tests like rate_limit_429 can validate behavior.
    now = time.time()
    window = int(now // 60)
    key = f"{user['uid']}:{window}"
    start, count = _rate_state.get(key, (now, 0))
    if count >= RATE_LIMIT_PER_MIN:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    _rate_state[key] = (start, count + 1)
    # Opportunistic cleanup of old windows
    if len(_rate_state) > 5000:
        old_keys = [k for k, (s, _) in _rate_state.items() if now - s > 3600]
        for k in old_keys:
            _rate_state.pop(k, None)


__all__ = ["get_current_user", "rate_limit", "get_db", "UserContext"]
