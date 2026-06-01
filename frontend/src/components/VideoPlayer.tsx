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
    <span style={{ fontSize: 22, cursor: "pointer", lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          onClick={() => onChange(n)}
          style={{ color: n <= display ? "#fa0" : "#444" }}
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
  const inputRef = useRef<HTMLInputElement>(null);

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
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "12px 16px" }}>
      <video
        key={clip.id}
        src={clip.video_url}
        controls
        onEnded={onEnded}
        style={{ width: "100%", flex: 1, minHeight: 0, background: "#000", borderRadius: 6 }}
      />
      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
        {editing ? (
          <input
            ref={inputRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => { if (e.key === "Enter") commitTitle(); if (e.key === "Escape") { setEditing(false); setTitleDraft(clip.title ?? ""); } }}
            autoFocus
            style={{ fontSize: 16, fontWeight: 600, background: "transparent", border: "none", borderBottom: "1px solid #555", color: "#eee", outline: "none", padding: "2px 0" }}
          />
        ) : (
          <div
            onClick={() => { setEditing(true); setTitleDraft(clip.title ?? ""); }}
            title="Click to edit title"
            style={{ fontSize: 16, fontWeight: 600, color: clip.title ? "#eee" : "#666", cursor: "text" }}
          >
            {clip.title || "Add a title…"}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Stars rating={clip.rating} onChange={handleRating} />
          <span style={{ fontSize: 12, color: "#666" }}>{formatDate(clip.recorded_at)}</span>
          <span style={{ fontSize: 11, color: "#555" }}>{clip.account}</span>
        </div>
      </div>
    </div>
  );
}
