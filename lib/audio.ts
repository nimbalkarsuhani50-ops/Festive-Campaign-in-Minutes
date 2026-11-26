import { createHash } from "node:crypto";
import { historyPersisted, redis } from "./history.js";
import { signPrompt } from "./images.js";

/**
 * Reel audio: AI voiceover (Gemini TTS) and an AI soundtrack (Lyria).
 * Same pattern as poster images: signed text only, content-addressed cache in
 * Redis, immutable HTTP caching on GET.
 */
const API = "https://generativelanguage.googleapis.com/v1beta";
const apiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
const TTS_MODELS = (process.env.GEMINI_TTS_MODEL || "gemini-3.8-flash-tts,gemini-2.5-flash-preview-tts").split(",");
const MUSIC_MODELS = (process.env.GEMINI_MUSIC_MODEL || "lyria-3-clip-preview,lyria-3.5").split(",");

const mem = new Map<string, { mime: string; b64: string }>();
const key = (id: string) => `festive:audio:${id}`;

async function read(id: string) {
  if (historyPersisted()) {
    const raw = (await redis([["GET", key(id)]]))[0] as string | null;
    return raw ? (JSON.parse(raw) as { mime: string; b64: string }) : null;
  }
  return mem.get(id) ?? null;
}
async function write(id: string, v: { mime: string; b64: string }) {
  if (historyPersisted()) await redis([["SET", key(id), JSON.stringify(v)]]);
  else mem.set(id, v);
}

/** Wraps raw 16-bit PCM in a WAV header so browsers can decode it. */
function pcmToWav(pcm: Buffer, rate: number): Buffer {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

async function callAudio(model: string, body: unknown): Promise<{ mime: string; b64: string }> {
  const res = await fetch(`${API}/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${model} ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data: any = await res.json();
  const part = (data?.candidates?.[0]?.content?.parts ?? []).find((p: any) => p.inlineData?.data);
  if (!part) throw new Error(`${model} returned no audio: ${JSON.stringify(data).slice(0, 300)}`);
  let mime: string = part.inlineData.mimeType || "audio/wav";
  let b64: string = part.inlineData.data;
  if (/L16|pcm/i.test(mime)) {
    const rate = Number((mime.match(/rate=(\d+)/) ?? [0, 24000])[1]);
    b64 = pcmToWav(Buffer.from(b64, "base64"), rate).toString("base64");
    mime = "audio/wav";
  }
  return { mime, b64 };
}

async function generate(kind: "voice" | "music", text: string, voice: string): Promise<{ mime: string; b64: string }> {
  let lastErr: unknown;
  const models = kind === "voice" ? TTS_MODELS : MUSIC_MODELS;
  for (const m of models) {
    try {
      if (kind === "voice") {
        return await callAudio(m, {
          contents: [{ role: "user", parts: [{ text: text }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
          },
        });
      }
      return await callAudio(m, {
        contents: [{ role: "user", parts: [{ text: `Instrumental only, no vocals. ${text}` }] }],
        generationConfig: { responseModalities: ["AUDIO"] },
      });
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

const inflight = new Map<string, Promise<string>>();

export async function handleAudio(method: string, query: { id?: string | null }, body?: any) {
  try {
    if (method === "GET") {
      const id = String(query.id || "");
      if (!/^[a-f0-9]{40}$/.test(id)) return { status: 400, body: { error: "Bad id." } };
      const a = await read(id);
      if (!a) return { status: 404, body: { error: "Not found." } };
      return { status: 200, binary: { mime: a.mime, data: Buffer.from(a.b64, "base64") } };
    }
    if (method === "POST") {
      const kind = body?.kind === "music" ? "music" : "voice";
      const text = String(body?.text || "").slice(0, 1500);
      if (!text || signPrompt(text) !== String(body?.token || "")) return { status: 403, body: { error: "Unsigned text." } };
      const voice = /^[A-Za-z]{3,20}$/.test(String(body?.voice || "")) ? String(body.voice) : "Kore";
      const id = createHash("sha256").update(`a3|${kind}|${voice}|${text}`).digest("hex").slice(0, 40);
      if (await read(id)) return { status: 200, body: { id } };
      let p = inflight.get(id);
      if (!p) {
        p = generate(kind, text, voice)
          .then(async (a) => {
            await write(id, a);
            return id;
          })
          .finally(() => inflight.delete(id));
        inflight.set(id, p);
      }
      return { status: 200, body: { id: await p } };
    }
    return { status: 405, body: { error: "Method not allowed." } };
  } catch (err) {
    console.error("audio error:", err);
    return { status: 502, body: { error: err instanceof Error ? err.message.slice(0, 300) : "Audio generation failed." } };
  }
}
