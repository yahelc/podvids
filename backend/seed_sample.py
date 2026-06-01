"""Seed the DB with sample clips from the example JSON response."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from datetime import datetime, timezone
from backend.app.database import SessionLocal, engine
from backend.app.models import Base, Clip

SAMPLE_CLIPS = [
    {
        "external_id": "06c13c1d-cd43-47db-967e-09a34e8a9251",
        "account": "account1",
        "recorded_at": "2026-03-09T15:32:00+00:00",
        "video_url": "https://storage.googleapis.com/podify-pingpod-clips/clips/table1/2026/03/09/06c13c1d-cd43-47db-967e-09a34e8a9251.mp4",
        "thumb_url": "https://storage.googleapis.com/podify-pingpod-clips/clips/table1/2026/03/09/06c13c1d-cd43-47db-967e-09a34e8a9251_w360.jpg",
    },
    {
        "external_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "account": "account2",
        "recorded_at": "2026-02-14T18:45:00+00:00",
        "video_url": "https://storage.googleapis.com/podify-pingpod-clips/clips/table2/2026/02/14/a1b2c3d4-e5f6-7890-abcd-ef1234567890.mp4",
        "thumb_url": "https://storage.googleapis.com/podify-pingpod-clips/clips/table2/2026/02/14/a1b2c3d4-e5f6-7890-abcd-ef1234567890_w360.jpg",
    },
    {
        "external_id": "deadbeef-cafe-1234-5678-90abcdef1234",
        "account": "account1",
        "recorded_at": "2026-01-20T12:10:00+00:00",
        "video_url": "https://storage.googleapis.com/podify-pingpod-clips/clips/table1/2026/01/20/deadbeef-cafe-1234-5678-90abcdef1234.mp4",
        "thumb_url": "https://storage.googleapis.com/podify-pingpod-clips/clips/table1/2026/01/20/deadbeef-cafe-1234-5678-90abcdef1234_w360.jpg",
    },
    {
        "external_id": "f00dface-b00b-1234-5678-aabbccddeeff",
        "account": "account2",
        "recorded_at": "2025-12-25T09:00:00+00:00",
        "video_url": "https://storage.googleapis.com/podify-pingpod-clips/clips/table3/2025/12/25/f00dface-b00b-1234-5678-aabbccddeeff.mp4",
        "thumb_url": "https://storage.googleapis.com/podify-pingpod-clips/clips/table3/2025/12/25/f00dface-b00b-1234-5678-aabbccddeeff_w360.jpg",
    },
]

Base.metadata.create_all(bind=engine)

db = SessionLocal()
added = 0
for clip_data in SAMPLE_CLIPS:
    existing = db.query(Clip).filter_by(external_id=clip_data["external_id"]).first()
    if existing:
        continue
    clip = Clip(
        external_id=clip_data["external_id"],
        account=clip_data["account"],
        recorded_at=datetime.fromisoformat(clip_data["recorded_at"]),
        video_url=clip_data["video_url"],
        thumb_url=clip_data["thumb_url"],
    )
    db.add(clip)
    added += 1

db.commit()
db.close()
print(f"Seeded {added} sample clips")
