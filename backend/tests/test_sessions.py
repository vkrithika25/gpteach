import pytest


@pytest.fixture()
def sample_session_payload():
    return {
        "project_spec_text": "Build a distributed key-value store supporting eventual consistency.",
        "assignment_name": "Distributed KV Store",
        "course_context": "Upper-level distributed systems",
        "title": "Project 2 help",
    }


def test_create_session(client, sample_session_payload):
    resp = client.post("/api/v1/sessions", json=sample_session_payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Project 2 help"
    assert data["assignment_name"] == "Distributed KV Store"
    assert data["status"] == "active"
    assert data["id"]


def test_create_session_generates_title(client):
    resp = client.post("/api/v1/sessions", json={
        "project_spec_text": "Some spec",
        "assignment_name": "My Assignment",
    })
    assert resp.status_code == 201
    assert "My Assignment" in resp.json()["title"]


def test_create_session_with_user(client, sample_session_payload):
    sample_session_payload["external_user_id"] = "user-abc"
    sample_session_payload["display_name"] = "Alice"
    resp = client.post("/api/v1/sessions", json=sample_session_payload)
    assert resp.status_code == 201
    assert resp.json()["user_id"] is not None


def test_get_session(client, sample_session_payload):
    create_resp = client.post("/api/v1/sessions", json=sample_session_payload)
    session_id = create_resp.json()["id"]

    resp = client.get(f"/api/v1/sessions/{session_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == session_id


def test_get_session_not_found(client):
    resp = client.get("/api/v1/sessions/nonexistent-id")
    assert resp.status_code == 404


def test_update_session(client, sample_session_payload):
    create_resp = client.post("/api/v1/sessions", json=sample_session_payload)
    session_id = create_resp.json()["id"]

    resp = client.patch(f"/api/v1/sessions/{session_id}", json={"title": "New title"})
    assert resp.status_code == 200
    assert resp.json()["title"] == "New title"


def test_create_session_missing_spec(client):
    resp = client.post("/api/v1/sessions", json={"title": "No spec"})
    assert resp.status_code == 422
