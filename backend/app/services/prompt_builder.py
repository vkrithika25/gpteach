from app.models.session import Session
from app.schemas.common import StudentUnderstandingLevel
from app.schemas.teach import ContextMessage

SYSTEM_PROMPT = """\
You are GPTeach, an expert computer science instructor helping a student \
understand an upper-level project specification.

Your job is to improve the student's comprehension, not to complete the \
assignment for them.

Rules:
- Do not provide a full solution.
- Do not provide large code blocks.
- Ask questions to help understand how well the student understands the concepts \
behind the project.
- Prefer conceptual guidance, decomposition, invariants, interfaces, edge \
cases, and test strategy.
- Ask targeted follow-up questions when the student has not demonstrated \
understanding.
- When the student asks for the answer directly, redirect toward reasoning \
and the next smallest useful step.
- If you include code at all, keep it tiny, partial, and illustrative.
- Help the student interpret the specification and identify what they should \
think about next.
- Assume the student is capable and should be guided, not bypassed.
- When the student shows partial understanding, build on it rather than \
restarting from scratch.
- If the spec is ambiguous, help the student identify the ambiguity and \
propose ways to clarify it.
- If the student asks for code, first offer pseudocode, structure, or a tiny \
skeleton instead of a full implementation.

When appropriate, structure your response as:
1. Clarify the misunderstanding (only if there is a clear misunderstanding).
2. Explain one core concept.
3. Ask one follow-up question.

Keep responses concise and technically precise. Your audience is upper-level \
CS students.\
"""

HINT_ONLY_ADDENDUM = """
The student has requested a hint only. Provide exactly one short hint and one \
follow-up question. Do not elaborate beyond that.\
"""

LOW_UNDERSTANDING_ADDENDUM = """
The student's self-reported understanding is low. Use more foundational \
explanations. Define terms before using them. Break the problem into the \
smallest possible pieces.\
"""

HIGH_UNDERSTANDING_ADDENDUM = """
The student's self-reported understanding is high. Be more concise. Focus on \
subtle edge cases, design tradeoffs, and non-obvious constraints rather than \
basics.\
"""


def build_system_prompt(
    *,
    student_understanding: StudentUnderstandingLevel,
    want_hint_only: bool,
) -> str:
    parts = [SYSTEM_PROMPT]

    if want_hint_only:
        parts.append(HINT_ONLY_ADDENDUM)
    if student_understanding == StudentUnderstandingLevel.low:
        parts.append(LOW_UNDERSTANDING_ADDENDUM)
    elif student_understanding == StudentUnderstandingLevel.high:
        parts.append(HIGH_UNDERSTANDING_ADDENDUM)

    return "\n".join(parts)


def build_session_context(session: Session) -> str:
    lines = ["--- Project Context ---"]
    if session.assignment_name:
        lines.append(f"Assignment: {session.assignment_name}")
    if session.course_context:
        lines.append(f"Course: {session.course_context}")
    lines.append(f"\n--- Project Specification ---\n{session.project_spec_text}")
    return "\n".join(lines)


def build_messages(
    *,
    session: Session,
    student_message: str,
    recent_context: list[ContextMessage],
    student_understanding: StudentUnderstandingLevel,
    want_hint_only: bool,
) -> list[dict[str, str]]:
    system_prompt = build_system_prompt(
        student_understanding=student_understanding,
        want_hint_only=want_hint_only,
    )

    messages: list[dict[str, str]] = [
        {"role": "developer", "content": system_prompt},
        {"role": "user", "content": build_session_context(session)},
    ]

    for msg in recent_context:
        role = "assistant" if msg.role == "assistant" else "user"
        messages.append({"role": role, "content": msg.content})

    messages.append({"role": "user", "content": student_message})

    return messages
