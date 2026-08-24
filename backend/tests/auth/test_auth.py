def test_register_and_login(auth_client):
    r = auth_client.post("/api/v1/auth/register", json={"email": "a@x.com", "password": "password123", "role": "VIEWER"})
    assert r.status_code == 201
    body = r.json()["data"]
    assert body["email"] == "a@x.com"
    assert "password" not in body
    assert "password_hash" not in body

    r = auth_client.post("/api/v1/auth/login", json={"email": "a@x.com", "password": "password123"})
    assert r.status_code == 200
    tokens = r.json()["data"]
    assert "access_token" in tokens and "refresh_token" in tokens


def test_duplicate_registration_rejected(auth_client):
    auth_client.post("/api/v1/auth/register", json={"email": "dup@x.com", "password": "password123"})
    r = auth_client.post("/api/v1/auth/register", json={"email": "dup@x.com", "password": "password123"})
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "EMAIL_TAKEN"


def test_login_wrong_password_rejected(auth_client):
    auth_client.post("/api/v1/auth/register", json={"email": "b@x.com", "password": "password123"})
    r = auth_client.post("/api/v1/auth/login", json={"email": "b@x.com", "password": "wrongpass"})
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "INVALID_CREDENTIALS"


def test_protected_route_requires_token(auth_client):
    r = auth_client.post("/api/v1/auth/logout")
    assert r.status_code == 401


def test_protected_route_with_valid_token(auth_client):
    auth_client.post("/api/v1/auth/register", json={"email": "c@x.com", "password": "password123"})
    login = auth_client.post("/api/v1/auth/login", json={"email": "c@x.com", "password": "password123"})
    token = login.json()["data"]["access_token"]
    r = auth_client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 204


def test_refresh_token_flow(auth_client):
    auth_client.post("/api/v1/auth/register", json={"email": "d@x.com", "password": "password123"})
    login = auth_client.post("/api/v1/auth/login", json={"email": "d@x.com", "password": "password123"})
    refresh_token = login.json()["data"]["refresh_token"]
    r = auth_client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert r.status_code == 200
    assert "access_token" in r.json()["data"]


def test_access_token_rejected_on_refresh_endpoint(auth_client):
    auth_client.post("/api/v1/auth/register", json={"email": "e@x.com", "password": "password123"})
    login = auth_client.post("/api/v1/auth/login", json={"email": "e@x.com", "password": "password123"})
    access_token = login.json()["data"]["access_token"]  # wrong token type on purpose
    r = auth_client.post("/api/v1/auth/refresh", json={"refresh_token": access_token})
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "INVALID_TOKEN_TYPE"


def test_invalid_token_rejected(auth_client):
    r = auth_client.post("/api/v1/auth/logout", headers={"Authorization": "Bearer garbage.token.value"})
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "INVALID_TOKEN"
