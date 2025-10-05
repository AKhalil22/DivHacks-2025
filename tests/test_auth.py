import pytest
from fastapi.testclient import TestClient
from backend.main import create_app


@pytest.fixture
def app():
    return create_app()


@pytest.fixture
def dummy_db(monkeypatch):
    # Minimal users collection to support username uniqueness + profile ensure
    class DummyDB:
        def __init__(self):
            self.users = {}  # uid -> data
            self._uid_counter = 0

        def collection(self, name):
            assert name == "users"
            db = self

            class UsersCol:
                def where(self, field, op, value):
                    assert field == "username_lower" and op == "=="

                    class Query:
                        def limit(self, n):
                            matches = []
                            for uid, data in db.users.items():
                                if data.get("username_lower") == value:
                                    class Snap:
                                        id = uid
                                        def to_dict(self_inner):
                                            return data
                                    matches.append(Snap())
                            class Streamer:
                                def stream(self_inner):
                                    for s in matches[:n]:
                                        yield s
                            return Streamer()
                    return Query()

                def document(self, uid):
                    class UserDoc:
                        def get(self):
                            class Snap:
                                id = uid
                                exists = uid in db.users
                                def to_dict(self_inner):
                                    return db.users.get(uid)
                            return Snap()
                        def set(self, data):
                            db.users[uid] = data
                        def update(self, data):
                            db.users[uid].update(data)
                    return UserDoc()
            return UsersCol()

    dummy = DummyDB()
    from backend import firebase
    monkeypatch.setattr(firebase, "get_db", lambda: dummy)
    return dummy


@pytest.fixture
def mock_identity(monkeypatch):
    # Patch httpx.AsyncClient.post used inside auth routes
    import httpx
    class FakeResp:
        def __init__(self, status_code, payload):
            self.status_code = status_code
            self._payload = payload
        def json(self):
            return self._payload

    async def fake_post(self, url, json=None, data=None):  # noqa: D401
        if 'signInWithPassword' in url:
            if json['password'] == 'BadPass':
                return FakeResp(400, {"error": "INVALID_PASSWORD"})
            # Return deterministic tokens
            return FakeResp(200, {"idToken": "id_abc", "refreshToken": "ref_abc", "expiresIn": 3600})
        if 'securetoken' in url or 'token' in url:
            if data['refresh_token'] == 'bad_refresh':
                return FakeResp(400, {"error": "INVALID_REFRESH_TOKEN"})
            return FakeResp(200, {"id_token": "id_new", "refresh_token": "ref_new", "expires_in": 3600})
        return FakeResp(404, {})

    orig_client = httpx.AsyncClient
    class FakeClient(orig_client):
        async def post(self, url, json=None, data=None):
            return await fake_post(self, url, json=json, data=data)
    monkeypatch.setattr(httpx, 'AsyncClient', FakeClient)


@pytest.fixture
def mock_firebase_admin(monkeypatch):
    # Patch firebase_admin.auth.create_user and verify_id_token
    from firebase_admin import auth as fb_auth

    created = {"count": 0, "by_email": {}}

    class DummyUser:
        def __init__(self, uid):
            self.uid = uid

    def create_user(email, password, display_name):  # noqa: D401
        if email in created['by_email']:
            raise fb_auth.EmailAlreadyExistsError("email exists")  # type: ignore[attr-defined]
        created['count'] += 1
        uid = f"u{created['count']}"
        created['by_email'][email] = uid
        return DummyUser(uid)

    def verify_id_token(token):
        if token.startswith('id_'):
            return {"uid": "u1"}
        if token.startswith('id_new'):
            return {"uid": "u1"}
        raise ValueError('bad token')

    monkeypatch.setattr(fb_auth, 'create_user', create_user)
    monkeypatch.setattr(fb_auth, 'create_session_cookie', lambda *a, **k: 'sess_cookie')
    monkeypatch.setattr(fb_auth, 'verify_id_token', verify_id_token)


@pytest.fixture
def client(app, dummy_db, mock_identity, mock_firebase_admin, monkeypatch):
    # Ensure FIREBASE_WEB_API_KEY is present for tests
    import os
    os.environ['FIREBASE_WEB_API_KEY'] = 'test_key'
    # Replace verify_token used by deps to bypass real admin check (already patched above logically)
    from backend import deps
    async def fake_user():
        return {"uid": "u1"}
    monkeypatch.setattr(deps, 'get_current_user', fake_user)
    return TestClient(app)


def test_register_success(client, dummy_db):
    r = client.post('/auth/register', json={
        'email': 'a@example.com',
        'password': 'StrongPass1',
        'display_name': 'Alice',
        'username': 'alice_1'
    })
    assert r.status_code == 201, r.text
    body = r.json()
    assert body['user']['username'] == 'alice_1'
    assert body['tokens']['id_token'] == 'id_abc'
    # Profile stored
    assert any(u.get('username') == 'alice_1' for u in dummy_db.users.values())


def test_register_duplicate_username(client, dummy_db):
    client.post('/auth/register', json={
        'email': 'a@example.com', 'password': 'StrongPass1', 'display_name': 'A', 'username': 'dup'
    })
    r = client.post('/auth/register', json={
        'email': 'b@example.com', 'password': 'StrongPass1', 'display_name': 'B', 'username': 'Dup'
    })
    assert r.status_code == 409


def test_login_success(client):
    # first register
    client.post('/auth/register', json={
        'email': 'a@example.com', 'password': 'StrongPass1', 'display_name': 'A', 'username': 'userone'
    })
    r = client.post('/auth/login', json={'email': 'a@example.com', 'password': 'StrongPass1'})
    assert r.status_code == 200
    assert r.json()['tokens']['id_token'] == 'id_abc'


def test_login_wrong_password(client):
    client.post('/auth/register', json={
        'email': 'a@example.com', 'password': 'StrongPass1', 'display_name': 'A', 'username': 'xuser'
    })
    r = client.post('/auth/login', json={'email': 'a@example.com', 'password': 'BadPass'})
    assert r.status_code == 401


def test_refresh_success(client):
    client.post('/auth/register', json={
        'email': 'a@example.com', 'password': 'StrongPass1', 'display_name': 'A', 'username': 'refuser'
    })
    r = client.post('/auth/refresh', json={'refresh_token': 'ref_abc'})
    assert r.status_code == 200
    assert r.json()['tokens']['id_token'] == 'id_new'


def test_refresh_invalid(client):
    r = client.post('/auth/refresh', json={'refresh_token': 'bad_refresh'})
    assert r.status_code == 401


def test_me_success(client, dummy_db):
    # create user via register
    client.post('/auth/register', json={
        'email': 'me@example.com', 'password': 'StrongPass1', 'display_name': 'Me', 'username': 'meuser'
    })
    r = client.get('/auth/me', headers={'Authorization': 'Bearer id_abc'})
    assert r.status_code == 200
    body = r.json()
    assert body['username'] == 'meuser'


def test_me_missing_profile(client, dummy_db, monkeypatch):
    # Remove any existing profile for uid used by fake verify
    dummy_db.users.clear()
    r = client.get('/auth/me', headers={'Authorization': 'Bearer id_abc'})
    assert r.status_code == 404
