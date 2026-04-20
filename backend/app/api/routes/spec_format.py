from fastapi import APIRouter, HTTPException
from openai import OpenAIError

from app.core.logging import logger
from app.schemas.spec_format import SpecFormatRequest, SpecFormatResponse
from app.services import openai_service

router = APIRouter(prefix="/spec", tags=["spec"])


@router.post("/format-markdown", response_model=SpecFormatResponse)
def format_spec_markdown(body: SpecFormatRequest):
    try:
        md, preserved = openai_service.format_spec_to_markdown(body.text)
        return SpecFormatResponse(markdown=md, preserved=preserved)
    except OpenAIError as e:
        logger.error("OpenAI API error (format spec): %s", e)
        raise HTTPException(
            status_code=502,
            detail={
                "code": "openai_error",
                "message": "Failed to format the spec. Please try again.",
            },
        )
