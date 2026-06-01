export interface Clip {
  id: number;
  external_id: string;
  account: string;
  recorded_at: string;
  video_url: string;
  thumb_url: string | null;
  title: string | null;
  rating: number | null;
  created_at: string | null;
}

export type SortMode = "date" | "rating";
