from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAIError
from sqlalchemy.orm import Session as DBSession

from app.core.database import get_db
from app.core.logging import logger
from app.repositories import session_repo
from app.schemas.teach import TeachRequest, TeachResponse
from app.services import openai_service

router = APIRouter(prefix="/teach", tags=["teach"])


@router.post("/respond", response_model=TeachResponse)
def teach_respond(body: TeachRequest, db: DBSession = Depends(get_db)):
    session = session_repo.get_session(db, body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail={
            "code": "session_not_found",
            "message": f"No session exists for id {body.session_id}",
        })

    if session.status != "active":
        raise HTTPException(status_code=400, detail={
            "code": "session_not_active",
            "message": "This session is archived.",
        })

    try:
        # Option A: update persistent student model (best-effort) before responding.
        try:
            profile = openai_service.update_student_profile_from_message(
                session=session,
                student_message=body.student_message,
                recent_context=body.recent_context,
            )
            session = session_repo.update_student_model(
                db,
                session,
                student_understanding=profile.understanding.value,
                student_profile_json=profile.model_dump_json(),
            )
            effective_understanding = profile.understanding
        except OpenAIError as e:
            logger.warning("OpenAI student-profile update failed, continuing: %s", e)
            effective_understanding = body.student_understanding

        return openai_service.generate_teaching_response(
            session=session,
            student_message=body.student_message,
            recent_context=body.recent_context,
            student_understanding=effective_understanding,
            want_hint_only=body.want_hint_only,
        )
    except OpenAIError as e:
        logger.error("OpenAI API error: %s", e)
        raise HTTPException(status_code=502, detail={
            "code": "openai_error",
            "message": "Failed to get a response from the AI service. Please try again.",
        })
