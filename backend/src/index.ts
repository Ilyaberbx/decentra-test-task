import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import "dotenv/config";
import { rateLimiter } from "hono-rate-limiter";
import cards from "./routes/cards.js";
import sync from "./routes/sync.js";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

async function main() {
  const app = new Hono();

  const limiter = rateLimiter({
    windowMs: WINDOW_MS,
    limit: 100,
    standardHeaders: "draft-6",
    keyGenerator: (c) => c.req.header("cf-connecting-ip") ?? "",
  });

  app.use("*", logger());
  app.use("*", limiter);

  app.get("/health", (context) => {
    return context.json({
      status: "healthy",
      service: "Cards API",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });
  app.route("/api/cards", cards);
  app.route("/api/sync", sync);

  const port = parseInt(process.env.API_PORT!, 10);

  console.log(`Starting server on port ${port}`);

  serve({
    fetch: app.fetch,
    port: port,
  });

  console.log(`Server is running on http://localhost:${port}`);
  console.log("Press Ctrl+C to stop");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
