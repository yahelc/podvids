from datetime import datetime

from app.database import SessionLocal
from app.models import Clip
from scraper.pingpod import login, list_events, extract_replays
from app.config import settings

ACCOUNTS = [
    ("account1", settings.pingpod_email_1, settings.pingpod_password_1),
    ("account2", settings.pingpod_email_2, settings.pingpod_password_2),
]


def scrape_account(label: str, email: str, password: str, db) -> int:
    if not email or not password:
        print(f"Skipping {label}: no credentials configured")
        return 0
    print(f"  Authenticating {label} as {email}...")
    token = login(email, password)
    print(f"  Got token, prefix: {token[:10]}...")

    inserted = 0
    page = 1
    while True:
        print(f"  Fetching page {page}...")
        data = list_events(token, page=page, ipp=50)
        import json
        print(f"  Raw response keys: {list(data.keys())}")
        print(f"  Raw response (truncated): {json.dumps(data)[:1000]}")
        events = data.get("items", [])
        print(f"  Got {len(events)} events, total={data.get('total')}")
        if events:
            import json
            first = events[0]
            print(f"  First event keys: {list(first.keys())}")
            replays_raw = first.get("_links", {}).get("replays", {})
            print(f"  First event replays structure: {json.dumps(replays_raw)[:1000]}")
            # Also dump the full first event so we can see the real shape
            print(f"  Full first event (truncated): {json.dumps(first)[:2000]}")
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
