from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.utils.ids import generate_id
from app.utils.time import utcnow


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_id)
    user_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    project_spec_text: Mapped[str] = mapped_column(Text, nullable=False)
    course_context: Mapped[str | None] = mapped_column(String, nullable=True)
    assignment_name: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="active")
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[str] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
