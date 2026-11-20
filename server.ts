import "dotenv/config";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const PORT = Number(process.env.PORT) || 3000;

const SYSTEM_INSTRUCTION =
  "You are a festive marketing strategist for Indian and global brands. Input: market, region, festival, brand, city, audience, budget with local currency, preferred language, and optional style preset. Return ONLY valid JSON: big_idea (max 20 words), tagline_en (crisp English tagline), tagline_regional (natural, idiomatic festive tagline written in the requested language and its native script, e.g. Devanagari, Tamil, Telugu, Bengali, Kannada, Malayalam, Gujarati, Gurmukhi, Arabic, Simplified Chinese, Japanese, Spanish, French, German, Portuguese, etc.; if English is requested, provide an alternative punchy English tagline), instagram_posts (list of 3: caption, hashtags), reel_script (hook_0_3s, scene_3_10s, cta_10_15s), channel_plan (list of 4-5 items: channel, percent_of_budget summing to 100, why), poster_prompt (a rich visual poster image description with NO text in it). Respect the festival's cultural meaning, no religious mockery, no stereotypes, and match the selected market's local currency and cultural context. Every caption under 30 words.";

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API key is not configured on the server.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function parseJsonResponse<T>(rawText: string | undefined): T {
  const cleaned = (rawText ?? "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

const app = express();
app.use(express.json({ limit: "1mb" }));

app.post("/api/generate", async (req, res) => {
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
    } = req.body ?? {};
    if (!festival || !brand || !city || !audience || !budget || !language) {
      res.status(400).json({
        error: "Please fill in festival, brand name, city, target audience, budget, and language.",
      });
      return;
    }

    const ai = getGeminiClient();
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

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            big_idea: { type: Type.STRING },
            tagline_en: { type: Type.STRING },
            tagline_regional: { type: Type.STRING },
            instagram_posts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  caption: { type: Type.STRING },
                  hashtags: { type: Type.STRING },
                },
                required: ["caption", "hashtags"],
              },
            },
            reel_script: {
              type: Type.OBJECT,
              properties: {
                hook_0_3s: { type: Type.STRING },
                scene_3_10s: { type: Type.STRING },
                cta_10_15s: { type: Type.STRING },
              },
              required: ["hook_0_3s", "scene_3_10s", "cta_10_15s"],
            },
            channel_plan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  channel: { type: Type.STRING },
                  percent_of_budget: { type: Type.NUMBER },
                  why: { type: Type.STRING },
                },
                required: ["channel", "percent_of_budget", "why"],
              },
            },
            poster_prompt: { type: Type.STRING },
          },
          required: [
            "big_idea",
            "tagline_en",
            "tagline_regional",
            "instagram_posts",
            "reel_script",
            "channel_plan",
            "poster_prompt",
          ],
        },
      },
    });

    const parsed = parseJsonResponse<Record<string, unknown>>(response.text);
    res.json(parsed);
  } catch (err) {
    console.error("Gemini /api/generate error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to generate campaign.";
    res.status(500).json({ error: message });
  }
});

app.post("/api/regenerate", async (req, res) => {
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
    } = req.body ?? {};

    if (!festival || !brand || !city || !audience || !budget || !language) {
      res.status(400).json({
        error: "Missing campaign inputs for regeneration.",
      });
      return;
    }

    const ai = getGeminiClient();
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

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: userPrompt,
      config: {
        systemInstruction:
          "You are a festive marketing strategist for Indian and global brands. Return ONLY valid JSON with three fields: big_idea (max 20 words, fresh bold concept), tagline_en, tagline_regional (written natively in the requested language script). Respect the festival's cultural meaning, no religious mockery, no stereotypes, local market context.",
        responseMimeType: "application/json",
        seed: variationSeed,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            big_idea: { type: Type.STRING },
            tagline_en: { type: Type.STRING },
            tagline_regional: { type: Type.STRING },
          },
          required: ["big_idea", "tagline_en", "tagline_regional"],
        },
      },
    });

    const parsed = parseJsonResponse<{
      big_idea: string;
      tagline_en: string;
      tagline_regional: string;
    }>(response.text);

    res.json(parsed);
  } catch (err) {
    console.error("Gemini /api/regenerate error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to regenerate big idea.";
    res.status(500).json({ error: message });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  const distDir = path.resolve(process.cwd(), "dist");
  const useViteDev = !isProd || !fs.existsSync(distDir);

  let viteServer: { middlewares: express.RequestHandler; close: () => Promise<void> } | null =
    null;

  const viteReady = useViteDev
    ? (async () => {
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({
          server: {
            middlewareMode: true,
            hmr: false,
          },
          appType: "spa",
        });
        viteServer = vite;
        return vite;
      })()
    : Promise.resolve(null);

  if (useViteDev) {
    app.use(async (req, res, next) => {
      try {
        const vite = await viteReady;
        if (vite) {
          vite.middlewares(req, res, next);
        } else {
          next();
        }
      } catch (err) {
        next(err);
      }
    });
  } else {
    app.use(express.static(distDir));
    app.get("/{*splat}", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Festive Campaign Board server running on http://0.0.0.0:${PORT}`);
  });

  const shutdown = async () => {
    server.close();
    if (viteServer) {
      await viteServer.close().catch(() => {});
    }
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  viteReady.catch((err) => {
    console.error("Failed to initialize Vite dev middleware:", err);
  });
}

startServer();

