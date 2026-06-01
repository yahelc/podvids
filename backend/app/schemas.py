from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ClipOut(BaseModel):
    id: int
    external_id: str
    account: str
    recorded_at: datetime
    video_url: str
    thumb_url: Optional[str]
    title: Optional[str]
    rating: Optional[int]
    start_offset: Optional[int] = 0
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class ClipPatch(BaseModel):
    title: Optional[str] = None
    rating: Optional[int] = None
    start_offset: Optional[int] = None
