import type { Clip } from "./types";

export async function fetchClips(sort: string): Promise<Clip[]> {
  const res = await fetch(`/api/clips?sort=${sort}`);
  if (!res.ok) throw new Error("Failed to fetch clips");
  return res.json();
}

export async function patchClip(
  id: number,
  patch: { title?: string; rating?: number; start_offset?: number }
): Promise<Clip> {
  const res = await fetch(`/api/clips/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to update clip");
  return res.json();
}

export async function triggerScrape(): Promise<void> {
  await fetch(`/api/scraper/run`, { method: "POST" });
}
