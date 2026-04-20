from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession

from app.core.database import get_db
from app.repositories import session_repo, user_repo
from app.schemas.session import SessionCreate, SessionResponse, SessionUpdate

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=SessionResponse, status_code=201)
def create_session(body: SessionCreate, db: DBSession = Depends(get_db)):
    user = user_repo.get_or_create_user(
        db,
        external_user_id=body.external_user_id,
        display_name=body.display_name,
    )

    title = body.title
    if not title and body.assignment_name:
        title = f"{body.assignment_name} — GpTeach Session"

    session = session_repo.create_session(
        db,
        user_id=user.id if user else None,
        title=title,
        assignment_name=body.assignment_name,
        course_context=body.course_context,
        project_spec_text=body.project_spec_text,
    )
    return session


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: str, db: DBSession = Depends(get_db)):
    session = session_repo.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail={
            "code": "session_not_found",
            "message": f"No session exists for id {session_id}",
        })
    return session


@router.patch("/{session_id}", response_model=SessionResponse)
def update_session(session_id: str, body: SessionUpdate, db: DBSession = Depends(get_db)):
    session = session_repo.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail={
            "code": "session_not_found",
            "message": f"No session exists for id {session_id}",
        })
    return session_repo.update_session(
        db,
        session,
        title=body.title,
        status=body.status.value if body.status else None,
    )
