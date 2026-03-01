def test_create_issue(client, admin_headers):
    response = client.post("/api/issues", json={
        "title": "SOX Compliance Finding",
        "description": "Access controls need remediation",
        "priority": "high",
    }, headers=admin_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "SOX Compliance Finding"
    assert data["priority"] == "high"
    assert data["status"] == "open"


def test_create_issue_non_admin_forbidden(client, member_headers):
    response = client.post("/api/issues", json={
        "title": "Test Issue",
    }, headers=member_headers)
    assert response.status_code == 403


def test_list_issues(client, admin_headers):
    client.post("/api/issues", json={"title": "Issue 1"}, headers=admin_headers)
    client.post("/api/issues", json={"title": "Issue 2"}, headers=admin_headers)
    response = client.get("/api/issues", headers=admin_headers)
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_list_issues_filter_by_priority(client, admin_headers):
    client.post("/api/issues", json={"title": "Critical", "priority": "critical"}, headers=admin_headers)
    client.post("/api/issues", json={"title": "Low", "priority": "low"}, headers=admin_headers)
    response = client.get("/api/issues?priority=critical", headers=admin_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["priority"] == "critical"


def test_get_issue(client, admin_headers):
    create_resp = client.post("/api/issues", json={"title": "Test Issue"}, headers=admin_headers)
    issue_id = create_resp.json()["id"]
    response = client.get(f"/api/issues/{issue_id}", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["title"] == "Test Issue"


def test_update_issue(client, admin_headers):
    create_resp = client.post("/api/issues", json={"title": "Test Issue"}, headers=admin_headers)
    issue_id = create_resp.json()["id"]
    response = client.put(f"/api/issues/{issue_id}", json={"status": "in_progress"}, headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "in_progress"


def test_delete_issue(client, admin_headers):
    create_resp = client.post("/api/issues", json={"title": "Test Issue"}, headers=admin_headers)
    issue_id = create_resp.json()["id"]
    response = client.delete(f"/api/issues/{issue_id}", headers=admin_headers)
    assert response.status_code == 204


def test_get_stats(client, admin_headers):
    client.post("/api/issues", json={"title": "Issue 1", "priority": "critical"}, headers=admin_headers)
    client.post("/api/issues", json={"title": "Issue 2", "priority": "low"}, headers=admin_headers)
    response = client.get("/api/issues/stats", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_issues"] == 2
    assert data["open_issues"] == 2
    assert data["critical_issues"] == 1
