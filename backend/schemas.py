"""Pydantic models for TechSpace API."""

from __future__ import annotations
from typing import List, Optional, Literal, Any
from pydantic import BaseModel, Field, validator, EmailStr
import base64
import json

AuthorMode = Literal["public", "anon"]


# Cursor helpers (doc_id + timestamp iso) for pagination
def encode_cursor(doc_id: str, ts: float) -> str:
    raw = json.dumps({"id": doc_id, "ts": ts}).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("utf-8")


def decode_cursor(token: str) -> Optional[dict[str, Any]]:
    if not token:
        return None
    try:
        data = base64.urlsafe_b64decode(token.encode("utf-8"))
        return json.loads(data.decode("utf-8"))
    except Exception:
        return None


# Comment cursor that can include score + sort variant
def encode_comment_cursor(
    doc_id: str, created_at: float, sort: str, score: float | None = None
) -> str:
    payload: dict[str, Any] = {"id": doc_id, "ts": created_at, "sort": sort}
    if sort == "top" and score is not None:
        payload["score"] = score
    return base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()


def decode_comment_cursor(token: str) -> Optional[dict[str, Any]]:
    return decode_cursor(token)


class APIError(BaseModel):
    code: int
    message: str
    details: Optional[dict[str, Any]] = None


class ErrorEnvelope(BaseModel):
    error: APIError


class ProfileIn(BaseModel):
    display_name: str = Field(min_length=1, max_length=120)
    # Using pattern (regex deprecated keyword in Pydantic v2)
    username: str = Field(min_length=3, max_length=40, pattern=r"^[A-Za-z0-9_]+$")
    resume_url: Optional[str] = Field(default=None)
    allow_anonymous: Optional[bool] = True

    @validator("username")
    def normalize_username(cls, v: str) -> str:
        return v.strip()

    @validator("display_name")
    def trim_display_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("display_name cannot be empty")
        return v

    @validator("resume_url")
    def validate_resume_url(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if v and not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("resume_url must start with http:// or https://")
        return v


class ProfileOut(BaseModel):
    uid: str
    display_name: str
    username: str
    allow_anonymous: bool
    resume_url: Optional[str]
    created_at: float
    updated_at: float


# Auth Models
USERNAME_PATTERN = r"^[A-Za-z0-9_]{3,24}$"


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=120)
    username: str = Field(pattern=USERNAME_PATTERN)

    @validator("username")
    def norm_username(cls, v: str) -> str:  # noqa: D401
        return v.strip()

    @validator("display_name")
    def norm_display(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("display_name cannot be empty")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=10)


class TokenBundle(BaseModel):
    id_token: str
    refresh_token: str
    expires_in: int


class AuthUserProfile(BaseModel):
    uid: str
    email: EmailStr
    display_name: str
    username: str


class RegisterResponse(BaseModel):
    user: AuthUserProfile
    tokens: TokenBundle


class LoginResponse(BaseModel):
    tokens: TokenBundle


class RefreshResponse(BaseModel):
    tokens: TokenBundle


class ThreadCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    body: str = Field(max_length=5000)
    tags: List[str] = Field(default_factory=list, max_items=5)
    author_mode: AuthorMode = "public"

    @validator("tags", each_item=True)
    def validate_tag(cls, v: str) -> str:
        v = v.strip().lower()
        if len(v) < 2 or len(v) > 20:
            raise ValueError("Tag length 2-20")
        return v


class ThreadOut(BaseModel):
    id: str
    title: str
    body: str
    tags: List[str]
    author_mode: AuthorMode
    author_uid: Optional[str]  # masked if anon
    comment_count: int
    last_activity: float
    created_at: float
    updated_at: float


class ThreadsPage(BaseModel):
    items: List[ThreadOut]
    next_page_token: Optional[str] = None


class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=5000)
    author_mode: AuthorMode = "public"


class CommentOut(BaseModel):
    id: str
    body: str
    author_mode: AuthorMode
    author_uid: Optional[str]  # masked if anon
    created_at: float
    score: float


def mask_author_uid(author_mode: AuthorMode, uid: str | None) -> Optional[str]:
    return None if author_mode == "anon" else uid


class CommentsPage(BaseModel):
    items: List[CommentOut]
    next_page_token: Optional[str] = None
