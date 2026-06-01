import { useEffect, useState } from "react";
import type { Clip, SortMode } from "./types";
import { fetchClips, triggerScrape } from "./api";
import VideoPlayer from "./components/VideoPlayer";
import Sidebar from "./components/Sidebar";

export default function App() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [sort, setSort] = useState<SortMode>("date");
  const [autoplay, setAutoplay] = useState(() => localStorage.getItem("autoplay") === "true");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchClips(sort).then((data) => {
      setClips(data);
      if (data.length && activeId === null) setActiveId(data[0].id);
    });
  }, [sort]);

  function handleUpdate(updated: Clip) {
    setClips((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  function handleEnded() {
    if (!autoplay || activeId === null) return;
    const idx = clips.findIndex((c) => c.id === activeId);
    if (idx < clips.length - 1) setActiveId(clips[idx + 1].id);
  }

  async function handleScrape() {
    setSyncing(true);
    await triggerScrape();
    setTimeout(() => {
      fetchClips(sort).then(setClips);
      setSyncing(false);
    }, 4000);
  }

  const activeClip = clips.find((c) => c.id === activeId) ?? null;

  return (
    <div id="layout" style={{
      display: "flex",
      height: "100vh",
      background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
      color: "#fff",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "rgba(0,0,0,0.3)",
          borderBottom: "2px solid #ff6b35",
        }}>
          <span style={{ fontSize: 28 }}>🏓</span>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1, color: "#ff6b35" }}>PodVids</span>
          <span style={{ fontSize: 13, color: "#aaa", marginLeft: 4 }}>ping pong highlights</span>
        </div>

        {activeClip ? (
          <VideoPlayer clip={activeClip} autoplay={autoplay} onUpdate={handleUpdate} onEnded={handleEnded} />
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, color: "#aaa" }}>
            <span style={{ fontSize: 64 }}>🏓</span>
            <span style={{ fontSize: 18 }}>No clips yet — hit Sync to load your highlights!</span>
          </div>
        )}
      </div>
      <div id="sidebar" style={{ width: 300, flexShrink: 0, borderLeft: "2px solid rgba(255,107,53,0.3)" }}>
        <Sidebar
          clips={clips}
          activeId={activeId}
          sort={sort}
          autoplay={autoplay}
          syncing={syncing}
          onSelect={(c) => setActiveId(c.id)}
          onSortChange={setSort}
          onAutoplayToggle={() => setAutoplay((v) => { const next = !v; localStorage.setItem("autoplay", String(next)); return next; })}
          onScrape={handleScrape}
        />
      </div>
    </div>
  );
}
