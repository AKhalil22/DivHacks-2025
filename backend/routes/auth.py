from __future__ import annotations
import os
import time
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Depends, Response
from firebase_admin import auth as fb_auth

from .. import firebase
from .. import deps
from ..schemas import (
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    RefreshResponse,
    TokenBundle,
    AuthUserProfile,
)

router = APIRouter(prefix="/auth", tags=["auth"])

SESSION_COOKIE_MAX_AGE = int(os.getenv("SESSION_COOKIE_MAX_AGE", "3600"))
ISSUE_SESSION_COOKIE = os.getenv("ISSUE_SESSION_COOKIE", "false").lower() in {"1", "true", "yes"}

IDENTITY_BASE = "https://identitytoolkit.googleapis.com/v1"
SECURETOKEN_BASE = "https://securetoken.googleapis.com/v1"


def _error(status: int, msg: str, details: Optional[dict] = None):
    raise HTTPException(status_code=status, detail={"code": status, "message": msg, "details": details or {}})


async def _sign_in_with_password(email: str, password: str):
    api_key = os.getenv("FIREBASE_WEB_API_KEY")
    if not api_key:
        _error(500, "Server missing FIREBASE_WEB_API_KEY")
    url = f"{IDENTITY_BASE}/accounts:signInWithPassword?key={api_key}"
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(url, json={"email": email, "password": password, "returnSecureToken": True})
    if r.status_code != 200:
        _error(401, "Invalid email or password")
    return r.json()


async def _exchange_refresh_token(refresh_token: str):
    api_key = os.getenv("FIREBASE_WEB_API_KEY")
    if not api_key:
        _error(500, "Server missing FIREBASE_WEB_API_KEY")
    url = f"{SECURETOKEN_BASE}/token?key={api_key}"
    data = {"grant_type": "refresh_token", "refresh_token": refresh_token}
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(url, data=data)
    if r.status_code != 200:
        _error(401, "Invalid refresh token")
    return r.json()


def _bundle(id_token: str, refresh_token: str, expires_in: int) -> TokenBundle:
    return TokenBundle(id_token=id_token, refresh_token=refresh_token, expires_in=expires_in)


def _ensure_profile(uid: str, display_name: str, username: str):
    db = firebase.get_db()
    users_ref = db.collection("users")
    doc_ref = users_ref.document(uid)
    snap = doc_ref.get()
    now = time.time()
    if not snap.exists:
        doc_ref.set(
            {
                "display_name": display_name,
                "username": username,
                "username_lower": username.lower(),
                "allow_anonymous": True,
                "resume_url": None,
                "created_at": now,
                "updated_at": now,
            }
        )
    else:
        # Ensure username_lower present (migration safety)
        data = snap.to_dict()
        if "username_lower" not in data and data.get("username"):
            doc_ref.update({"username_lower": data["username"].lower()})


@router.post("/register", response_model=RegisterResponse, status_code=201)
async def register(payload: RegisterRequest):
    # Username uniqueness (case-insensitive)
    db = firebase.get_db()
    users_ref = db.collection("users")
    existing = list(users_ref.where("username_lower", "==", payload.username.lower()).limit(1).stream())
    if existing:
        _error(409, "Username already taken")

    # Create user in Firebase Auth (email uniqueness enforced there)
    try:
        user_record = fb_auth.create_user(email=payload.email, password=payload.password, display_name=payload.display_name)
    except fb_auth.EmailAlreadyExistsError:  # type: ignore[attr-defined]
        _error(409, "Email already registered")
    except Exception:
        _error(500, "Failed to create user")

    # Sign in to obtain tokens (so user is immediately authenticated)
    sign_in_data = await _sign_in_with_password(payload.email, payload.password)
    id_token = sign_in_data.get("idToken")
    refresh_token = sign_in_data.get("refreshToken")
    expires_in = int(sign_in_data.get("expiresIn", 3600))

    # Ensure profile stored
    _ensure_profile(user_record.uid, payload.display_name, payload.username)

    # Optional session cookie
    tokens_bundle = _bundle(id_token, refresh_token, expires_in)
    resp_user = AuthUserProfile(
        uid=user_record.uid,
        email=payload.email,
        display_name=payload.display_name,
        username=payload.username,
    )
    response = RegisterResponse(user=resp_user, tokens=tokens_bundle)
    return response


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, response: Response):
    sign_in_data = await _sign_in_with_password(payload.email, payload.password)
    id_token = sign_in_data.get("idToken")
    refresh_token = sign_in_data.get("refreshToken")
    expires_in = int(sign_in_data.get("expiresIn", 3600))

    # Optionally create session cookie
    if ISSUE_SESSION_COOKIE and id_token:
        try:
            session_cookie = fb_auth.create_session_cookie(id_token, expires_in=SESSION_COOKIE_MAX_AGE)
            cookie_domain = os.getenv("COOKIE_DOMAIN")
            response.set_cookie(
                "session",
                session_cookie,
                max_age=SESSION_COOKIE_MAX_AGE,
                httponly=True,
                secure=False,  # In prod set True (HTTPS)
                samesite="lax",
                domain=cookie_domain,
                path="/",
            )
        except Exception:
            pass  # Do not fail login if cookie mint fails

    return LoginResponse(tokens=_bundle(id_token, refresh_token, expires_in))


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(payload: RefreshRequest):
    data = await _exchange_refresh_token(payload.refresh_token)
    id_token = data.get("id_token") or data.get("idToken")
    refresh_token = data.get("refresh_token") or data.get("refreshToken")
    expires_in = int(data.get("expires_in") or data.get("expiresIn") or 3600)
    # Verify id token to ensure still valid (defense-in-depth)
    try:
        firebase.verify_token(id_token)
    except Exception:
        _error(401, "Invalid refreshed token")
    return RefreshResponse(tokens=_bundle(id_token, refresh_token, expires_in))


@router.get("/me", response_model=AuthUserProfile)
async def me(user=Depends(deps.get_current_user)):
    db = firebase.get_db()
    snap = db.collection("users").document(user["uid"]).get()
    if not snap.exists:
        _error(404, "Profile not found")
    data = snap.to_dict()
    return AuthUserProfile(
        uid=user["uid"],
        email=user.get("email"),  # email may not be present in decoded token without custom claims
        display_name=data.get("display_name", ""),
        username=data.get("username", ""),
    )
