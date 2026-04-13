from openai import OpenAI

from app.core.config import settings
from app.core.logging import logger
from app.models.session import Session
from app.schemas.common import StudentUnderstandingLevel
from app.schemas.teach import ContextMessage, TeachResponse
from app.services.prompt_builder import build_messages
from app.services.teaching_guardrails import classify_guidance_level, should_ask_to_explain

_client: OpenAI | None = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=settings.openai_api_key)
    return _client


def set_client(client: OpenAI) -> None:
    """Allow injecting a client for testing."""
    global _client
    _client = client


def generate_teaching_response(
    *,
    session: Session,
    student_message: str,
    recent_context: list[ContextMessage],
    student_understanding: StudentUnderstandingLevel,
    want_hint_only: bool,
) -> TeachResponse:
    messages = build_messages(
        session=session,
        student_message=student_message,
        recent_context=recent_context,
        student_understanding=student_understanding,
        want_hint_only=want_hint_only,
    )

    guidance_level = classify_guidance_level(
        want_hint_only=want_hint_only,
        student_understanding=student_understanding,
        student_message=student_message,
    )

    ask_to_explain = should_ask_to_explain(
        student_understanding=student_understanding,
        student_message=student_message,
    )

    logger.info("Calling OpenAI model=%s guidance=%s", settings.openai_model, guidance_level.value)

    client = get_client()
    response = client.responses.create(
        model=settings.openai_model,
        input=messages,
        store=False,
        temperature=0.4,
    )

    assistant_text = response.output_text

    # Extract follow-up questions (lines ending with ?)
    follow_ups = [
        line.strip().lstrip("0123456789.-) ")
        for line in assistant_text.split("\n")
        if line.strip().endswith("?") and len(line.strip()) > 10
    ]

    return TeachResponse(
        assistant_message=assistant_text,
        guidance_level=guidance_level,
        follow_up_questions=follow_ups[:3],
        should_ask_student_to_explain=ask_to_explain,
    )
