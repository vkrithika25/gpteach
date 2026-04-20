from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str = "sqlite:///./gpteach.db"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"
    cors_origins: str = "http://localhost:5173"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
