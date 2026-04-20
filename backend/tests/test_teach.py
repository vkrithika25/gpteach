import pytest


@pytest.fixture()
def session_id(client):
    resp = client.post("/api/v1/sessions", json={
        "project_spec_text": "Build a distributed key-value store with eventual consistency.",
        "assignment_name": "Distributed KV Store",
        "course_context": "Distributed Systems",
    })
    return resp.json()["id"]


def test_teach_respond(client, mock_openai, session_id):
    resp = client.post("/api/v1/teach/respond", json={
        "session_id": session_id,
        "student_message": "I don't understand eventual consistency.",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "assistant_message" in data
    assert data["guidance_level"] in ["hint", "scaffold", "conceptual", "boundary"]
    assert isinstance(data["follow_up_questions"], list)


def test_teach_respond_hint_only(client, mock_openai, session_id):
    resp = client.post("/api/v1/teach/respond", json={
        "session_id": session_id,
        "student_message": "Give me a hint about replication.",
        "want_hint_only": True,
    })
    assert resp.status_code == 200
    assert resp.json()["guidance_level"] == "hint"


def test_teach_respond_with_context(client, mock_openai, session_id):
    resp = client.post("/api/v1/teach/respond", json={
        "session_id": session_id,
        "student_message": "What about write conflicts?",
        "recent_context": [
            {"role": "student", "content": "I think replicas can respond independently?"},
            {"role": "assistant", "content": "What tradeoff appears when replicas diverge?"},
        ],
        "student_understanding": "medium",
    })
    assert resp.status_code == 200


def test_teach_respond_session_not_found(client, mock_openai):
    resp = client.post("/api/v1/teach/respond", json={
        "session_id": "nonexistent",
        "student_message": "hello",
    })
    assert resp.status_code == 404


def test_teach_respond_missing_message(client, session_id):
    resp = client.post("/api/v1/teach/respond", json={
        "session_id": session_id,
    })
    assert resp.status_code == 422
