from enum import Enum

from pydantic import BaseModel


class SessionStatus(str, Enum):
    active = "active"
    archived = "archived"


class StudentUnderstandingLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    unknown = "unknown"


class GuidanceLevel(str, Enum):
    hint = "hint"
    scaffold = "scaffold"
    conceptual = "conceptual"
    boundary = "boundary"


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorDetail
