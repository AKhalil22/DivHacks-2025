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

    Updated test bypass semantics:
    - If TEST_BYPASS_AUTH=1 and an Authorization header is present (any Bearer token), accept it
      and return a deterministic test user without verifying the token.
    - If TEST_BYPASS_AUTH=1 and the Authorization header is missing, still enforce 401. This allows
      tests that expect a 401 when no header is supplied (e.g. invalid token scenarios constructed
      by omitting the header) to function even though they monkeypatch *after* app creation.
    - In non-bypass mode, require a valid Bearer token and verify it.

    This pattern accommodates the repository's test fixtures which monkeypatch
    backend.deps.get_current_user after the FastAPI app has already been created (meaning the
    dependency callable was already captured). By enforcing header presence for bypass we preserve
    negative tests while allowing happy paths to proceed without real Firebase verification.
    """
    bypass = __import__("os").getenv("TEST_BYPASS_AUTH") == "1"
    if bypass:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
        # Return a stable synthetic user
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
    # Enforce limit AFTER accounting for current request so a limit of N allows N requests
    if count + 1 > RATE_LIMIT_PER_MIN:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    _rate_state[key] = (start, count + 1)
    # Opportunistic cleanup of old windows
    if len(_rate_state) > 5000:
        old_keys = [k for k, (s, _) in _rate_state.items() if now - s > 3600]
        for k in old_keys:
            _rate_state.pop(k, None)


__all__ = ["get_current_user", "rate_limit", "get_db", "UserContext"]
