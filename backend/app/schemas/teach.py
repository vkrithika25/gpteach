from pydantic import BaseModel

from app.schemas.common import GuidanceLevel, StudentUnderstandingLevel


class ContextMessage(BaseModel):
    role: str  # "student" or "assistant"
    content: str


class TeachRequest(BaseModel):
    session_id: str
    student_message: str
    recent_context: list[ContextMessage] = []
    student_understanding: StudentUnderstandingLevel = StudentUnderstandingLevel.unknown
    want_hint_only: bool = False


class TeachResponse(BaseModel):
    assistant_message: str
    guidance_level: GuidanceLevel
    follow_up_questions: list[str] = []
    should_ask_student_to_explain: bool = False
