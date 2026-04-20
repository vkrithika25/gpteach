from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import SessionStatus


class SessionCreate(BaseModel):
    external_user_id: str | None = None
    display_name: str | None = None
    title: str | None = None
    assignment_name: str | None = None
    course_context: str | None = None
    project_spec_text: str


class SessionUpdate(BaseModel):
    title: str | None = None
    status: SessionStatus | None = None


class SessionResponse(BaseModel):
    id: str
    user_id: str | None
    title: str | None
    assignment_name: str | None
    course_context: str | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
