from pydantic import BaseModel, Field


class SpecFormatRequest(BaseModel):
    text: str = Field(..., description="Raw spec text extracted from upload (verbatim).")


class SpecFormatResponse(BaseModel):
    markdown: str
    preserved: bool = Field(
        ..., description="Whether a best-effort check indicates words were preserved."
    )
