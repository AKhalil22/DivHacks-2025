import sys
import os
from pathlib import Path
import pytest

# Ensure project root (which contains the 'backend' package) is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


@pytest.fixture(autouse=True, scope="session")
def test_env_setup():
    """Provide minimal firebase env so create_app() doesn't error.

    We deliberately set FIREBASE_PROJECT_ID (required) but leave FIREBASE_CREDENTIALS_JSON empty
    so that firebase.get_app() initializes without credentials and token verification paths
    can be monkeypatched by individual tests.
    """
    os.environ.setdefault("FIREBASE_PROJECT_ID", "test-project")
    # Provide a dummy web api key so auth register/login endpoints don't 500 in tests
    os.environ.setdefault("FIREBASE_WEB_API_KEY", "test-key")
    # Enable dependency bypass so non-auth specific tests don't need token mocking
    os.environ.setdefault("TEST_BYPASS_AUTH", "1")
    # Ensure we don't try to parse a placeholder or path as JSON; unset credentials var if pointing to file.
    if os.environ.get("FIREBASE_CREDENTIALS_JSON") == "./firebase-service-account.json":
        os.environ.pop("FIREBASE_CREDENTIALS_JSON")
    yield


_GLOBAL_DUMMY_DB = None  # module-level singleton for dummy Firestore emulation

@pytest.fixture(autouse=True)
def patch_db(monkeypatch):
    """Provide a lightweight dummy Firestore-like interface for routes that call get_db() without tests overriding it.

    Individual tests that need custom behavior (like auth tests) will still monkeypatch backend.firebase.get_db.
    """
    from types import SimpleNamespace
    from backend import firebase

    class DummyDoc:
        def __init__(self, data=None):
            self._data = data or {}
        def get(self, transaction=None):
            class Snap:
                exists = bool(self._data)
                def to_dict(self_inner):
                    return self._data
            return Snap()
        def set(self, data):
            self._data = data
        def update(self, data):
            self._data.update(data)
        def collection(self, name):
            return DummyCollection()

    class DummyCollection:
        def __init__(self):
            self._docs = {}
        def document(self, doc_id=None):
            doc_id = doc_id or f"d{len(self._docs)+1}"
            if doc_id not in self._docs:
                self._docs[doc_id] = DummyDoc({})
            return self._docs[doc_id]
        def order_by(self, *a, **k):
            return self
        def limit(self, n):
            return self
        def stream(self):
            # Return empty iterator
            return iter([])
        def start_after(self, *a, **k):
            return self

    class DummyDB:
        def collection(self, name):
            return DummyCollection()
        def transaction(self):
            class DummyTxn:
                def call(self_inner, fn):
                    # No transactional guarantees; simple call
                    fn(SimpleNamespace())
            return DummyTxn()

    global _GLOBAL_DUMMY_DB
    if _GLOBAL_DUMMY_DB is None:
        _GLOBAL_DUMMY_DB = DummyDB()
    monkeypatch.setattr(firebase, "get_db", lambda: _GLOBAL_DUMMY_DB)
    yield


@pytest.fixture(autouse=True)
def default_auth(monkeypatch):
    """Provide a default authenticated user for routes unless a test overrides deps.get_current_user.

    Many tests rely on a simple authenticated context; previously they monkeypatched the symbol imported
    directly into each route module. After refactoring routes to import the deps module, supplying a
    default here restores those tests without each explicitly patching.
    """
    from backend import deps

    if getattr(deps.get_current_user, "__name__", "") == "get_current_user":
        async def _fake():
            return {"uid": "u_test", "email_verified": None}
        monkeypatch.setattr(deps, "get_current_user", _fake)
    yield
