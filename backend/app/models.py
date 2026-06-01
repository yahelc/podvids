from sqlalchemy import Column, Integer, String, DateTime, func
from .database import Base


class Clip(Base):
    __tablename__ = "clips"

    id = Column(Integer, primary_key=True, autoincrement=True)
    external_id = Column(String, unique=True, nullable=False)
    account = Column(String, nullable=False)
    recorded_at = Column(DateTime, nullable=False)
    video_url = Column(String, nullable=False)
    thumb_url = Column(String)
    title = Column(String)
    rating = Column(Integer)
    start_offset = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
