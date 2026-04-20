from collections.abc import Generator
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base, get_db
from app.main import app
from app.services import openai_service

TEST_DATABASE_URL = "sqlite:///./test_gpteach.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def override_get_db() -> Generator[Session, None, None]:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client():
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def mock_openai():
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.output_text = (
        "Let's think about what eventual consistency means here.\n\n"
        "When a write succeeds on one replica, other replicas may not "
        "reflect that write immediately.\n\n"
        "What do you think happens when a client reads from a replica "
        "that hasn't received the update yet?\n\n"
        "Can you identify which guarantee the spec is asking you to provide?"
    )
    mock_client.responses.create.return_value = mock_response
    openai_service.set_client(mock_client)
    yield mock_client
    openai_service.set_client(None)
