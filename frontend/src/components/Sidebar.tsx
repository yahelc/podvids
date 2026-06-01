import type { Clip, SortMode } from "../types";
import ClipItem from "./ClipItem";

interface Props {
  clips: Clip[];
  activeId: number | null;
  sort: SortMode;
  autoplay: boolean;
  syncing: boolean;
  onSelect: (clip: Clip) => void;
  onSortChange: (s: SortMode) => void;
  onAutoplayToggle: () => void;
  onScrape: () => void;
}

export default function Sidebar({ clips, activeId, sort, autoplay, syncing, onSelect, onSortChange, onAutoplayToggle, onScrape }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "rgba(0,0,0,0.25)" }}>
      <div style={{ padding: "10px 12px", display: "flex", gap: 8, alignItems: "center", borderBottom: "1px solid rgba(255,107,53,0.3)", flexShrink: 0, flexWrap: "wrap" }}>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortMode)}
          style={{ background: "#1a2a3a", color: "#fff", border: "1px solid #ff6b35", padding: "5px 8px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
        >
          <option value="date">🕐 Newest first</option>
          <option value="rating">⭐ Highest rated</option>
        </select>
        <label style={{ fontSize: 12, color: "#ccc", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
          <input type="checkbox" checked={autoplay} onChange={onAutoplayToggle} />
          ▶ Auto
        </label>
        <button
          onClick={onScrape}
          disabled={syncing}
          style={{
            marginLeft: "auto",
            fontSize: 12,
            background: syncing ? "#555" : "#ff6b35",
            color: "#fff",
            border: "none",
            padding: "5px 12px",
            borderRadius: 6,
            cursor: syncing ? "default" : "pointer",
            fontWeight: 700,
            transition: "background 0.2s",
          }}
        >
          {syncing ? "⏳ Syncing…" : "🔄 Sync"}
        </button>
      </div>
      <div style={{ padding: "6px 12px", fontSize: 11, color: "#ff6b35", fontWeight: 700, borderBottom: "1px solid rgba(255,107,53,0.2)" }}>
        {clips.length} clip{clips.length !== 1 ? "s" : ""}
      </div>
      <div style={{ overflowY: "auto", flex: 1 }}>
        {clips.map((clip) => (
          <ClipItem key={clip.id} clip={clip} active={clip.id === activeId} onClick={() => onSelect(clip)} />
        ))}
        {clips.length === 0 && (
          <div style={{ padding: 30, color: "#666", fontSize: 13, textAlign: "center", lineHeight: 2 }}>
            <div style={{ fontSize: 40 }}>🏓</div>
            No clips yet.<br />Hit Sync to load your highlights!
          </div>
        )}
      </div>
    </div>
  );
}
