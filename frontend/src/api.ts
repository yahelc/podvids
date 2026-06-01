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

export async function nameUntitled(): Promise<{ named: number }> {
  const res = await fetch("/api/clips/name-untitled", { method: "POST" });
  if (!res.ok) throw new Error("Failed to trigger naming");
  return res.json();
}

export async function suggestName(id: number): Promise<string> {
  const res = await fetch(`/api/clips/${id}/name`, { method: "POST" });
  if (!res.ok) throw new Error("Name suggestion failed");
  const data = await res.json();
  return data.name;
}
