from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, nullslast
from typing import List
from ..database import get_db
from ..models import Clip
from ..schemas import ClipOut, ClipPatch

router = APIRouter(prefix="/api/clips", tags=["clips"])


@router.get("", response_model=List[ClipOut])
def list_clips(sort: str = "date", db: Session = Depends(get_db)):
    q = db.query(Clip)
    if sort == "rating":
        q = q.order_by(nullslast(desc(Clip.rating)), desc(Clip.recorded_at))
    else:
        q = q.order_by(desc(Clip.recorded_at))
    return q.all()


@router.get("/{clip_id}", response_model=ClipOut)
def get_clip(clip_id: int, db: Session = Depends(get_db)):
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")
    return clip


@router.patch("/{clip_id}", response_model=ClipOut)
def update_clip(clip_id: int, patch: ClipPatch, db: Session = Depends(get_db)):
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")
    if patch.title is not None:
        clip.title = patch.title
    if patch.rating is not None:
        if not 1 <= patch.rating <= 5:
            raise HTTPException(status_code=400, detail="Rating must be 1-5")
        clip.rating = patch.rating
    if patch.start_offset is not None:
        clip.start_offset = max(0, patch.start_offset)
    db.commit()
    db.refresh(clip)
    return clip
