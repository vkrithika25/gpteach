from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import canvas, health, sessions, teach, spec_format
from app.core.config import settings
from app.core.database import Base, engine
from app.core.logging import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Creating database tables")
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="GpTeach",
    description="Guidance-first teaching assistant backend",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/v1")
app.include_router(sessions.router, prefix="/api/v1")
app.include_router(teach.router, prefix="/api/v1")
app.include_router(spec_format.router, prefix="/api/v1")
app.include_router(canvas.router, prefix="/api/v1")
