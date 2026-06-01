import type { Clip } from "../types";

interface Props {
  clip: Clip;
  active: boolean;
  onClick: () => void;
}

function formatDate(iso: string): string {
  const utc = iso.endsWith("Z") || iso.includes("+") ? iso : iso + "Z";
  return new Date(utc).toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ClipItem({ clip, active, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        gap: 10,
        padding: "12px 12px",
        cursor: "pointer",
        background: active
          ? "linear-gradient(135deg, rgba(255,107,53,0.25), rgba(255,107,53,0.1))"
          : "transparent",
        borderLeft: active ? "4px solid #ff6b35" : "4px solid transparent",
        alignItems: "center",
        transition: "background 0.15s",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {clip.thumb_url ? (
        <img
          src={clip.thumb_url}
          alt=""
          style={{ width: 80, height: 56, objectFit: "cover", borderRadius: 6, flexShrink: 0, border: active ? "2px solid #ff6b35" : "2px solid transparent" }}
        />
      ) : (
        <div style={{ width: 76, height: 52, background: "#1a2a3a", borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🏓</div>
      )}
      <div style={{ overflow: "hidden", flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: active ? "#ff6b35" : "#eee" }}>
          {clip.title || "Untitled rally"}
        </div>
        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{formatDate(clip.recorded_at)}</div>
        {clip.rating && (
          <div style={{ fontSize: 12, color: "#ffd700", marginTop: 2 }}>{"★".repeat(clip.rating)}{"☆".repeat(5 - clip.rating)}</div>
        )}
      </div>
    </div>
  );
}
