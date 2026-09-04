import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

// Import Database initialization (auto-seeds on boot)
import "./db/index.js";

// Import API routes
import swarmRoutes from "./routes/swarm.js";
import portfolioRoutes from "./routes/portfolio.js";
import riskRoutes from "./routes/risk.js";
import auditRoutes from "./routes/audit.js";
import historyRoutes from "./routes/history.js";
import policiesRoutes from "./routes/policies.js";
import exceptionsRoutes from "./routes/exceptions.js";
import stockRoutes from "./routes/stock.js";
import watchlistRoutes from "./routes/watchlist.js";
import earningsRoutes from "./routes/earnings.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS & Security headers
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "nominal",
      version: "v2.4.18",
      platform: "Aureus AI Command Center",
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API endpoints
  app.use("/api/swarm", swarmRoutes);
  app.use("/api/portfolio", portfolioRoutes);
  app.use("/api/risk", riskRoutes);
  app.use("/api/audit", auditRoutes);
  app.use("/api/history", historyRoutes);
  app.use("/api/policies", policiesRoutes);
  app.use("/api/exceptions", exceptionsRoutes);
  app.use("/api/stock", stockRoutes);
  app.use("/api/watchlist", watchlistRoutes);
  app.use("/api/earnings", earningsRoutes);

  // Development vs Production serving
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    // In dev mode, attach Vite dev server middleware for instant HMR and compilation
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production mode, serve compiled static files from dist/public
    const staticPath = path.resolve(__dirname, "public");
    app.use(express.static(staticPath));

    app.get("*", (_req, res) => {
      res.sendFile(path.join(staticPath, "index.html"));
    });
  }

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  server.listen(port, "0.0.0.0", () => {
    console.log(`[Aureus AI] Server running on http://localhost:${port}/ (${isProd ? "production" : "development"})`);
  });
}

startServer().catch((err) => {
  console.error("[Aureus AI] Fatal server startup error:", err);
  process.exit(1);
});
