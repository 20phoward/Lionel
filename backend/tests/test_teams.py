def test_create_team(client, admin_headers):
    response = client.post("/api/teams", json={"name": "Legal", "description": "Legal department"}, headers=admin_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Legal"
    assert data["description"] == "Legal department"


def test_create_team_non_admin_forbidden(client, member_headers):
    response = client.post("/api/teams", json={"name": "Legal"}, headers=member_headers)
    assert response.status_code == 403


def test_create_team_duplicate_name(client, admin_headers):
    client.post("/api/teams", json={"name": "Legal"}, headers=admin_headers)
    response = client.post("/api/teams", json={"name": "Legal"}, headers=admin_headers)
    assert response.status_code == 400


def test_list_teams(client, admin_headers):
    client.post("/api/teams", json={"name": "Legal"}, headers=admin_headers)
    client.post("/api/teams", json={"name": "IT"}, headers=admin_headers)
    response = client.get("/api/teams", headers=admin_headers)
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_get_team(client, admin_headers):
    create_resp = client.post("/api/teams", json={"name": "Legal"}, headers=admin_headers)
    team_id = create_resp.json()["id"]
    response = client.get(f"/api/teams/{team_id}", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Legal"


def test_get_team_not_found(client, admin_headers):
    response = client.get("/api/teams/999", headers=admin_headers)
    assert response.status_code == 404
