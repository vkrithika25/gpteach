import re

from app.schemas.common import GuidanceLevel, StudentUnderstandingLevel

_SOLUTION_PATTERNS = [
    re.compile(r"\bgive me the (full |complete )?code\b", re.IGNORECASE),
    re.compile(r"\bwrite (the |my )?(full |entire |complete )?solution\b", re.IGNORECASE),
    re.compile(r"\bjust solve it\b", re.IGNORECASE),
    re.compile(r"\bdo (the |my )?assignment\b", re.IGNORECASE),
]


def is_requesting_full_solution(student_message: str) -> bool:
    return any(p.search(student_message) for p in _SOLUTION_PATTERNS)


def classify_guidance_level(
    *,
    want_hint_only: bool,
    student_understanding: StudentUnderstandingLevel,
    student_message: str,
) -> GuidanceLevel:
    if want_hint_only:
        return GuidanceLevel.hint
    if is_requesting_full_solution(student_message):
        return GuidanceLevel.boundary
    if student_understanding == StudentUnderstandingLevel.low:
        return GuidanceLevel.scaffold
    return GuidanceLevel.conceptual


def should_ask_to_explain(
    *,
    student_understanding: StudentUnderstandingLevel,
    student_message: str,
) -> bool:
    if student_understanding in (
        StudentUnderstandingLevel.low,
        StudentUnderstandingLevel.unknown,
    ):
        return True
    if len(student_message.split()) < 15:
        return True
    return False
