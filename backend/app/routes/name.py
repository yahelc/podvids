from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db, SessionLocal
from ..models import Clip
from ..config import settings
import httpx

router = APIRouter(tags=["name"])

INFERENCE_URL = "https://inference.do-ai.run/v1/chat/completions"
MODEL = "openai-gpt-4o"
PROMPT = (
    "This is a thumbnail from a 26-second table tennis rally clip. "
    "Generate a fun, specific title of up to 10 words — "
    "referencing the shot type, player position, score situation, or anything visible. "
    "Be creative and specific. "
    "Reply with only the title, no quotes, no punctuation at the end."
)


def _call_inference(image_url: str) -> str:
    resp = httpx.post(
        INFERENCE_URL,
        headers={"Authorization": f"Bearer {settings.do_inference_api_key}"},
        json={
            "model": MODEL,
            "max_tokens": 48,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": image_url}},
                        {"type": "text", "text": PROMPT},
                    ],
                }
            ],
        },
        timeout=60,
    )
    if resp.status_code != 200:
        print(f"Inference API error: model={MODEL} status={resp.status_code} body={resp.text[:500]}")
        resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"].strip()


def name_untitled_clips():
    """Background job: auto-name any clips missing a title."""
    if not settings.do_inference_api_key:
        return
    db = SessionLocal()
    try:
        untitled = db.query(Clip).filter(Clip.title == None).all()
        print(f"Auto-namer: {len(untitled)} untitled clips to process")
        for clip in untitled:
            try:
                image_url = clip.thumb_url or clip.video_url
                name = _call_inference(image_url)
                clip.title = name
                db.commit()
                print(f"  Named clip {clip.id}: {name}")
            except Exception as e:
                print(f"  Failed to name clip {clip.id}: {e}")
    finally:
        db.close()


@router.get("/api/debug/models")
def list_models():
    if not settings.do_inference_api_key:
        raise HTTPException(status_code=503, detail="DO_INFERENCE_API_KEY not configured")
    resp = httpx.get(
        "https://inference.do-ai.run/v1/models",
        headers={"Authorization": f"Bearer {settings.do_inference_api_key}"},
        timeout=15,
    )
    return resp.json()


@router.post("/api/clips/{clip_id}/name")
def suggest_name(clip_id: int, db: Session = Depends(get_db)):
    if not settings.do_inference_api_key:
        raise HTTPException(status_code=503, detail="DO_INFERENCE_API_KEY not configured")

    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    name = _call_inference(clip.thumb_url or clip.video_url)
    return {"name": name}
