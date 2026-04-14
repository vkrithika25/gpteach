from pydantic import BaseModel, Field


class TimelineTask(BaseModel):
    title: str
    date: str = Field(
        ...,
        description='A human-readable date or milestone label (e.g. "Apr 19, 2026" or "Week 2").',
    )


class GenerateTimelineRequest(BaseModel):
    spec_text: str


class GenerateTimelineResponse(BaseModel):
    tasks: list[TimelineTask]
