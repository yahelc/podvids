import { useState, useRef, useEffect } from "react";
import type { Clip } from "../types";
import { patchClip, suggestName } from "../api";

interface Props {
  clip: Clip;
  autoplay: boolean;
  onUpdate: (updated: Clip) => void;
  onEnded: () => void;
}

function Stars({ rating, onChange }: { rating: number | null; onChange: (r: number) => void }) {
  return (
    <span style={{ fontSize: 36, lineHeight: 1, letterSpacing: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={() => onChange(n)}
          style={{
            color: n <= (rating ?? 0) ? "#ffd700" : "rgba(255,255,255,0.2)",
            cursor: "pointer",
            padding: "4px 2px",
            display: "inline-block",
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function formatDate(iso: string): string {
  const utc = iso.endsWith("Z") || iso.includes("+") ? iso : iso + "Z";
  return new Date(utc).toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function TitleModal({ clipId, current, onSave, onClose }: { clipId: number; current: string; onSave: (t: string) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(current);
  const [naming, setNaming] = useState(false);

  async function handleSuggest() {
    setNaming(true);
    try {
      const name = await suggestName(clipId);
      setDraft(name);
    } finally {
      setNaming(false);
    }
  }
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1a2a3a",
          borderRadius: "20px 20px 0 0",
          padding: "24px 24px 40px",
          width: "100%",
          maxWidth: 600,
          borderTop: "3px solid #ff6b35",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#ff6b35" }}>Name this rally</div>
          <button
            onClick={handleSuggest}
            disabled={naming}
            style={{
              fontSize: 13, padding: "6px 14px", borderRadius: 20,
              border: "1px solid rgba(255,107,53,0.5)", background: "rgba(255,107,53,0.15)",
              color: naming ? "#888" : "#ff9a70", cursor: naming ? "default" : "pointer", fontWeight: 600,
            }}
          >
            {naming ? "⏳ Thinking…" : "✨ Name it"}
          </button>
        </div>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. Epic backhand winner"
          style={{
            width: "100%",
            fontSize: 18,
            padding: "14px 16px",
            borderRadius: 10,
            border: "2px solid #ff6b35",
            background: "#0f2027",
            color: "#fff",
            outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: 16, borderRadius: 10, border: "1px solid #555", background: "transparent", color: "#aaa", fontSize: 16, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(draft); onClose(); }}
            style={{ flex: 2, padding: 16, borderRadius: 10, border: "none", background: "#ff6b35", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VideoPlayer({ clip, autoplay, onUpdate, onEnded }: Props) {
  const [showModal, setShowModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (autoplay && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [clip.id]);

  function handleLoadedMetadata() {
    if (videoRef.current && clip.start_offset) {
      videoRef.current.currentTime = clip.start_offset;
    }
  }

  async function handleSetStartHere() {
    if (!videoRef.current) return;
    const offset = Math.floor(videoRef.current.currentTime);
    const updated = await patchClip(clip.id, { start_offset: offset });
    onUpdate(updated);
  }

  async function handleSaveTitle(title: string) {
    const updated = await patchClip(clip.id, { title });
    onUpdate(updated);
  }

  async function handleRating(r: number) {
    const updated = await patchClip(clip.id, { rating: r });
    onUpdate(updated);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, padding: "12px 16px 16px", gap: 12, overflowY: "auto" }}>
      <video
        key={clip.id}
        ref={videoRef}
        src={clip.video_url}
        controls
        playsInline
        onEnded={onEnded}
        onLoadedMetadata={handleLoadedMetadata}
        style={{ width: "100%", aspectRatio: "16/9", background: "#000", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", flexShrink: 0 }}
      />

      <div style={{
        background: "rgba(0,0,0,0.35)",
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        border: "1px solid rgba(255,107,53,0.2)",
      }}>
        {/* Title row — large tap target */}
        <div
          onClick={() => setShowModal(true)}
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: clip.title ? "#fff" : "rgba(255,255,255,0.35)",
            cursor: "pointer",
            padding: "6px 0",
            display: "flex",
            alignItems: "center",
            gap: 10,
            minHeight: 44,
          }}
        >
          <span style={{ flex: 1 }}>{clip.title || "Tap to name this rally…"}</span>
          <span style={{ fontSize: 18, opacity: 0.5 }}>✏️</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <Stars rating={clip.rating} onChange={handleRating} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "#aaa" }}>{formatDate(clip.recorded_at)}</span>
          <button
            onClick={handleSetStartHere}
            title="Save current position as default start"
            style={{
              fontSize: 12, background: "rgba(255,107,53,0.2)", color: "#ff9a70",
              border: "1px solid rgba(255,107,53,0.4)", borderRadius: 20,
              padding: "4px 12px", cursor: "pointer", fontWeight: 600,
              minHeight: 32,
            }}
          >
            📍 Set start here{clip.start_offset ? ` (${clip.start_offset}s)` : ""}
          </button>
          <span style={{
            fontSize: 12,
            background: clip.account === "account1" ? "rgba(255,107,53,0.3)" : "rgba(100,180,255,0.3)",
            color: clip.account === "account1" ? "#ff9a70" : "#80c8ff",
            padding: "3px 10px",
            borderRadius: 20,
            fontWeight: 600,
          }}>
            {clip.account === "account1" ? "Account 1" : "Account 2"}
          </span>
        </div>
      </div>

      {showModal && (
        <TitleModal
          clipId={clip.id}
          current={clip.title ?? ""}
          onSave={handleSaveTitle}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
