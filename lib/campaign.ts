import { createHash } from "node:crypto";
import { z } from "zod";
import { signPrompt } from "./images.js";

/**
 * Gemini-backed campaign generation, shared by the local Express server
 * (server.ts) and the Vercel serverless functions (api/*.ts).
 *
 * Token/cost strategy:
 *  - SLM cascade: try the small model (flash-lite) first, validate the output,
 *    and escalate to the larger model only if it fails or is low quality.
 *  - Thinking disabled and tight maxOutputTokens (structured output needs neither).
 *  - Static system instruction goes first so Gemini's implicit prefix caching applies.
 *  - In-memory response cache + in-flight de-duplication for identical briefs.
 */

export interface HandlerResult {
  status: number;
  body: unknown;
}

const SYSTEM_INSTRUCTION = [
  "You are the creative director of a top Indian/global ad agency making a festive campaign that wins awards AND sells.",
  "First infer exactly what this brand sells (from Business, brand name and audience) and what makes the festival emotionally special in this city. Every line and every visual must be unmistakably about THIS brand's products in THIS festival, never generic festival filler.",
  "Return: big_idea (max 20 words, one sharp insight-led concept);",
  "tagline_en (crisp, memorable);",
  "tagline_regional (idiomatic tagline written natively in the requested language and script; if English is requested, an alternative English line);",
  "palette (primary, secondary, light: hex colours blending the festival's traditional colours with the brand's likely identity);",
  "posters: exactly 3 ready-to-post posters, each a DIFFERENT concept and a DIFFERENT layout chosen from: Bold Headline, Ribbon Frame, Sticker Pop, Magazine Cover, Split Panel, Editorial (pick the layouts that suit each concept and this brand's personality: e.g. Editorial or Magazine Cover for premium brands, Sticker Pop or Bold Headline for youthful offers).",
  "  Pick 3 concepts from: Product Hero, Festive Moment (local people with the product), Offer / Announcement, Gifting Ritual, Behind the Craft, Collection Flat-lay, Night of Celebration, Local Landmark Moment. At least one must make the product the clear hero and one must show people. Use the Creative seed to explore fresh, non-obvious angles every time.",
  "  Avoid generic festival stock imagery: every visual must feature this brand's specific products or service in a setting that feels like this city.",
  "  Per poster: concept (name), layout, visual_prompt (45-90 words describing ONE photorealistic scene: the exact product, setting, festival props, lighting, colour palette, camera angle; no text in the image), headline (max 5 punchy words), subline (max 9 words), cta (max 4 words, an action), badge (max 3 words).",
  "reel_text: for a 12-second vertical reel built from the 3 posters: hook (max 6 words on-screen, stops the scroll), line (max 8 words on-screen, the emotional or product payoff), cta (max 5 words on-screen), music_mood (max 6 words),",
  "  voiceover (the spoken script, 16-22 words, at most 11 seconds aloud: open with the hook, name the brand and its product, end with the call to action; written in the requested language and native script if it is Hindi, Marathi, Gujarati, Bengali, Tamil, Telugu, Kannada, Malayalam or a non-English world language, otherwise English; warm, natural, no hashtags or emojis),",
  "  voice (one of: Kore, Aoede, Leda, Puck, Charon, Fenrir, Zephyr, Orus: pick the voice that suits the brand, e.g. Aoede or Leda for warm family brands, Puck or Zephyr for youthful energy, Charon or Orus for premium/heritage),",
  "  music_prompt (35-60 words in English for an AI composer: genre, traditional instruments of this festival and region, tempo in BPM, mood and build, e.g. dhol, tasha and shehnai for a Maharashtrian Ganeshotsav; no vocals).",
  "instagram_posts: a 5-slide carousel telling one story; angles in order Hook, Story, Offer, Challenge, CTA; per slide: angle, headline (max 6 words), subline (max 9 words), caption (under 30 words, scroll-stopping, specific to the brand's products, no repeated openings, emojis welcome), hashtags (3-5: festival, brand and local tags).",
  "reel_script (hook_0_3s, scene_3_10s, cta_10_15s; visual, specific, brand-led).",
  "channel_plan (4-5 items: channel, percent_of_budget summing to 100, why).",
  "Headlines, sublines, CTAs and badges are in English unless the requested language is non-Indic and non-English, then in that language.",
  "Respect the festival's cultural and religious meaning; no mockery, no stereotypes; match local currency and context.",
].join(" ");

