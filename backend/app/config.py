from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./podvids.db"
    pingpod_email_1: str = ""
    pingpod_password_1: str = ""
    pingpod_email_2: str = ""
    pingpod_password_2: str = ""
    do_inference_token: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
