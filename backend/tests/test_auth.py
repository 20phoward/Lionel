def test_register_first_user_becomes_admin(client):
    response = client.post("/api/auth/register", json={
        "email": "first@test.com",
        "password": "password123",
        "name": "First User",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "first@test.com"
    assert data["role"] == "admin"


def test_register_duplicate_email(client, admin_user):
    response = client.post("/api/auth/register", json={
        "email": "admin@test.com",
        "password": "password123",
        "name": "Duplicate",
    })
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


def test_login_success(client, admin_user):
    response = client.post("/api/auth/login", json={
        "email": "admin@test.com",
        "password": "admin123",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, admin_user):
    response = client.post("/api/auth/login", json={
        "email": "admin@test.com",
        "password": "wrong",
    })
    assert response.status_code == 401


def test_refresh_token(client, admin_user):
    login_resp = client.post("/api/auth/login", json={
        "email": "admin@test.com",
        "password": "admin123",
    })
    refresh_token = login_resp.json()["refresh_token"]

    response = client.post("/api/auth/refresh", json={
        "refresh_token": refresh_token,
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
