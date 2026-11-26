import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { HandlerResult } from "./campaign.js";

/**
 * Central campaign history. Backed by Upstash Redis over its REST API (the
 * Vercel Marketplace "Upstash for Redis" integration sets the env vars below).
 * Without a database configured it falls back to per-instance memory so the
 * app keeps working; responses then report persisted:false.
 *
 * Posters are saved as their recipe (festival + seed + style + aspect + copy),
 * which re-renders the identical poster — far smaller than storing PNGs.
 */

const REDIS_URL = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
const REDIS_TOKEN = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
export const historyPersisted = () => Boolean(REDIS_URL() && REDIS_TOKEN());

const MAX_ENTRIES = 500;
const IDX = "festive:entries";
const key = (id: string) => `festive:entry:${id}`;

const memory = new Map<string, { score: number; json: string }>();

export async function redis(commands: (string | number)[][]): Promise<any[]> {
  const res = await fetch(`${REDIS_URL().replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN()}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
  });
  if (!res.ok) throw new Error(`History store error ${res.status}`);
  const out = (await res.json()) as { result?: unknown; error?: string }[];
  const bad = out.find((o) => o.error);
  if (bad) throw new Error(`History store error: ${bad.error}`);
  return out.map((o) => o.result);
}

const EntrySchema = z.object({
  id: z.string().regex(/^[a-z0-9]{8,32}$/).optional(),
  input: z
    .object({
      festival: z.string().max(60),
      brand: z.string().max(120),
      city: z.string().max(80),
      audience: z.string().max(200),
      budget: z.number(),
      language: z.string().max(40),
    })
    .passthrough(),
  campaign: z
    .object({
      big_idea: z.string(),
      tagline_en: z.string(),
      tagline_regional: z.string(),
      instagram_posts: z.array(z.record(z.string(), z.any())).max(8),
      posters: z.array(z.record(z.string(), z.any())).max(3).optional(),
      reel_script: z.record(z.string(), z.any()),
      channel_plan: z.array(z.record(z.string(), z.any())).max(8),
      poster_prompt: z.string(),
    })
    .passthrough(),
  posterSeed: z.number().int().optional(),
  aspectRatio: z.string().max(30).optional(),
});

interface StoredEntry {
  id: string;
  createdAt: number;
  updatedAt: number;
  input: Record<string, unknown>;
  campaign: Record<string, unknown>;
  posterSeed: number;
  aspectRatio: string;
}

async function readRaw(id: string): Promise<string | null> {
  if (historyPersisted()) return ((await redis([["GET", key(id)]]))[0] as string | null) ?? null;
  return memory.get(id)?.json ?? null;
}

async function save(entry: StoredEntry): Promise<void> {
  const json = JSON.stringify(entry);
  if (historyPersisted()) {
    await redis([
      ["SET", key(entry.id), json],
      ["ZADD", IDX, entry.updatedAt, entry.id],
      ["ZREMRANGEBYRANK", IDX, 0, -(MAX_ENTRIES + 1)],
    ]);
    return;
  }
  memory.set(entry.id, { score: entry.updatedAt, json });
  if (memory.size > MAX_ENTRIES) {
    const oldest = [...memory.entries()].sort((a, b) => a[1].score - b[1].score)[0];
    if (oldest) memory.delete(oldest[0]);
  }
}

async function upsert(body: unknown): Promise<HandlerResult> {
  const parsed = EntrySchema.safeParse(body);
  if (!parsed.success) return { status: 400, body: { error: "Invalid history entry." } };
  const v = parsed.data;
  const now = Date.now();
  const id = v.id ?? randomBytes(8).toString("hex");
  let createdAt = now;
  if (v.id) {
    const prev = await readRaw(id);
    if (prev) createdAt = (JSON.parse(prev) as StoredEntry).createdAt ?? now;
  }
  const entry: StoredEntry = {
    id,
    createdAt,
    updatedAt: now,
    input: v.input,
    campaign: v.campaign,
    posterSeed: v.posterSeed ?? 7,
    aspectRatio: v.aspectRatio ?? "instagram_feed",
  };
  if (JSON.stringify(entry).length > 150_000) return { status: 413, body: { error: "Entry too large." } };
  await save(entry);
  return { status: 200, body: { id, persisted: historyPersisted() } };
}

async function list(limit: number): Promise<HandlerResult> {
  let rows: StoredEntry[] = [];
  if (historyPersisted()) {
    const ids = ((await redis([["ZRANGE", IDX, 0, limit - 1, "REV"]]))[0] as string[]) ?? [];
    if (ids.length) {
      const vals = ((await redis([["MGET", ...ids.map(key)]]))[0] as (string | null)[]) ?? [];
      rows = vals.filter((x): x is string => !!x).map((x) => JSON.parse(x));
    }
  } else {
    rows = [...memory.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((m) => JSON.parse(m.json));
  }
  const items = rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    brand: r.input.brand,
    festival: r.input.festival,
    city: r.input.city,
    stylePreset: r.input.stylePreset ?? "Festive Gold",
    tagline: (r.campaign as any).tagline_en,
    posterSeed: r.posterSeed,
    thumb: (r.campaign as any).posters?.[0]?.images?.instagram_feed ?? null,
  }));
  return { status: 200, body: { items, persisted: historyPersisted() } };
}

/** Shared by the Express server and the Vercel function. */
export async function handleHistory(
  method: string,
  query: { id?: string | null; limit?: string | null },
  body?: unknown
): Promise<HandlerResult> {
  try {
    if (method === "POST") return await upsert(body);
    if (method === "GET") {
      if (query.id) {
        if (!/^[a-z0-9]{8,32}$/.test(query.id)) return { status: 400, body: { error: "Bad id." } };
        const raw = await readRaw(query.id);
        return raw ? { status: 200, body: JSON.parse(raw) } : { status: 404, body: { error: "Not found." } };
      }
      const limit = Math.min(60, Math.max(1, Number(query.limit) || 24));
      return await list(limit);
    }
    return { status: 405, body: { error: "Method not allowed." } };
  } catch (err) {
    console.error("history error:", err);
    return { status: 500, body: { error: "History store unavailable." } };
  }
}
