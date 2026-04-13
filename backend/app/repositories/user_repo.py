from sqlalchemy.orm import Session

from app.models.user import User


def get_or_create_user(
    db: Session,
    external_user_id: str | None,
    display_name: str | None,
) -> User | None:
    if not external_user_id:
        return None

    user = db.query(User).filter(User.external_user_id == external_user_id).first()
    if user:
        if display_name and user.display_name != display_name:
            user.display_name = display_name
            db.commit()
            db.refresh(user)
        return user

    user = User(external_user_id=external_user_id, display_name=display_name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
