import type { Clip, SortMode } from "../types";
import ClipItem from "./ClipItem";

interface Props {
  clips: Clip[];
  activeId: number | null;
  sort: SortMode;
  autoplay: boolean;
  onSelect: (clip: Clip) => void;
  onSortChange: (s: SortMode) => void;
  onAutoplayToggle: () => void;
  onScrape: () => void;
}

export default function Sidebar({ clips, activeId, sort, autoplay, onSelect, onSortChange, onAutoplayToggle, onScrape }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", borderLeft: "1px solid #222" }}>
      <div style={{ padding: "8px 10px", display: "flex", gap: 8, alignItems: "center", borderBottom: "1px solid #222", flexShrink: 0 }}>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortMode)}
          style={{ background: "#1a1a1a", color: "#ccc", border: "1px solid #333", padding: "4px 8px", borderRadius: 4, fontSize: 12 }}
        >
          <option value="date">Newest first</option>
          <option value="rating">Highest rated</option>
        </select>
        <label style={{ fontSize: 12, color: "#aaa", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
          <input type="checkbox" checked={autoplay} onChange={onAutoplayToggle} />
          Autoplay
        </label>
        <button
          onClick={onScrape}
          style={{ marginLeft: "auto", fontSize: 11, background: "#333", color: "#ccc", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer" }}
        >
          Sync
        </button>
      </div>
      <div style={{ overflowY: "auto", flex: 1 }}>
        {clips.map((clip) => (
          <ClipItem key={clip.id} clip={clip} active={clip.id === activeId} onClick={() => onSelect(clip)} />
        ))}
        {clips.length === 0 && (
          <div style={{ padding: 20, color: "#555", fontSize: 13, textAlign: "center" }}>No clips yet. Hit Sync to scrape.</div>
        )}
      </div>
    </div>
  );
}
