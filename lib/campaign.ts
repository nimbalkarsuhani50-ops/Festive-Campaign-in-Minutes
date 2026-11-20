import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

/**
 * Claude-backed campaign generation, shared by the local Express server
 * (server.ts) and the Vercel serverless functions (api/*.ts).
 */

export interface HandlerResult {
  status: number;
  body: unknown;
}

const SYSTEM_INSTRUCTION =
  "You are a festive marketing strategist for Indian and global brands. Input: market, region, festival, brand, city, audience, budget with local currency, preferred language, and optional style preset. Return these fields: big_idea (max 20 words), tagline_en (crisp English tagline), tagline_regional (natural, idiomatic festive tagline written in the requested language and its native script, e.g. Devanagari, Tamil, Telugu, Bengali, Kannada, Malayalam, Gujarati, Gurmukhi, Arabic, Simplified Chinese, Japanese, Spanish, French, German, Portuguese, etc.; if English is requested, provide an alternative punchy English tagline), instagram_posts (list of 3: caption, hashtags), reel_script (hook_0_3s, scene_3_10s, cta_10_15s), channel_plan (list of 4-5 items: channel, percent_of_budget summing to 100, why), poster_prompt (a rich visual poster image description with NO text in it). Respect the festival's cultural meaning, no religious mockery, no stereotypes, and match the selected market's local currency and cultural context. Every caption under 30 words.";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

let anthropic: Anthropic | null = null;
function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    throw new Error("ANTHROPIC_API_KEY is not configured on the server.");
  }
  anthropic ??= new Anthropic();
  return anthropic;
}

const CampaignSchema = z.object({
  big_idea: z.string(),
  tagline_en: z.string(),
  tagline_regional: z.string(),
  instagram_posts: z.array(z.object({ caption: z.string(), hashtags: z.string() })),
  reel_script: z.object({
    hook_0_3s: z.string(),
    scene_3_10s: z.string(),
    cta_10_15s: z.string(),
  }),
  channel_plan: z.array(
    z.object({ channel: z.string(), percent_of_budget: z.number(), why: z.string() })
  ),
  poster_prompt: z.string(),
});

const RegenerateSchema = z.object({
  big_idea: z.string(),
  tagline_en: z.string(),
  tagline_regional: z.string(),
});

/**
 * One structured-output call to Claude. Low effort keeps the stage demo fast;
 * server-side fallbacks retry on another model if the request is declined.
 */
async function generateStructured<T extends z.ZodType>(
  schema: T,
  system: string,
  userPrompt: string
): Promise<z.infer<T>> {
  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(schema) },
    system,
    messages: [{ role: "user", content: userPrompt }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Claude declined this brief. Try rewording it.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("The response was cut off. Please try again.");
  }
  if (!response.parsed_output) {
    throw new Error("Claude returned an unexpected format. Please try again.");
  }
  return response.parsed_output as z.infer<T>;
}

export function describeError(err: unknown, fallback: string): string {
  if (err instanceof Anthropic.AuthenticationError) return "The Anthropic API key was rejected.";
  if (err instanceof Anthropic.RateLimitError) return "Rate limited by the Anthropic API. Try again in a moment.";
  if (err instanceof Anthropic.APIError) return `Anthropic API error ${err.status ?? ""}: ${err.message}`.trim();
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
    } = (input ?? {}) as Record<string, any>;
    if (!festival || !brand || !city || !audience || !budget || !language) {
      return { status: 400, body: { error: "Please fill in festival, brand name, city, target audience, budget, and language." } };
    }

    const formattedBudget = Number(budget).toLocaleString(String(locale) || "en-IN");
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
    ]
      .filter(Boolean)
      .join("\n");

    const parsed = await generateStructured(CampaignSchema, SYSTEM_INSTRUCTION, userPrompt);
    return { status: 200, body: parsed };
  } catch (err) {
    console.error("Claude /api/generate error:", err);
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

    const parsed = await generateStructured(
      RegenerateSchema,
      "You are a festive marketing strategist for Indian and global brands. Return three fields: big_idea (max 20 words, fresh bold concept), tagline_en, tagline_regional (written natively in the requested language script). Respect the festival's cultural meaning, no religious mockery, no stereotypes, local market context.",
      userPrompt
    );

    return { status: 200, body: parsed };
  } catch (err) {
    console.error("Claude /api/regenerate error:", err);
    return { status: 500, body: { error: describeError(err, "Failed to regenerate big idea.") } };
  }
}
