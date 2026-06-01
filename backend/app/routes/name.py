from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Clip
from ..config import settings
import httpx

router = APIRouter(prefix="/api/clips", tags=["name"])

INFERENCE_URL = "https://inference.do-ai.run/v1/chat/completions"
MODEL = "kimi-k2.6"
PROMPT = (
    "This is a short table tennis clip, approximately 26 seconds long. "
    "Watch the clip and generate a fun, specific title of 5 words or fewer "
    "that captures what happens — ideally referencing the shot type, outcome, "
    "or anything memorable. Reply with only the title, no quotes, no punctuation at the end."
)


@router.post("/{clip_id}/name")
def suggest_name(clip_id: int, db: Session = Depends(get_db)):
    if not settings.do_inference_token:
        raise HTTPException(status_code=503, detail="DO_INFERENCE_TOKEN not configured")

    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    resp = httpx.post(
        INFERENCE_URL,
        headers={"Authorization": f"Bearer {settings.do_inference_token}"},
        json={
            "model": MODEL,
            "max_tokens": 32,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "video_url",
                            "video_url": {"url": clip.video_url},
                        },
                        {
                            "type": "text",
                            "text": PROMPT,
                        },
                    ],
                }
            ],
        },
        timeout=30,
    )

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Inference API error: {resp.text[:200]}")

    name = resp.json()["choices"][0]["message"]["content"].strip()
    return {"name": name}
