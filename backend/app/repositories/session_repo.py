from sqlalchemy.orm import Session as DBSession

from app.models.session import Session
from app.utils.time import utcnow


def create_session(
    db: DBSession,
    *,
    user_id: str | None,
    title: str | None,
    assignment_name: str | None,
    course_context: str | None,
    project_spec_text: str,
) -> Session:
    session = Session(
        user_id=user_id,
        title=title,
        assignment_name=assignment_name,
        course_context=course_context,
        project_spec_text=project_spec_text,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_session(db: DBSession, session_id: str) -> Session | None:
    return db.query(Session).filter(Session.id == session_id).first()


def update_session(
    db: DBSession,
    session: Session,
    *,
    title: str | None = None,
    status: str | None = None,
) -> Session:
    if title is not None:
        session.title = title
    if status is not None:
        session.status = status
    session.updated_at = utcnow()
    db.commit()
    db.refresh(session)
    return session


def update_student_model(
    db: DBSession,
    session: Session,
    *,
    student_understanding: str | None = None,
    student_profile_json: str | None = None,
) -> Session:
    if student_understanding is not None:
        session.student_understanding = student_understanding
    if student_profile_json is not None:
        session.student_profile_json = student_profile_json
    session.updated_at = utcnow()
    db.commit()
    db.refresh(session)
    return session
