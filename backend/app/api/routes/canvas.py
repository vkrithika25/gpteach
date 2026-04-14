from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAIError
from sqlalchemy.orm import Session as DBSession

from app.core.database import get_db
from app.core.logging import logger
from app.repositories import session_repo
from app.schemas.canvas import CanvasFeedbackRequest, CanvasFeedbackResponse
from app.services import openai_service

router = APIRouter(prefix="/canvas", tags=["canvas"])


@router.post("/feedback", response_model=CanvasFeedbackResponse)
def canvas_feedback(body: CanvasFeedbackRequest, db: DBSession = Depends(get_db)):
    session = session_repo.get_session(db, body.session_id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail={"code": "session_not_found", "message": f"No session exists for id {body.session_id}"},
        )

    if session.status != "active":
        raise HTTPException(
            status_code=400,
            detail={"code": "session_not_active", "message": "This session is archived."},
        )

    try:
        feedback_md = openai_service.generate_canvas_feedback(
            session=session,
            image_data_url=body.image_data_url,
            student_prompt=body.prompt,
        )
        return CanvasFeedbackResponse(feedback_markdown=feedback_md)
    except OpenAIError as e:
        logger.error("OpenAI API error (canvas feedback): %s", e)
        raise HTTPException(
            status_code=502,
            detail={"code": "openai_error", "message": "Failed to get feedback from the AI service. Please try again."},
        )
