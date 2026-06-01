import { useEffect, useState } from "react";
import type { Clip, SortMode } from "./types";
import { fetchClips, triggerScrape } from "./api";
import VideoPlayer from "./components/VideoPlayer";
import Sidebar from "./components/Sidebar";

export default function App() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [sort, setSort] = useState<SortMode>("date");
  const [autoplay, setAutoplay] = useState(false);

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
    await triggerScrape();
    setTimeout(() => fetchClips(sort).then(setClips), 2000);
  }

  const activeClip = clips.find((c) => c.id === activeId) ?? null;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#111", color: "#eee", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {activeClip ? (
          <VideoPlayer clip={activeClip} onUpdate={handleUpdate} onEnded={handleEnded} />
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#444" }}>
            Select a clip from the sidebar
          </div>
        )}
      </div>
      <div style={{ width: 280, flexShrink: 0 }}>
        <Sidebar
          clips={clips}
          activeId={activeId}
          sort={sort}
          autoplay={autoplay}
          onSelect={(c) => setActiveId(c.id)}
          onSortChange={setSort}
          onAutoplayToggle={() => setAutoplay((v) => !v)}
          onScrape={handleScrape}
        />
      </div>
    </div>
  );
}
