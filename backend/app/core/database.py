from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_sqlite_schema() -> None:
    """
    Minimal, safe schema migration helper for SQLite.

    This project uses Base.metadata.create_all(), which does not add columns to
    existing tables. For local dev, we add new columns when missing.
    """
    if "sqlite" not in settings.database_url:
        return

    with engine.begin() as conn:
        # Check if sessions table exists.
        row = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'")
        ).fetchone()
        if not row:
            return

        cols = conn.execute(text("PRAGMA table_info(sessions)")).fetchall()
        existing = {c[1] for c in cols}  # 2nd field is name

        alters: list[str] = []
        if "student_understanding" not in existing:
            alters.append("ALTER TABLE sessions ADD COLUMN student_understanding VARCHAR DEFAULT 'unknown'")
        if "student_profile_json" not in existing:
            alters.append("ALTER TABLE sessions ADD COLUMN student_profile_json TEXT DEFAULT '{}'")

        for stmt in alters:
            conn.execute(text(stmt))
