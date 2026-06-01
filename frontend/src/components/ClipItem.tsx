import type { Clip } from "../types";

interface Props {
  clip: Clip;
  active: boolean;
  onClick: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
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
        padding: "8px 10px",
        cursor: "pointer",
        backgroundColor: active ? "#2a2a2a" : "transparent",
        borderLeft: active ? "3px solid #4af" : "3px solid transparent",
        alignItems: "center",
      }}
    >
      {clip.thumb_url ? (
        <img
          src={clip.thumb_url}
          alt=""
          style={{ width: 72, height: 48, objectFit: "cover", borderRadius: 4, flexShrink: 0 }}
        />
      ) : (
        <div style={{ width: 72, height: 48, background: "#333", borderRadius: 4, flexShrink: 0 }} />
      )}
      <div style={{ overflow: "hidden" }}>
        <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#eee" }}>
          {clip.title || "Untitled"}
        </div>
        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{formatDate(clip.recorded_at)}</div>
        {clip.rating && (
          <div style={{ fontSize: 11, color: "#fa0", marginTop: 1 }}>{"★".repeat(clip.rating)}{"☆".repeat(5 - clip.rating)}</div>
        )}
      </div>
    </div>
  );
}
