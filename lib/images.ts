import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { historyPersisted, redis } from "./history.js";

/**
 * AI poster artwork via Gemini's image models.
 *
 *  - Model discovery: picks an image-capable Gemini model available to this key
 *    (override with GEMINI_IMAGE_MODEL); falls back through the list on error.
 *  - Signed prompts: /api/generate signs every visual prompt it creates, and this
 *    endpoint only draws signed prompts, so nobody can use the key for arbitrary images.
 *  - Content-addressed cache: each image is stored in Redis under a hash of
 *    model + prompt + aspect + variant and served with immutable HTTP caching, so a
 *    given poster is only ever generated once.
 */

const API = "https://generativelanguage.googleapis.com/v1beta";
const apiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";

const ASPECTS: Record<string, string> = {
  instagram_feed: "4:5",
  instagram_story: "9:16",
  whatsapp_status: "9:16",
};

// Bump when ART_DIRECTION changes so cached images are regenerated.
const ART_VERSION = 3;
const ART_DIRECTION =
  "Award-winning festive advertising photograph for a premium brand campaign: cinematic lighting, rich depth of field, " +
  "authentic cultural details, true-to-life products, tasteful styling, high detail. " +
  "ONE single seamless full-bleed photograph that fills the entire frame edge to edge: no borders, no frames, no panels, no split screen, no collage, no letterboxing, no blurred or empty bands. " +
  "Frame it with natural breathing room: the hero subject sits slightly below the centre, with softly defocused real background above it (lights, bokeh, decor) and a real surface or foreground below. " +
  "Only props that belong to this festival and culture. A clean photograph: plain unbranded packaging, no writing of any kind.";

const QC_MODEL = process.env.GEMINI_SMALL_MODEL || "gemini-3.8-flash-lite";

/**
 * Cheap vision check with the small text model: rejects images that contain
 * lettering, caption panels, borders or collage splits. Fails open on errors.
 */
