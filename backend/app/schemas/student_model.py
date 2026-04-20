from pydantic import BaseModel, Field

from app.schemas.common import StudentUnderstandingLevel


class StudentProfile(BaseModel):
    understanding: StudentUnderstandingLevel = StudentUnderstandingLevel.unknown
    strengths: list[str] = Field(default_factory=list)
    confusions: list[str] = Field(default_factory=list)
    preferences: list[str] = Field(default_factory=list)
    summary: str = ""

