def test_get_me(client, admin_headers):
    response = client.get("/api/users/me", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "admin@test.com"
    assert data["role"] == "admin"


def test_get_me_no_token(client):
    response = client.get("/api/users/me")
    assert response.status_code == 403


def test_list_users_admin(client, admin_headers, member_user):
    response = client.get("/api/users", headers=admin_headers)
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_list_users_non_admin_forbidden(client, member_headers):
    response = client.get("/api/users", headers=member_headers)
    assert response.status_code == 403
