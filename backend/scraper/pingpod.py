import httpx
from typing import Optional

BASE_URL = "https://app.pingpod.com/apis/v2"
FIREBASE_API_KEY = "AIzaSyB6hVfDS4tKY6R6oD7Z8l1uAejQEulSsVs"


def login(email: str, password: str) -> str:
    """Authenticate with Firebase and return a bearer token."""
    resp = httpx.post(
        f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}",
        json={"email": email, "password": password, "returnSecureToken": True},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["idToken"]


def list_events(token: str, page: int = 1, ipp: int = 50) -> dict:
    """Fetch one page of events with replays expanded."""
    resp = httpx.get(
        f"{BASE_URL}/events",
        params=[
            ("selfOnly", "true"),
            ("excludeListed", "true"),
            ("includeSuspended", "true"),
            ("expand", "items._links.replays"),
            ("sort", "-startTime"),
            ("startTime", "1970-01-01T00:00:00.000Z"),
            ("page", page),
            ("ipp", ipp),
        ],
        headers={"Authorization": f"Bearer {token}"},
        timeout=30,
    )
    print(f"  Request URL: {resp.request.url}")
    print(f"  Response status: {resp.status_code}")
    resp.raise_for_status()
    return resp.json()


def extract_replays(event: dict, account_label: str) -> list[dict]:
    """Extract replay dicts from a single event object."""
    replays = []
    replay_items = event.get("replays", {}).get("items", [])
    for replay in replay_items:
        video_href = replay.get("video", {}).get("high", {}).get("href")
        thumb_href = replay.get("preview", {}).get("small", {}).get("href")
        if not video_href:
            continue
        replays.append({
            "external_id": replay["id"],
            "account": account_label,
            "recorded_at": replay.get("startTime"),
            "video_url": video_href,
            "thumb_url": thumb_href,
        })
    return replays
