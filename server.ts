import "dotenv/config";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { runGenerate, runRegenerate } from "./lib/campaign.js";

const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json({ limit: "1mb" }));

app.post("/api/generate", async (req, res) => {
  const result = await runGenerate(req.body);
  res.status(result.status).json(result.body);
});

app.post("/api/regenerate", async (req, res) => {
  const result = await runRegenerate(req.body);
  res.status(result.status).json(result.body);
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

