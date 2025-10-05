"""Shared dependencies: auth, rate limiting."""

from __future__ import annotations
import os
import time
from fastapi import Header, HTTPException, Depends
from .firebase import verify_token, get_db
from typing import Optional, Dict, Any

RATE_LIMIT_PER_MIN = int(__import__("os").getenv("RATE_LIMIT_PER_MINUTE", "120"))

# Simple in-memory rate limiter {key: (window_start, count)}
_rate_state: Dict[str, tuple[float, int]] = {}


class UserContext(Dict[str, Any]):
    uid: str  # type: ignore[assignment]


def get_current_user(authorization: str | None = Header(default=None)):
    # Dev-only bypass: if set, skip Firebase verification
    dev_uid = os.getenv("DEV_BYPASS_UID")
    if dev_uid:
        return {"uid": dev_uid}

    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=400, detail="Expected 'Authorization: Bearer <token>'")

    token = authorization.split(" ", 1)[1].strip()
    try:
        return verify_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def rate_limit(user: UserContext = Depends(get_current_user)):
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
