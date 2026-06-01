from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./podvids.db"
    pingpod_bearer_token_1: str = ""
    pingpod_bearer_token_2: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
