import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

from backend.app.database import SessionLocal
from backend.app.models import Clip
from backend.scraper.pingpod import login, list_events, extract_replays
from backend.app.config import settings

ACCOUNTS = [
    ("account1", settings.pingpod_email_1, settings.pingpod_password_1),
    ("account2", settings.pingpod_email_2, settings.pingpod_password_2),
]


def scrape_account(label: str, email: str, password: str, db) -> int:
    if not email or not password:
        print(f"Skipping {label}: no credentials configured")
        return 0

    print(f"Authenticating {label}...")
    token = login(email, password)

    inserted = 0
    page = 1
    while True:
        print(f"  Fetching page {page}...")
        data = list_events(token, page=page, ipp=50)
        events = data.get("items", [])
        if not events:
            break

        for event in events:
            for replay in extract_replays(event, label):
                existing = db.query(Clip).filter_by(external_id=replay["external_id"]).first()
                if existing:
                    continue
                recorded_at = datetime.fromisoformat(replay["recorded_at"].replace("Z", "+00:00"))
                clip = Clip(
                    external_id=replay["external_id"],
                    account=replay["account"],
                    recorded_at=recorded_at,
                    video_url=replay["video_url"],
                    thumb_url=replay.get("thumb_url"),
                )
                db.add(clip)
                inserted += 1

        db.commit()

        total = data.get("total", 0)
        ipp = data.get("ipp", 50)
        if page * ipp >= total:
            break
        page += 1

    print(f"  {label}: inserted {inserted} new clips")
    return inserted


def scrape_all():
    db = SessionLocal()
    try:
        total = 0
        for label, email, password in ACCOUNTS:
            total += scrape_account(label, email, password, db)
        print(f"Scrape complete: {total} total new clips")
    finally:
        db.close()


if __name__ == "__main__":
    scrape_all()
