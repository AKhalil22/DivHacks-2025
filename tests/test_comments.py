import pytest
from fastapi.testclient import TestClient
from backend.main import create_app


@pytest.fixture
def client(monkeypatch):
    app = create_app()

    class DummyCommentDB:
        def __init__(self):
            self.threads = {
                "t1": {
                    "title": "x",
                    "body": "y",
                    "tags": [],
                    "author_uid": "u1",
                    "author_mode": "public",
                    "comment_count": 0,
                    "last_activity": 0,
                    "created_at": 0,
                    "updated_at": 0,
                }
            }
            self.comments = {}

        def collection(self, name):
            from types import SimpleNamespace

            if name == "threads":
                return self
            raise AssertionError

        def document(self, id):
            db = self

            class ThreadDoc:
                def __init__(self, id):
                    self.id = id

                def get(self):
                    class Snap:
                        id = self.id
                        exists = self.id in db.threads

                        def to_dict(inner):
                            return db.threads[self.id]

                    return Snap()

                def collection(self, name):
                    assert name == "comments"

                    class CommentsCol:
                        def document(self, cid=None):
                            if cid is None:
                                cid = f"c{len(db.comments)+1}"

                            class CommentRef:
                                def __init__(self, cid):
                                    self.id = cid

                                def set(self, data):
                                    db.comments[self.id] = data

                            return CommentRef(cid)

                        def order_by(self, *args, **kwargs):
                            return self

                        def limit(self, n):
                            return self

                        def stream(self):
                            for k, v in db.comments.items():

                                class Snap:
                                    id = k

                                    def to_dict(self):
                                        return v

                                yield Snap()

                    return CommentsCol()

            return ThreadDoc(id)

        def transaction(self):
            class Txn:
                def __init__(self, outer):
                    self._outer = outer

                def call(self, fn):
                    return fn(self)

                def update(self, ref, data):
                    self._outer.threads[ref.id].update(data)

                def set(self, ref, data):
                    self._outer.comments[ref.id] = data

            return Txn(self)

    from backend import firebase

    monkeypatch.setattr(firebase, "get_db", lambda: DummyCommentDB())
    from backend import deps

    async def fake_user():
        return {"uid": "u1"}

    monkeypatch.setattr(deps, "get_current_user", fake_user)
    return TestClient(app)


def test_add_comment(client):
    r = client.post(
        "/threads/t1/comments",
        json={"body": "First", "author_mode": "public"},
        headers={"Authorization": "Bearer x"},
    )
    assert r.status_code == 201
    assert r.json()["body"] == "First"


def test_list_comments(client):
    client.post(
        "/threads/t1/comments",
        json={"body": "First", "author_mode": "public"},
        headers={"Authorization": "Bearer x"},
    )
    r = client.get("/threads/t1/comments")
    assert r.status_code == 200
    assert len(r.json()["items"]) >= 1


def test_empty_comment_validation(client):
    r = client.post(
        "/threads/t1/comments",
        json={"body": "", "author_mode": "public"},
        headers={"Authorization": "Bearer x"},
    )
    assert r.status_code == 422
