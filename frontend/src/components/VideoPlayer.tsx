import { useRef, useState } from "react";
import type { Clip } from "../types";
import { patchClip } from "../api";

interface Props {
  clip: Clip;
  onUpdate: (updated: Clip) => void;
  onEnded: () => void;
}

function Stars({ rating, onChange }: { rating: number | null; onChange: (r: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? rating ?? 0;
  return (
    <span style={{ fontSize: 28, cursor: "pointer", lineHeight: 1, letterSpacing: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          onClick={() => onChange(n)}
          style={{ color: n <= display ? "#ffd700" : "rgba(255,255,255,0.2)", transition: "color 0.1s" }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function VideoPlayer({ clip, onUpdate, onEnded }: Props) {
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(clip.title ?? "");

  async function commitTitle() {
    setEditing(false);
    if (titleDraft === (clip.title ?? "")) return;
    const updated = await patchClip(clip.id, { title: titleDraft });
    onUpdate(updated);
  }

  async function handleRating(r: number) {
    const updated = await patchClip(clip.id, { rating: r });
    onUpdate(updated);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, padding: "12px 16px 16px", gap: 12 }}>
      <video
        key={clip.id}
        src={clip.video_url}
        controls
        playsInline
        onEnded={onEnded}
        style={{ width: "100%", flex: 1, minHeight: 0, background: "#000", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
      />
      <div style={{
        background: "rgba(0,0,0,0.35)",
        borderRadius: 12,
        padding: "12px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        border: "1px solid rgba(255,107,53,0.2)",
      }}>
        {editing ? (
          <input
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => { if (e.key === "Enter") commitTitle(); if (e.key === "Escape") { setEditing(false); setTitleDraft(clip.title ?? ""); } }}
            autoFocus
            placeholder="Name this rally…"
            style={{ fontSize: 20, fontWeight: 700, background: "transparent", border: "none", borderBottom: "2px solid #ff6b35", color: "#fff", outline: "none", padding: "2px 0", width: "100%" }}
          />
        ) : (
          <div
            onClick={() => { setEditing(true); setTitleDraft(clip.title ?? ""); }}
            title="Tap to edit title"
            style={{ fontSize: 20, fontWeight: 700, color: clip.title ? "#fff" : "rgba(255,255,255,0.3)", cursor: "text" }}
          >
            {clip.title || "Tap to name this rally…"}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <Stars rating={clip.rating} onChange={handleRating} />
          <span style={{ fontSize: 13, color: "#aaa" }}>{formatDate(clip.recorded_at)}</span>
          <span style={{
            fontSize: 11,
            background: clip.account === "account1" ? "rgba(255,107,53,0.3)" : "rgba(100,180,255,0.3)",
            color: clip.account === "account1" ? "#ff9a70" : "#80c8ff",
            padding: "2px 8px",
            borderRadius: 20,
            fontWeight: 600,
          }}>
            {clip.account === "account1" ? "Account 1" : "Account 2"}
          </span>
        </div>
      </div>
    </div>
  );
}
