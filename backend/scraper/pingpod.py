import httpx
from typing import Optional


BASE_URL = "https://app.pingpod.com/apis/v2"


def login(email: str, password: str) -> str:
    """Authenticate and return a bearer token."""
    resp = httpx.post(
        f"{BASE_URL}/users/login",
        json={"email": email, "password": password},
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    # Token is typically nested under data.token or similar — adjust if needed
    return data.get("data", {}).get("token") or data["token"]


def list_events(token: str, page: int = 1, ipp: int = 50) -> dict:
    """Fetch one page of events with replays expanded."""
    params = {
        "selfOnly": "true",
        "excludeListed": "true",
        "includeSuspended": "true",
        "expand": [
            "items._links.replays",
        ],
        "sort": "-startTime",
        "page": page,
        "ipp": ipp,
    }
    resp = httpx.get(
        f"{BASE_URL}/events",
        params=params,
        headers={"Authorization": f"Bearer {token}"},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def extract_replays(event: dict, account_label: str) -> list[dict]:
    """Extract replay dicts from a single event object."""
    replays = []
    replay_items = (
        event.get("_links", {})
        .get("replays", {})
        .get("items", [])
    )
    for replay in replay_items:
        video_href = (
            replay.get("_links", {})
            .get("video", {})
            .get("items", [{}])[0]
            .get("href")
        )
        thumb_href = (
            replay.get("_links", {})
            .get("preview", {})
            .get("items", [{}])[0]
            .get("href")
        )
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
