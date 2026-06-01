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
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetchClips(sort).then((data) => {
      setClips(data);
      (window as any).podvids = { videoUrls: data.map((c) => c.video_url) };
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

  function handleSelect(clip: Clip) {
    setActiveId(clip.id);
    setDrawerOpen(false);
  }

  const activeClip = clips.find((c) => c.id === activeId) ?? null;
  const activeClipTitle = activeClip?.title || "Untitled rally";

  const sidebarProps = {
    clips,
    activeId,
    sort,
    autoplay,
    syncing,
    onSelect: handleSelect,
    onSortChange: setSort,
    onAutoplayToggle: () => setAutoplay((v) => { const next = !v; localStorage.setItem("autoplay", String(next)); return next; }),
    onScrape: handleScrape,
  };

  return (
    <div id="layout" style={{
      display: "flex",
      height: "100vh",
      background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
      color: "#fff",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      overflow: "hidden",
    }}>
      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "rgba(0,0,0,0.3)",
          borderBottom: "2px solid #ff6b35",
          flexShrink: 0,
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
            <span style={{ fontSize: 18 }}>No clips yet — hit Sync to load!</span>
          </div>
        )}

        {/* Mobile bottom bar — only visible on narrow screens */}
        <div className="mobile-bar" style={{
          display: "none",
          alignItems: "center",
          gap: 10,
          padding: "10px 16px",
          background: "rgba(0,0,0,0.5)",
          borderTop: "2px solid rgba(255,107,53,0.4)",
          flexShrink: 0,
        }}>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#eee", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {activeClipTitle}
            </div>
            <div style={{ fontSize: 11, color: "#888" }}>{clips.length} clips</div>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              background: "#ff6b35", color: "#fff", border: "none",
              borderRadius: 10, padding: "10px 18px", fontSize: 14,
              fontWeight: 700, cursor: "pointer", flexShrink: 0,
            }}
          >
            Browse clips ▲
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div id="sidebar" style={{ width: 300, flexShrink: 0, borderLeft: "2px solid rgba(255,107,53,0.3)" }}>
        <Sidebar {...sidebarProps} />
      </div>

      {/* Mobile drawer backdrop */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200 }}
        />
      )}

      {/* Mobile drawer */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "80vh",
        background: "#0f2027",
        borderRadius: "20px 20px 0 0",
        borderTop: "3px solid #ff6b35",
        zIndex: 201,
        transform: drawerOpen ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s ease",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Drawer handle */}
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ padding: "12px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}
        >
          <span style={{ fontSize: 15, fontWeight: 700, color: "#ff6b35" }}>Clips</span>
          <button style={{ background: "none", border: "none", color: "#aaa", fontSize: 22, cursor: "pointer", padding: "0 4px" }}>✕</button>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <Sidebar {...sidebarProps} />
        </div>
      </div>
    </div>
  );
}
