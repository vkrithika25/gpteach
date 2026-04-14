from openai import OpenAI

from app.core.config import settings
from app.core.logging import logger
from app.models.session import Session
from app.schemas.common import StudentUnderstandingLevel
from app.schemas.teach import ContextMessage, TeachResponse
from app.services.prompt_builder import build_messages
from app.services.teaching_guardrails import classify_guidance_level, should_ask_to_explain

_client: OpenAI | None = None


def _normalize_whitespace(s: str) -> str:
    return " ".join(s.replace("\r\n", "\n").replace("\r", "\n").split())


def _markdown_to_visible_text(md: str) -> str:
    """
    Best-effort "visible text" extraction to detect paraphrasing.
    We purposely bias prompts so links use URL-as-text: [URL](URL),
    which preserves raw URLs in visible text.
    """
    import re

    s = md

    # Remove fenced code block markers but keep content.
    s = re.sub(r"^```[^\n]*\n", "", s, flags=re.MULTILINE)
    s = re.sub(r"^```\s*$", "", s, flags=re.MULTILINE)

    # Inline code: keep content.
    s = re.sub(r"`([^`]+)`", r"\1", s)

    # Images: keep alt text if present.
    s = re.sub(r"!\[([^\]]*)\]\([^)]+\)", r"\1", s)

    # Links: keep the bracket text.
    s = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", s)

    # Strip common emphasis markers.
    s = s.replace("**", "").replace("__", "").replace("*", "").replace("_", "")

    # Strip headings/blockquote markers at line start.
    s = re.sub(r"^\s{0,3}#{1,6}\s+", "", s, flags=re.MULTILINE)
    s = re.sub(r"^\s{0,3}>\s?", "", s, flags=re.MULTILINE)

    # Strip list markers at line start.
    s = re.sub(r"^\s*[-+*]\s+", "", s, flags=re.MULTILINE)
    s = re.sub(r"^\s*\d+\.\s+", "", s, flags=re.MULTILINE)

    return s


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


def format_spec_to_markdown(text: str) -> tuple[str, bool]:
    """
    Format spec text into readable Markdown WITHOUT changing words.
    Returns (markdown, preserved) where preserved is a best-effort check.
    """
    client = get_client()

    instructions = (
        "You are a formatting tool. Convert the provided spec text into Markdown.\n"
        "CRITICAL CONSTRAINTS:\n"
        "- Do NOT change, add, remove, or reorder words or characters from the spec.\n"
        "- You may ONLY insert Markdown syntax and whitespace/newlines for formatting.\n"
        "- Preserve all URLs exactly; if you make a link, use the URL as the link text: [URL](URL).\n"
        "- Preserve code exactly; use fenced code blocks when appropriate.\n"
        "- Output ONLY the Markdown. No preface.\n"
    )

    response = client.responses.create(
        model=settings.openai_model,
        input=[
            {"role": "system", "content": instructions},
            {"role": "user", "content": text},
        ],
        temperature=0.0,
        store=False,
    )

    md = response.output_text or ""

    # Best-effort preservation check: compare normalized visible text.
    original_norm = _normalize_whitespace(text)
    md_visible_norm = _normalize_whitespace(_markdown_to_visible_text(md))
    preserved = original_norm == md_visible_norm

    # If not preserved, fall back to original (still viewable; no paraphrasing risk).
    if not preserved:
        md = text

    return md, preserved


def generate_canvas_feedback(*, session: Session, image_data_url: str, student_prompt: str | None) -> str:
    """
    Provide feedback on a student's flow diagram (image) in Markdown.
    """
    client = get_client()

    prompt = (
        "You are a teaching assistant. Give feedback on the student's flow diagram.\n"
        "Constraints:\n"
        "- Be constructive and specific.\n"
        "- Do not provide full solutions or full code; focus on improving clarity/correctness.\n"
        "- If parts are unreadable, say what you cannot infer.\n"
        "- Output Markdown with short sections and bullet points.\n"
    )

    if student_prompt:
        prompt += f"\nStudent question/context:\n{student_prompt.strip()}\n"

    # Provide spec context to align feedback with assignment terms.
    prompt += "\nProject spec context (verbatim):\n" + session.project_spec_text

    response = client.responses.create(
        model=settings.openai_model,
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": prompt},
                    {"type": "input_image", "image_url": image_data_url},
                ],
            }
        ],
        temperature=0.3,
        store=False,
    )

    return response.output_text or ""


def generate_timeline_from_spec(spec_text: str):
    """
    Generate a concise set of timeline tasks based on a project spec.
    """
    import json

    client = get_client()

    instructions = (
        "You generate a project timeline from a project specification.\n"
        "Return ONLY valid JSON with this exact shape:\n"
        '{ "tasks": [ { "title": string, "date": string } ] }\n'
        "\nRules:\n"
        "- Do NOT invent requirements not in the spec.\n"
        "- Prefer concrete milestones from the spec (parts, deliverables, checkpoints).\n"
        "- If the spec contains explicit due dates, use them.\n"
        "- If no due dates are present, use milestone labels like 'Week 1', 'Week 2', ...\n"
        "- Produce 5–10 tasks.\n"
        "- Titles should be short and actionable.\n"
    )

    response = client.responses.create(
        model=settings.openai_model,
        input=[
            {"role": "system", "content": instructions},
            {"role": "user", "content": spec_text},
        ],
        temperature=0.2,
        store=False,
    )

    raw = (response.output_text or "").strip()
    data = json.loads(raw)
    tasks = data.get("tasks", [])

    # Validate minimal shape.
    cleaned = []
    for t in tasks:
        title = str(t.get("title", "")).strip()
        date = str(t.get("date", "")).strip()
        if title and date:
            cleaned.append({"title": title, "date": date})

    return cleaned[:10]