const REGEN_SYSTEM =
  "You are a festive marketing strategist for Indian and global brands. Return three fields: big_idea (max 20 words, fresh bold concept), tagline_en, tagline_regional (written natively in the requested language script). Respect the festival's cultural meaning, no religious mockery, no stereotypes, local market context.";

// Cascade: small model first, larger model only on failure. Override via env.
const SLM_MODEL = process.env.GEMINI_SMALL_MODEL || "gemini-3.8-flash-lite";
const LLM_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

const CampaignSchema = z.object({
  big_idea: z.string(),
  tagline_en: z.string(),
  tagline_regional: z.string(),
  instagram_posts: z.array(
    z.object({
      angle: z.string(),
      headline: z.string(),
      subline: z.string(),
      caption: z.string(),
      hashtags: z.string(),
    })
  ),
  reel_script: z.object({
    hook_0_3s: z.string(),
    scene_3_10s: z.string(),
    cta_10_15s: z.string(),
  }),
  channel_plan: z.array(
    z.object({ channel: z.string(), percent_of_budget: z.number(), why: z.string() })
  ),
  palette: z.object({ primary: z.string(), secondary: z.string(), light: z.string() }),
  reel_text: z.object({
    hook: z.string(),
    line: z.string(),
    cta: z.string(),
    music_mood: z.string(),
    voiceover: z.string(),
    voice: z.string(),
    music_prompt: z.string(),
  }),
  posters: z.array(
    z.object({
      concept: z.string(),
      layout: z.enum(["Bold Headline", "Ribbon Frame", "Sticker Pop", "Magazine Cover", "Split Panel", "Editorial"]),
      visual_prompt: z.string(),
      headline: z.string(),
      subline: z.string(),
      cta: z.string(),
      badge: z.string(),
    })
  ),
});

const RegenerateSchema = z.object({
  big_idea: z.string(),
  tagline_en: z.string(),
  tagline_regional: z.string(),
});

const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

/** Cheap quality gate: decides whether the SLM output is good enough to ship. */
function campaignOk(c: z.infer<typeof CampaignSchema>): boolean {
  const sum = c.channel_plan.reduce((a, x) => a + x.percent_of_budget, 0);
  return (
    c.instagram_posts.length === 5 &&
    c.instagram_posts.every(
      (p) => p.caption.trim() && words(p.caption) < 30 && p.headline.trim() && words(p.headline) <= 8
    ) &&
    new Set(c.instagram_posts.map((p) => p.angle.trim().toLowerCase())).size === 5 &&
    new Set(c.instagram_posts.map((p) => p.caption.trim().split(/\s+/)[0].toLowerCase())).size >= 4 &&
    words(c.reel_text.hook) >= 1 &&
    words(c.reel_text.hook) <= 8 &&
    words(c.reel_text.line) <= 10 &&
    words(c.reel_text.cta) <= 6 &&
    c.reel_text.voiceover.trim().length > 20 &&
    c.reel_text.voiceover.trim().length < 400 &&
    words(c.reel_text.music_prompt) >= 15 &&
    c.posters.length === 3 &&
    new Set(c.posters.map((p) => p.layout)).size === 3 &&
    c.posters.every(
      (p) =>
        words(p.visual_prompt) >= 30 &&
        words(p.visual_prompt) <= 140 &&
        words(p.headline) >= 1 &&
        words(p.headline) <= 6 &&
        words(p.cta) <= 5 &&
        !!p.cta.trim()
    ) &&
    [c.palette.primary, c.palette.secondary, c.palette.light].every((h) => /^#[0-9a-f]{6}$/i.test(h.trim())) &&
    c.channel_plan.length >= 4 &&
    c.channel_plan.length <= 5 &&
    Math.abs(sum - 100) <= 1 &&
    words(c.big_idea) <= 20 &&
    !!c.tagline_en.trim() &&
    !!c.tagline_regional.trim()
  );
}

function regenOk(c: z.infer<typeof RegenerateSchema>): boolean {
  return words(c.big_idea) <= 20 && !!c.tagline_en.trim() && !!c.tagline_regional.trim();
}

class GeminiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

async function callGemini(
  model: string,
  schema: z.ZodType,
  system: string,
  userPrompt: string,
  maxOutputTokens: number,
  temperature: number
): Promise<unknown> {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) throw new GeminiError("GEMINI_API_KEY is not configured on the server.", 401);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: z.toJSONSchema(schema),
          maxOutputTokens,
          temperature,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    }
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new GeminiError(`Gemini API error ${res.status}: ${detail.slice(0, 300)}`, res.status);
  }
  const data: any = await res.json();
  const cand = data?.candidates?.[0];
  if (!cand) throw new GeminiError("Gemini declined this brief. Try rewording it.");
  if (cand.finishReason === "MAX_TOKENS") throw new GeminiError("The response was cut off.");
  const text = cand.content?.parts?.map((p: any) => p.text ?? "").join("") ?? "";
  try {
    return JSON.parse(text);
  } catch {
    throw new GeminiError("Gemini returned an unexpected format.");
  }
}