async function passesQc(img: { mime: string; b64: string }): Promise<boolean> {
  try {
    const res = await fetch(`${API}/models/${QC_MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey() },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: img.mime, data: img.b64 } },
              {
                text:
                  "Inspect this advertising photo. has_text: any readable or pseudo letters, words, captions or numbers anywhere (ignore tiny illegible marks). " +
                  "has_layout_defect: borders, frames, white/blank panels, split-screen, collage, or blurred letterbox bands. Answer as JSON.",
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: {
            type: "object",
            properties: { has_text: { type: "boolean" }, has_layout_defect: { type: "boolean" } },
            required: ["has_text", "has_layout_defect"],
          },
          maxOutputTokens: 64,
          temperature: 0,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });
    if (!res.ok) return true;
    const data: any = await res.json();
    const v = JSON.parse(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}");
    return !v.has_text && !v.has_layout_defect;
  } catch {
    return true;
  }
}

// ---------- signing ----------

function signingKey(): Buffer {
  return createHash("sha256").update("festive-img:" + apiKey()).digest();
}

export function signPrompt(prompt: string): string {
  return createHmac("sha256", signingKey()).update(prompt).digest("hex").slice(0, 32);
}

function validSignature(prompt: string, token: string): boolean {
  const want = Buffer.from(signPrompt(prompt));
  const got = Buffer.from(String(token || ""));
  return want.length === got.length && timingSafeEqual(want, got);
}

// ---------- model discovery ----------

let modelList: Promise<string[]> | null = null;

export function imageModels(): Promise<string[]> {
  if (process.env.GEMINI_IMAGE_MODEL) return Promise.resolve([process.env.GEMINI_IMAGE_MODEL]);
  modelList ??= (async () => {
    const res = await fetch(`${API}/models?pageSize=1000`, { headers: { "x-goog-api-key": apiKey() } });
    if (!res.ok) throw new Error(`Model list failed ${res.status}`);
    const data: any = await res.json();
    const names: string[] = (data.models ?? [])
      .filter(
        (m: any) =>
          /image/i.test(m.name) &&
          !/imagen/i.test(m.name) &&
          (m.supportedGenerationMethods ?? []).includes("generateContent")
      )
      .map((m: any) => String(m.name).replace(/^models\//, ""));
    // Prefer flash (cheaper/faster) and stable over preview; newest version first.
    const score = (n: string) =>
      (/flash/.test(n) ? 0 : 10) + (/preview|exp/.test(n) ? 5 : 0) - Number((n.match(/(\d+(?:\.\d+)?)/) ?? [0, 0])[1]) / 100;
    return names.sort((a, b) => score(a) - score(b));
  })().catch((e) => {
    modelList = null;
    throw e;
  });
  return modelList;
}

// ---------- storage ----------

const mem = new Map<string, { mime: string; b64: string }>();
const imgKey = (id: string) => `festive:img:${id}`;

async function readImage(id: string): Promise<{ mime: string; b64: string } | null> {
  if (historyPersisted()) {
    const raw = (await redis([["GET", imgKey(id)]]))[0] as string | null;
    return raw ? JSON.parse(raw) : null;
  }
  return mem.get(id) ?? null;
}

async function writeImage(id: string, v: { mime: string; b64: string }) {
  if (historyPersisted()) {
    await redis([["SET", imgKey(id), JSON.stringify(v)]]);
    return;
  }
  if (mem.size > 60) mem.delete(mem.keys().next().value as string);
  mem.set(id, v);
}

const inflight = new Map<string, Promise<string>>();

async function drawWithGemini(model: string, prompt: string, aspect: string): Promise<{ mime: string; b64: string }> {
  const res = await fetch(`${API}/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey() },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `${prompt}\n\n${ART_DIRECTION}` }] }],
      generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: aspect } },
    }),
  });
  if (!res.ok) throw new Error(`Image model ${model} error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data: any = await res.json();
  const part = (data?.candidates?.[0]?.content?.parts ?? []).find((p: any) => p.inlineData?.data);
  if (!part) throw new Error(`Image model ${model} returned no image`);
  return { mime: part.inlineData.mimeType || "image/png", b64: part.inlineData.data };
}

/** Returns the id of a stored image for this prompt, generating it once if needed. */
async function ensureImage(prompt: string, aspectKey: string, variant: number): Promise<string> {
  const aspect = ASPECTS[aspectKey] ?? "4:5";
  const models = await imageModels();
  if (!models.length) throw new Error("No Gemini image model is available for this API key.");
  const id = createHash("sha256").update(`v${ART_VERSION}|${models[0]}|${aspect}|${variant}|${prompt}`).digest("hex").slice(0, 40);
  if (await readImage(id)) return id;
  const pending = inflight.get(id);
  if (pending) return pending;
  const p = (async () => {
    let lastErr: unknown;
    let fallback: { mime: string; b64: string } | null = null;
    for (const m of models.slice(0, 3)) {
      // Up to 3 attempts on a model: keep the first one that passes the QC check.
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const twist = variant || attempt ? `\nVariation ${variant * 3 + attempt}: a fresh composition and camera angle.` : "";
          const img = await drawWithGemini(m, prompt + twist, aspect);
          fallback ??= img;
          if (await passesQc(img)) {
            await writeImage(id, img);
            return id;
          }
          console.warn(`poster image QC failed (attempt ${attempt + 1}) on ${m}`);
        } catch (e) {
          lastErr = e;
          break; // model error: try the next model
        }
      }
      if (fallback) break;
    }
    if (fallback) {
      await writeImage(id, fallback);
      return id;
    }
    throw lastErr;
  })().finally(() => inflight.delete(id));
  inflight.set(id, p);
  return p;
}

export interface ImageResult {
  status: number;
  body?: unknown;
  binary?: { mime: string; data: Buffer };
}

/** POST {prompt, token, aspect, variant} -> {id};  GET ?id= -> image bytes. */
export async function handleImage(method: string, query: { id?: string | null }, body?: any): Promise<ImageResult> {
  try {
    if (method === "GET") {
      const id = String(query.id || "");
      if (!/^[a-f0-9]{40}$/.test(id)) return { status: 400, body: { error: "Bad id." } };
      const img = await readImage(id);
      if (!img) return { status: 404, body: { error: "Not found." } };
      return { status: 200, binary: { mime: img.mime, data: Buffer.from(img.b64, "base64") } };
    }
    if (method === "POST") {
      const prompt = String(body?.prompt || "").slice(0, 2000);
      if (!prompt || !validSignature(prompt, body?.token)) return { status: 403, body: { error: "Unsigned prompt." } };
      const aspect = String(body?.aspect || "instagram_feed");
      const variant = Math.max(0, Math.min(9, Number(body?.variant) || 0));
      const id = await ensureImage(prompt, aspect, variant);
      return { status: 200, body: { id } };
    }
    if (method === "MODELS") {
      const res = await fetch(`${API}/models?pageSize=1000`, { headers: { "x-goog-api-key": apiKey() } });
      const data: any = await res.json();
      const media = (data.models ?? [])
        .map((m: any) => `${String(m.name).replace(/^models\//, "")} [${(m.supportedGenerationMethods ?? []).join(",")}]`)
        .filter((n: string) => /veo|tts|lyria|audio|music|speech|native/i.test(n));
      return { status: 200, body: { imageModels: await imageModels(), media } };
    }
    return { status: 405, body: { error: "Method not allowed." } };
  } catch (err) {
    console.error("image error:", err);
    return { status: 502, body: { error: err instanceof Error ? err.message.slice(0, 300) : "Image generation failed." } };
  }
}
