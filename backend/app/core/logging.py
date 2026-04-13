import logging
import sys

from app.core.config import settings


def setup_logging() -> logging.Logger:
    level = logging.DEBUG if settings.app_env == "development" else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        stream=sys.stdout,
    )
    return logging.getLogger("gpteach")


logger = setup_logging()
