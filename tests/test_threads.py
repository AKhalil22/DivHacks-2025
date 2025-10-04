import pytest
from fastapi.testclient import TestClient
from backend.main import create_app

# For tests we will monkeypatch firebase & firestore interactions.


@pytest.fixture
def client(monkeypatch):
    app = create_app()

    class DummyDB:
        def __init__(self):
            self.threads = {}

        def collection(self, name):
            assert name == "threads"
            return self

        def document(self, doc_id=None):
            from types import SimpleNamespace

            if doc_id is None:
                doc_id = f"t{len(self.threads)+1}"
            db = self

            class DocRef:
                def __init__(self, id):
                    self.id = id

                def set(self, data):
                    db.threads[self.id] = data

                def get(self):
                    class Snap:
                        exists = self.id in db.threads

                        def to_dict(inner_self):
                            return db.threads[self.id]

                        id = self.id

                    return Snap()

            return DocRef(doc_id)

        def order_by(self, *args, **kwargs):
            return self

        def where(self, *args, **kwargs):
            return self

        def limit(self, n):
            return self

        def stream(self):
            for k, v in self.threads.items():

                class Snap:
                    id = k

                    def to_dict(self):
                        return v

                yield Snap()

    # Monkeypatch get_db
    from backend import firebase

    monkeypatch.setattr(firebase, "get_db", lambda: DummyDB())
    # Patch auth
    from backend import deps

    async def fake_user():
        return {"uid": "u1"}

    monkeypatch.setattr(deps, "get_current_user", fake_user)
    return TestClient(app)


def test_list_threads_empty(client):
    r = client.get("/threads")
    assert r.status_code == 200
    assert r.json()["items"] == []


def test_create_thread(client):
    payload = {
        "title": "Hello",
        "body": "World",
        "tags": ["tag"],
        "author_mode": "public",
    }
    r = client.post("/threads", json=payload, headers={"Authorization": "Bearer x"})
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "Hello"


def test_create_thread_validation(client):
    payload = {"title": "", "body": "World", "tags": [], "author_mode": "public"}
    r = client.post("/threads", json=payload, headers={"Authorization": "Bearer x"})
    assert r.status_code == 422
