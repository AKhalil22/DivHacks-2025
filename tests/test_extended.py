import pytest
from fastapi.testclient import TestClient
from backend.main import create_app


@pytest.fixture
def app():
    return create_app()


@pytest.fixture
def mock_db(monkeypatch):
    # Unified dummy DB including users, threads, comments, reports, blocks
    class DummyDB:
        def __init__(self):
            self.users = {}
            self.threads = {}
            self.comments = {}  # key: (thread_id, comment_id)
            self.reports = {}
            self.blocks = {}

        # Collections dispatch
        def collection(self, name):
            db = self
            if name == "users":

                class UsersCol:
                    def where(self, field, op, value):
                        assert field == "username_lower" and op == "=="

                        class Streamer:
                            def __init__(self, records):
                                self._records = records

                            def stream(self):
                                for uid, data in self._records:

                                    class Snap:
                                        id = uid

                                        def to_dict(self_inner):
                                            return data

                                    yield Snap()

                        class Query:
                            def limit(self, n_inner):
                                matches = [
                                    (uid, data)
                                    for uid, data in db.users.items()
                                    if data.get("username_lower") == value
                                ]
                                return Streamer(matches[:n_inner])

                        return Query()

                    def document(self, doc_id):
                        class UserDoc:
                            def get(self):
                                class Snap:
                                    id = doc_id
                                    exists = doc_id in db.users

                                    def to_dict(self):
                                        return db.users.get(doc_id)

                                    def get(self, key):
                                        return db.users.get(doc_id, {}).get(key)

                                return Snap()

                            def set(self, data):
                                db.users[doc_id] = data

                            def update(self, data):
                                db.users[doc_id].update(data)

                        return UserDoc()

                return UsersCol()
            if name == "threads":

                class ThreadsCol:
                    def document(self, doc_id=None):
                        if doc_id is None:
                            doc_id = f"t{len(db.threads)+1}"

                        class ThreadDoc:
                            id = doc_id

                            def set(self, data):
                                db.threads[self.id] = data

                            def get(self):
                                class Snap:
                                    id = self.id
                                    exists = self.id in db.threads

                                    def to_dict(self):
                                        return db.threads[self.id]

                                return Snap()

                            def collection(self, name):
                                assert name == "comments"

                                class CommentsCol:
                                    def document(self, cid=None):
                                        if cid is None:
                                            cid = f"c{sum(1 for (tid,_) in db.comments if tid==doc_id)+1}"

                                        class CommentDoc:
                                            id = cid

                                            def set(self, data):
                                                db.comments[(doc_id, self.id)] = data

                                        return CommentDoc()

                                    def order_by(self, *args, **kwargs):
                                        return self

                                    def limit(self, n):
                                        return self

                                    def stream(self):
                                        # naive order by created_at desc for tests
                                        items = [
                                            ((tid, cid), v)
                                            for (tid, cid), v in db.comments.items()
                                            if tid == doc_id
                                        ]
                                        for (tid, cid), v in items:

                                            class Snap:
                                                id = cid

                                                def to_dict(self):
                                                    return v

                                            yield Snap()

                                return CommentsCol()

                        return ThreadDoc()

                    def order_by(self, *args, **kwargs):
                        return self

                    def where(self, *args, **kwargs):
                        return self

                    def limit(self, n):
                        return self

                    def stream(self):
                        for k, v in db.threads.items():

                            class Snap:
                                id = k

                                def to_dict(self):
                                    return v

                            yield Snap()

                return ThreadsCol()
            if name == "reports":

                class ReportsCol:
                    def document(self):
                        rid = f"r{len(db.reports)+1}"

                        class ReportDoc:
                            id = rid

                            def set(self, data):
                                db.reports[self.id] = data

                        return ReportDoc()

                return ReportsCol()
            if name == "blocks":

                class BlocksCol:
                    def document(self, key):
                        class BlockDoc:
                            id = key

                            def set(self, data):
                                db.blocks[self.id] = data

                        return BlockDoc()

                return BlocksCol()
            raise AssertionError("Unknown collection " + name)

        def transaction(self):
            db = self

            class Txn:
                def call(self, fn):
                    return fn(self)

                def update(self, ref, data):
                    db.threads[ref.id].update(data)

                def set(self, ref, data):
                    if hasattr(ref, "id") and ref.id in db.threads:
                        db.threads[ref.id].update(data)

            return Txn()

    dummy = DummyDB()
    from backend import firebase

    monkeypatch.setattr(firebase, "get_db", lambda: dummy)
    return dummy


