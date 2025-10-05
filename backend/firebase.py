"""Firebase initialization and helpers for TechSpace backend."""

from __future__ import annotations
import os
import json
from functools import lru_cache
from typing import Optional, Dict, Any

import firebase_admin
from firebase_admin import credentials, auth, firestore as admin_firestore

class FirebaseInitError(RuntimeError):
    pass

@lru_cache(maxsize=1)
def get_app():
    # If already initialized, reuse it
    if firebase_admin._apps:  # type: ignore[attr-defined]
        return firebase_admin.get_app()

    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    cred_json = os.getenv("FIREBASE_CREDENTIALS_JSON")

    try:
        if cred_path:
            if not os.path.isabs(cred_path):
                cred_path = os.path.abspath(os.path.join(os.getcwd(), cred_path))
            if not os.path.exists(cred_path):
                raise FirebaseInitError(f"Credentials file not found at: {cred_path}")
            cred = credentials.Certificate(cred_path)
            return firebase_admin.initialize_app(cred)

        if cred_json:
            try:
                data = json.loads(cred_json)
            except Exception as e:
                raise FirebaseInitError("Invalid FIREBASE_CREDENTIALS_JSON content") from e
            cred = credentials.Certificate(data)
            return firebase_admin.initialize_app(cred)

        # Fallback to Application Default Credentials if available
        return firebase_admin.initialize_app()

    except Exception as e:
        raise FirebaseInitError(f"Failed to initialize Firebase app: {e}") from e

@lru_cache(maxsize=1)
def get_db():
    app = get_app()
    return admin_firestore.client(app)

def verify_token(id_token: str) -> Dict[str, Any]:
    try:
        return auth.verify_id_token(id_token)
    except Exception as exc:
        raise ValueError("Invalid token") from exc
