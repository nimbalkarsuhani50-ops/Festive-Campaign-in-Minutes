import type { CampaignData, CampaignInput, PosterAspectRatio } from "../types";

export interface HistorySummary {
  id: string;
  createdAt: number;
  updatedAt: number;
  brand: string;
  festival: string;
  city: string;
  stylePreset: string;
  tagline: string;
  posterSeed: number;
  thumb?: string | null;
}

export interface HistoryEntry {
  id: string;
  createdAt: number;
  updatedAt: number;
  input: CampaignInput;
  campaign: CampaignData;
  posterSeed: number;
  aspectRatio: PosterAspectRatio;
}

export async function fetchHistory(): Promise<{ items: HistorySummary[]; persisted: boolean }> {
  const res = await fetch("/api/history?limit=24");
  if (!res.ok) throw new Error("History unavailable");
  return res.json();
}

export async function fetchHistoryEntry(id: string): Promise<HistoryEntry> {
  const res = await fetch(`/api/history?id=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error("Could not load that campaign");
  return res.json();
}

/** Saves (or updates, when id is given) a campaign. Never throws: history is best-effort. */
export async function saveHistory(entry: {
  id?: string | null;
  input: CampaignInput;
  campaign: CampaignData;
  posterSeed: number;
  aspectRatio: PosterAspectRatio;
}): Promise<{ id: string; persisted: boolean } | null> {
  try {
    const res = await fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...entry, id: entry.id ?? undefined }),
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}
