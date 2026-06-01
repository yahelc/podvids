from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Clip
from ..config import settings
import httpx

router = APIRouter(prefix="/api/clips", tags=["name"])

INFERENCE_URL = "https://inference.do-ai.run/v1/chat/completions"
MODEL = "nemotron-nano-12b-v2-vl"
PROMPT = (
    "This is a short table tennis rally clip, approximately 26 seconds long. "
    "Watch the clip and generate a fun, specific title of 5 words or fewer "
    "that captures what happens — ideally referencing the shot type, outcome, "
    "or anything memorable. Reply with only the title, no quotes, no punctuation at the end."
)


@router.get("/available-models")
def list_models():
    """Debug endpoint to see what models the inference API actually exposes."""
    if not settings.do_inference_api_key:
        raise HTTPException(status_code=503, detail="DO_INFERENCE_API_KEY not configured")
    resp = httpx.get(
        "https://inference.do-ai.run/v1/models",
        headers={"Authorization": f"Bearer {settings.do_inference_api_key}"},
        timeout=15,
    )
    return resp.json()


@router.post("/{clip_id}/name")
def suggest_name(clip_id: int, db: Session = Depends(get_db)):
    if not settings.do_inference_api_key:
        raise HTTPException(status_code=503, detail="DO_INFERENCE_API_KEY not configured")

    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    resp = httpx.post(
        INFERENCE_URL,
        headers={"Authorization": f"Bearer {settings.do_inference_api_key}"},
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
        timeout=60,
    )

    if resp.status_code != 200:
        print(f"Inference API error: model={MODEL} status={resp.status_code} body={resp.text[:500]}")
        raise HTTPException(status_code=502, detail=f"Inference API error: {resp.text[:200]}")

    name = resp.json()["choices"][0]["message"]["content"].strip()
    return {"name": name}
