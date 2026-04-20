from fastapi import APIRouter, HTTPException
from openai import OpenAIError

from app.core.logging import logger
from app.schemas.timeline import GenerateTimelineRequest, GenerateTimelineResponse
from app.services import openai_service

router = APIRouter(prefix="/timeline", tags=["timeline"])


@router.post("/generate", response_model=GenerateTimelineResponse)
def generate_timeline(body: GenerateTimelineRequest):
    try:
        tasks = openai_service.generate_timeline_from_spec(body.spec_text)
        return GenerateTimelineResponse(tasks=tasks)
    except OpenAIError as e:
        logger.error("OpenAI API error (timeline generate): %s", e)
        raise HTTPException(
            status_code=502,
            detail={"code": "openai_error", "message": "Failed to generate timeline. Please try again."},
        )
