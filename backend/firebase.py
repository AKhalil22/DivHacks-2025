"""Firebase initialization and helpers for TechSpace backend."""

from __future__ import annotations
import os
import json
from functools import lru_cache
from typing import Optional, Dict, Any

import firebase_admin
from firebase_admin import credentials, auth
from google.cloud import firestore

PROJECT_ID_ENV = "FIREBASE_PROJECT_ID"
CREDENTIALS_JSON_ENV = "FIREBASE_CREDENTIALS_JSON"


class FirebaseInitError(RuntimeError):
    pass


@lru_cache(maxsize=1)
def get_app():
    """Initialize and return the firebase app singleton.

    Credentials preference order:
    1. FIREBASE_CREDENTIALS_JSON (inline JSON string path or JSON string)
    2. GOOGLE_APPLICATION_CREDENTIALS (handled implicitly)
    """
    if firebase_admin._apps:  # type: ignore[attr-defined]
        return firebase_admin.get_app()

    project_id = os.getenv(PROJECT_ID_ENV)
    if not project_id:
        raise FirebaseInitError("FIREBASE_PROJECT_ID not set")

    cred_json = os.getenv(CREDENTIALS_JSON_ENV)
    cred: Optional[credentials.Base] = None
    if cred_json:
        # Allow passing a path or raw json
        if os.path.isfile(cred_json):
            cred = credentials.Certificate(cred_json)
        else:
            try:
                data = json.loads(cred_json)
                cred = credentials.Certificate(data)
            except json.JSONDecodeError as e:
                raise FirebaseInitError(
                    "Invalid FIREBASE_CREDENTIALS_JSON content"
                ) from e
    # If no explicit credential, firebase_admin will attempt default creds
    if cred:
        return firebase_admin.initialize_app(cred, {"projectId": project_id})
    return firebase_admin.initialize_app(options={"projectId": project_id})


@lru_cache(maxsize=1)
def get_db() -> firestore.Client:
    app = get_app()
    return firestore.client(app=app)  # type: ignore[arg-type]


def verify_token(id_token: str) -> Dict[str, Any]:
    try:
        decoded = auth.verify_id_token(id_token)
        return decoded
    except Exception as exc:  # Broad catch to convert to 401 upstream
        raise ValueError("Invalid token") from exc
