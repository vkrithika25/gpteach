from pydantic import BaseModel, Field


class CanvasFeedbackRequest(BaseModel):
    session_id: str
    image_data_url: str = Field(
        ...,
        description="Canvas snapshot as a data URL, e.g. data:image/png;base64,...",
    )
    prompt: str | None = Field(
        default=None,
        description="Optional extra context/question from the student about the diagram.",
    )


class CanvasFeedbackResponse(BaseModel):
    feedback_markdown: str
