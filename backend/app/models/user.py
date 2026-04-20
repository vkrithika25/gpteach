from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.utils.ids import generate_id
from app.utils.time import utcnow


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_id)
    external_user_id: Mapped[str | None] = mapped_column(String, nullable=True, unique=True)
    display_name: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), default=utcnow)
