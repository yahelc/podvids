import { useState, useRef, useEffect, useCallback } from "react";
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

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
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
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [hasAirPlay, setHasAirPlay] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekingRef = useRef(false);

  const scheduleHide = useCallback((isPlaying: boolean) => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (isPlaying) {
      hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
    }
  }, []);

  function revealControls() {
    setControlsVisible(true);
    scheduleHide(playing);
  }

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    // Detect AirPlay availability (Safari only)
    if ("WebKitPlaybackTargetAvailabilityEvent" in window) {
      const handler = (e: Event) => {
        const ev = e as any;
        setHasAirPlay(ev.availability === "available");
      };
      v.addEventListener("webkitplaybacktargetavailabilitychanged", handler);
      return () => v.removeEventListener("webkitplaybacktargetavailabilitychanged", handler);
    }
  }, []);

  useEffect(() => {
    if (autoplay && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
    setCurrentTime(0);
    setDuration(0);
    setPlaying(false);
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, [clip.id]);

  useEffect(() => () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); }, []);

  function handleLoadedMetadata() {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
    if (clip.start_offset) v.currentTime = clip.start_offset;
  }

  function handleTimeUpdate() {
    if (!seekingRef.current && videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }

  function handlePlay() {
    setPlaying(true);
    scheduleHide(true);
  }

  function handlePause() {
    setPlaying(false);
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }

  function togglePlay(e: React.MouseEvent | React.TouchEvent) {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
    revealControls();
  }

  function handleVideoTap() {
    if (controlsVisible) {
      // tap on video (not controls) while visible: just toggle play
      const v = videoRef.current;
      if (!v) return;
      if (v.paused) v.play().catch(() => {});
      else v.pause();
    }
    revealControls();
  }

  function handleSeekStart() {
    seekingRef.current = true;
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }

  function handleSeekInput(e: React.ChangeEvent<HTMLInputElement>) {
    const t = Number(e.target.value);
    setCurrentTime(t);
    if (videoRef.current) videoRef.current.currentTime = t;
  }

  function handleSeekEnd() {
    seekingRef.current = false;
    scheduleHide(playing);
  }

  function handleAirPlay(e: React.MouseEvent) {
    e.stopPropagation();
    const v = videoRef.current as any;
    if (v?.webkitShowPlaybackTargetPicker) v.webkitShowPlaybackTargetPicker();
  }

  function handleFullscreen(e: React.MouseEvent) {
    e.stopPropagation();
    const v = videoRef.current as any;
    if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen();
    else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
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

  const pct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, padding: "12px 16px 16px", gap: 12, overflowY: "auto" }}>
      {/* Video container with custom controls */}
      <div
        style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#000", borderRadius: 12, overflow: "hidden", flexShrink: 0, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", cursor: "pointer" }}
        onClick={handleVideoTap}
      >
        <video
          key={clip.id}
          ref={videoRef}
          src={clip.video_url}
          playsInline
          onEnded={onEnded}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          style={{ width: "100%", height: "100%", display: "block" }}
        />

        {/* Center play/pause indicator — flashes briefly */}
        {!playing && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            pointerEvents: "none",
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(0,0,0,0.55)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 28, marginLeft: 4 }}>▶</span>
            </div>
          </div>
        )}

        {/* Bottom controls overlay */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "linear-gradient(transparent, rgba(0,0,0,0.75))",
            padding: "28px 12px 10px",
            opacity: controlsVisible ? 1 : 0,
            transition: "opacity 0.3s",
            pointerEvents: controlsVisible ? "auto" : "none",
          }}
        >
          {/* Seek bar */}
          <div style={{ position: "relative", height: 20, display: "flex", alignItems: "center", marginBottom: 6 }}>
            {/* Track background */}
            <div style={{ position: "absolute", left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.25)", borderRadius: 2 }} />
            {/* Filled portion */}
            <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: 3, background: "#ff6b35", borderRadius: 2, pointerEvents: "none" }} />
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onPointerDown={handleSeekStart}
              onChange={handleSeekInput}
              onPointerUp={handleSeekEnd}
              style={{
                position: "absolute", left: 0, right: 0, width: "100%",
                opacity: 0, height: 20, cursor: "pointer", margin: 0,
              }}
            />
          </div>

          {/* Bottom row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={togglePlay}
              style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", padding: "0 4px", lineHeight: 1, minWidth: 28 }}
            >
              {playing ? "⏸" : "▶"}
            </button>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", fontVariantNumeric: "tabular-nums" }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              {hasAirPlay && (
                <button
                  onClick={handleAirPlay}
                  title="AirPlay"
                  style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}
                >
                  {/* AirPlay icon — triangle into rectangle */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 17l-5 4h10l-5-4zm0-14C6.48 3 2 7.48 2 13c0 3.07 1.39 5.81 3.58 7.66l1.43-1.43A8 8 0 014 13c0-4.42 3.58-8 8-8s8 3.58 8 8a7.97 7.97 0 01-3 6.22l1.42 1.42A9.96 9.96 0 0022 13c0-5.52-4.48-10-10-10z"/>
                  </svg>
                </button>
              )}
              <button
                onClick={handleFullscreen}
                title="Fullscreen"
                style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata panel */}
      <div style={{
        background: "rgba(0,0,0,0.35)",
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        border: "1px solid rgba(255,107,53,0.2)",
      }}>
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