/** SLM -> LLM cascade with validation. Auth/rate-limit errors never escalate. */
async function generateStructured<T extends z.ZodType>(
  schema: T,
  ok: (v: z.infer<T>) => boolean,
  system: string,
  userPrompt: string,
  maxOutputTokens: number
): Promise<z.infer<T>> {
  let lastErr: unknown;
  for (const [i, model] of [SLM_MODEL, LLM_MODEL].entries()) {
    try {
      const raw = await callGemini(model, schema, system, userPrompt, maxOutputTokens, i === 0 ? 0.9 : 0.7);
      const parsed = schema.safeParse(raw);
      if (parsed.success && ok(parsed.data)) return parsed.data;
      lastErr = new GeminiError("Gemini returned an unexpected format. Please try again.");
    } catch (err) {
      if (err instanceof GeminiError && (err.status === 401 || err.status === 402 || err.status === 403 || err.status === 429)) throw err;
      lastErr = err;
    }
  }
  throw lastErr;
}

// ---- response cache + in-flight de-dupe (per server instance) ----
const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX = 200;
const cache = new Map<string, { at: number; value: unknown }>();
const inflight = new Map<string, Promise<unknown>>();

async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value as T;
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;
  const p = fn()
    .then((v) => {
      if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
      cache.set(key, { at: Date.now(), value: v });
      return v;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

export function describeError(err: unknown, fallback: string): string {
  if (err instanceof GeminiError) {
    if (err.status === 401 || err.status === 403) return "The Gemini API key is missing or was rejected.";
    if (err.status === 402) return "The Gemini API credits for this project are used up. Top up billing in Google AI Studio, then try again.";
    if (err.status === 429) return "Rate limited by the Gemini API. Try again in a moment.";
    return err.message;
  }
  return err instanceof Error ? err.message : fallback;
}

export async function runGenerate(input: unknown): Promise<HandlerResult> {
  try {
    const {
      market = "India",
      region = "Pan-India",
      currencySymbol = "₹",
      currencyCode = "INR",
      locale = "en-IN",
      festival,
      brand,
      city,
      audience,
      budget,
      language,
      stylePreset,
      business,
    } = (input ?? {}) as Record<string, any>;
    if (!festival || !brand || !city || !audience || !budget || !language) {
      return { status: 400, body: { error: "Please fill in festival, brand name, city, target audience, budget, and language." } };
    }

    const formattedBudget = Number(budget).toLocaleString(String(locale) || "en-IN");
    const userPrompt = [
      `Market: ${String(market)}`,
      `Region / Country: ${String(region)}`,
      `Festival / Moment: ${String(festival)} ${new Date().getFullYear()} (use this year in any dated hashtag)`,
      `Brand: ${String(brand)}`,
      business ? `Business / what they sell: ${String(business).slice(0, 160)}` : "",
      `City: ${String(city)}`,
      `Target audience: ${String(audience)}`,
      `Budget: ${String(currencySymbol)}${formattedBudget} (${String(currencyCode)})`,
      `Preferred / Poster language: ${String(language)}`,
      `Creative seed: ${Math.floor(Math.random() * 1e6)}`,
    ]
      .filter(Boolean)
      .join("\n");

    const parsed = await cached(
      "gen:" + createHash("sha256").update(userPrompt).digest("hex"),
      () => generateStructured(CampaignSchema, campaignOk, SYSTEM_INSTRUCTION, userPrompt, 4096)
    );
    // Sign each visual prompt so /api/poster-image will only draw prompts we produced.
    const first = parsed.posters[0];
    const body = {
      ...parsed,
      posters: parsed.posters.map((p) => ({ ...p, token: signPrompt(p.visual_prompt) })),
      reel_text: {
        ...parsed.reel_text,
        voice_token: signPrompt(parsed.reel_text.voiceover),
        music_token: signPrompt(parsed.reel_text.music_prompt),
      },
      poster_prompt: first.visual_prompt,
      poster_headline: first.headline,
      poster_cta: first.cta,
      poster_badge: first.badge,
    };
    return { status: 200, body };
  } catch (err) {
    console.error("Gemini /api/generate error:", err);
    return { status: 500, body: { error: describeError(err, "Failed to generate campaign.") } };
  }
}

export async function runRegenerate(input: unknown): Promise<HandlerResult> {
  try {
    const {
      market = "India",
      region = "Pan-India",
      currencySymbol = "₹",
      currencyCode = "INR",
      locale = "en-IN",
      festival,
      brand,
      city,
      audience,
      budget,
      language,
      stylePreset,
      previousBigIdea,
      previousTaglineEn,
    } = (input ?? {}) as Record<string, any>;

    if (!festival || !brand || !city || !audience || !budget || !language) {
      return { status: 400, body: { error: "Missing campaign inputs for regeneration." } };
    }

    const formattedBudget = Number(budget).toLocaleString(String(locale) || "en-IN");
    const variationSeed = Math.floor(Math.random() * 2147483646) + 1;

    const userPrompt = [
      `Market: ${String(market)}`,
      `Region / Country: ${String(region)}`,
      `Festival / Moment: ${String(festival)}`,
      `Brand: ${String(brand)}`,
      `City: ${String(city)}`,
      `Target audience: ${String(audience)}`,
      `Budget: ${String(currencySymbol)}${formattedBudget} (${String(currencyCode)})`,
      `Preferred / Poster language: ${String(language)}`,
      stylePreset ? `Creative style preset: ${String(stylePreset)}` : "",
      "",
      "Generate a COMPLETELY FRESH, noticeably different creative angle for the campaign big_idea (max 20 words), tagline_en, and tagline_regional (written naturally in the requested language script).",
      previousBigIdea
        ? `Do NOT repeat or closely paraphrase this previous big idea: "${String(previousBigIdea)}"`
        : "",
      previousTaglineEn
        ? `Do NOT repeat this previous English tagline: "${String(previousTaglineEn)}"`
        : "",
      `Creative variation token: ${variationSeed}`,
    ]
      .filter(Boolean)
      .join("\n");

    const parsed = await generateStructured(RegenerateSchema, regenOk, REGEN_SYSTEM, userPrompt, 512);

    return { status: 200, body: parsed };
  } catch (err) {
    console.error("Gemini /api/regenerate error:", err);
    return { status: 500, body: { error: describeError(err, "Failed to regenerate big idea.") } };
  }
}
