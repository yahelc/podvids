from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db, SessionLocal
from ..models import Clip
from ..config import settings
import httpx
from datetime import date, datetime, timezone

router = APIRouter(tags=["name"])

INFERENCE_URL = "https://inference.do-ai.run/v1/chat/completions"
MODEL = "openai-gpt-4o"

SKIP_DATE = date(2026, 2, 7)

PROMPT_TEMPLATE = """You are naming a short table tennis highlight clip for a family's private video archive.
This clip was recorded on {date_context}.

PEOPLE IN THE CLIPS:
- "Barak" is the kid (young boy, child-sized, shorter)
- "Abba" is the dad (adult, taller)
- Name only the person(s) clearly visible — use size/age to distinguish them
- If both are visible, name both

SHOT VOCABULARY — identify and use the most specific term you can see:
- Serves: topspin serve, backspin serve, no-look serve, short push serve
- Attacking: forehand loop, backhand loop, forehand smash, backhand smash, flick, banana flip, counter-loop, speed drive
- Defensive: push, chop, lob, block, fishing lob, desperation retrieve
- Trick shots: tweener (between the legs), around-the-net, behind-the-back, jump smash
- Rally descriptors: table-length exchange, multiball rally, cross-court duel, down-the-line winner

SEASONAL / DATE CONTEXT — weave in when it fits naturally:
- January 1: New Year's Day
- Around December 25: Christmas
- February: Valentine's / Winter
- March–April: Spring Training / Spring
- May–June: Summer
- September–October: Autumn / Fall
- November: Late Autumn
- December (not Christmas): Winter / Holiday Season
{holiday_hint}

VARIETY RULES — vary your sentence structure every title:
- Sometimes lead with the shot: "Banana Flip Winner by Barak"
- Sometimes lead with the person: "Barak Rips a No-Look Serve"
- Sometimes lead with the drama: "Incredible Lob Save Then Smash"
- Sometimes use a scene-setting word: "Late-Night Loop Fest Barak vs Abba"
- Sometimes be poetic or punny: "Abba Drops the Hammer", "Winter Ace by Barak"
- Avoid starting back-to-back titles with the same word (especially avoid overusing "Epic")
- Forbidden words (do NOT use): epic, legendary, incredible, amazing, unbelievable

RULES:
- Max 10 words
- No quotes, no punctuation at the end
- Reply with ONLY the title, nothing else

Examples of the variety and specificity we want:
- Barak Rips Cross-Court Banana Flip Winner
- Abba Drops the Hammer on Short Ball
- New Year Loop Fest Barak vs Abba
- Clutch Lob Save by Abba Then Smash
- Autumn Backhand Chop Survival Barak
- Barak No-Look Serve Catches Abba Off Guard
- Spring Multiball Madness with Abba
- Holiday Smash Fest Dad vs Kid
- Abba Sneaky Backspin Serve Short Corner
- Behind-the-Back Tweener by Barak"""


def _date_context(recorded_at: datetime) -> tuple[str, str]:
    """Returns (human-readable date string, optional holiday hint line)."""
    if recorded_at.tzinfo is None:
        recorded_at = recorded_at.replace(tzinfo=timezone.utc)
    d = recorded_at.date()
    month = d.month
    day = d.day

    month_names = ["", "January", "February", "March", "April", "May", "June",
                   "July", "August", "September", "October", "November", "December"]
    date_str = f"{month_names[month]} {day}, {d.year}"

    holiday_hint = ""
    if month == 1 and day == 1:
        holiday_hint = "- TODAY IS NEW YEAR'S DAY — use 'New Year' somewhere in the title"
    elif month == 12 and 24 <= day <= 26:
        holiday_hint = "- THIS IS CHRISTMAS — use 'Christmas' or 'Holiday' in the title"
    elif month == 11 and 20 <= day <= 30:
        holiday_hint = "- This is Thanksgiving week — consider 'Thanksgiving' or 'Turkey Day' if it fits"
    elif month == 2 and 13 <= day <= 14:
        holiday_hint = "- This is Valentine's Day — consider 'Valentine' if it fits"
    elif month == 10 and day == 31:
        holiday_hint = "- THIS IS HALLOWEEN — use 'Halloween' in the title"

    return date_str, holiday_hint


def _build_prompt(recorded_at: datetime | None) -> str:
    if recorded_at:
        date_str, holiday_hint = _date_context(recorded_at)
    else:
        date_str = "an unknown date"
        holiday_hint = ""
    return PROMPT_TEMPLATE.format(date_context=date_str, holiday_hint=holiday_hint)


def _call_inference(image_url: str, recorded_at: datetime | None = None) -> str:
    prompt = _build_prompt(recorded_at)
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
                        {"type": "text", "text": prompt},
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
    """Background job: auto-name any clips missing a title, skipping Feb 7 2026."""
    if not settings.do_inference_api_key:
        return
    db = SessionLocal()
    try:
        untitled = db.query(Clip).filter(Clip.title == None).all()
        skipped = [c for c in untitled if c.recorded_at and c.recorded_at.date() == SKIP_DATE]
        to_name = [c for c in untitled if not (c.recorded_at and c.recorded_at.date() == SKIP_DATE)]
        print(f"Auto-namer: {len(to_name)} untitled clips to process, {len(skipped)} skipped (Feb 7)")
        for clip in to_name:
            try:
                image_url = clip.thumb_url or clip.video_url
                name = _call_inference(image_url, clip.recorded_at)
                clip.title = name
                db.commit()
                print(f"  Named clip {clip.id}: {name}")
            except Exception as e:
                print(f"  Failed to name clip {clip.id}: {e}")
    finally:
        db.close()


@router.post("/api/clips/name-untitled")
def trigger_name_untitled():
    """Manually trigger the auto-namer and return results synchronously."""
    if not settings.do_inference_api_key:
        raise HTTPException(status_code=503, detail="DO_INFERENCE_API_KEY not configured")
    db = SessionLocal()
    results = []
    try:
        untitled = db.query(Clip).filter(Clip.title == None).all()
        to_name = [c for c in untitled if not (c.recorded_at and c.recorded_at.date() == SKIP_DATE)]
        skipped_count = len(untitled) - len(to_name)
        print(f"Auto-namer triggered: {len(to_name)} untitled clips ({skipped_count} skipped, Feb 7)")
        for clip in to_name:
            try:
                image_url = clip.thumb_url or clip.video_url
                name = _call_inference(image_url, clip.recorded_at)
                clip.title = name
                db.commit()
                print(f"  Named clip {clip.id}: {name}")
                results.append({"id": clip.id, "name": name})
            except Exception as e:
                print(f"  Failed to name clip {clip.id}: {e}")
                results.append({"id": clip.id, "error": str(e)})
    finally:
        db.close()
    return {"named": len([r for r in results if "name" in r]), "skipped": skipped_count, "results": results}


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

    name = _call_inference(clip.thumb_url or clip.video_url, clip.recorded_at)
    return {"name": name}