@pytest.fixture
def auth_ok(monkeypatch):
    from backend import deps

    async def fake_user():
        return {"uid": "uX"}

    monkeypatch.setattr(deps, "get_current_user", fake_user)


@pytest.fixture
def auth_bad(monkeypatch):
    from backend import deps

    async def bad_user():
        raise Exception("bad auth")

    monkeypatch.setattr(deps, "get_current_user", bad_user)


@pytest.fixture
def client(app, auth_ok):
    return TestClient(app)


def test_profile_create_and_update(client, mock_db):
    r = client.post(
        "/profiles", json={"display_name": " Alice ", "username": "Alice_1"}
    )
    assert r.status_code == 201
    uid = r.json()["uid"]
    # update same username
    r2 = client.post(
        "/profiles", json={"display_name": "Alice B", "username": "Alice_1"}
    )
    assert r2.status_code == 200
    assert r2.json()["username"] == "Alice_1"
    assert r2.json()["created_at"] == r.json()["created_at"]


def test_duplicate_username(client, mock_db):
    client.post("/profiles", json={"display_name": "User1", "username": "DupName"})
    r = client.post("/profiles", json={"display_name": "Other", "username": "dupname"})
    assert r.status_code == 409


def test_thread_pagination(client, mock_db):
    for i in range(3):
        client.post(
            "/threads",
            json={"title": f"T{i}", "body": "b", "tags": [], "author_mode": "public"},
        )
    r1 = client.get("/threads?limit=2")
    assert r1.status_code == 200
    first_page = r1.json()
    assert len(first_page["items"]) == 2
    assert first_page["next_page_token"]
    r2 = client.get(f"/threads?limit=2&page_token={first_page['next_page_token']}")
    assert r2.status_code == 200
    assert len(r2.json()["items"]) >= 1


def test_comment_pagination(client, mock_db):
    # make thread
    tr = client.post(
        "/threads",
        json={"title": "TT", "body": "b", "tags": [], "author_mode": "public"},
    )
    tid = tr.json()["id"]
    for i in range(5):
        client.post(
            f"/threads/{tid}/comments", json={"body": f"C{i}", "author_mode": "public"}
        )
    r1 = client.get(f"/threads/{tid}/comments?limit=3")
    assert r1.status_code == 200
    assert len(r1.json()["items"]) == 3
    token = r1.json()["next_page_token"]
    r2 = client.get(f"/threads/{tid}/comments?limit=3&page_token={token}")
    assert r2.status_code == 200


def test_invalid_token_401(app, monkeypatch):
    # override dependency to simulate invalid token raising HTTPException(401) via wrapper
    from backend import deps

    async def invalid():
        from fastapi import HTTPException

        raise HTTPException(status_code=401, detail="Invalid token")

    monkeypatch.setattr(deps, "get_current_user", invalid)
    client = TestClient(app)
    r = client.post(
        "/threads",
        json={"title": "X", "body": "b", "tags": [], "author_mode": "public"},
    )
    assert r.status_code == 401


def test_thread_not_found_404(client, mock_db):
    r = client.post(
        "/threads/NOPE/comments", json={"body": "hi", "author_mode": "public"}
    )
    assert r.status_code == 404


def test_rate_limit_429(app, monkeypatch):
    from backend import deps

    calls = {"n": 0}

    async def user():
        return {"uid": "rl"}

    monkeypatch.setattr(deps, "get_current_user", user)
    # shrink limit
    monkeypatch.setattr(deps, "RATE_LIMIT_PER_MIN", 2)
    client = TestClient(app)
    for i in range(2):
        assert (
            client.post(
                "/threads",
                json={
                    "title": f"A{i}",
                    "body": "b",
                    "tags": [],
                    "author_mode": "public",
                },
            ).status_code
            == 201
        )
    r = client.post(
        "/threads",
        json={"title": "A2", "body": "b", "tags": [], "author_mode": "public"},
    )
    assert r.status_code == 429
