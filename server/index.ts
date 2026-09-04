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
  const isProd = process.env.NODE_ENV === "production";

  // Disable server technology fingerprinting
  app.disable("x-powered-by");

  // Trust proxy for correct client IP resolution behind reverse proxies (Render, Cloudflare)
  app.set("trust proxy", 1);

  // OWASP Recommended Security Headers
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-XSS-Protection", "0");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (isProd) {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    // Content-Security-Policy: restrict resource loading to same-origin & trusted CDNs
    res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",        // unsafe-inline needed for Vite HMR in dev
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; ")
    );
    next();
  });

  // CORS Configuration — wildcard only permitted in development
  const allowedOrigin = process.env.CORS_ORIGIN || (isProd ? "https://aureus-ai-command-center.onrender.com" : "*");
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigin === "*" || origin === allowedOrigin) {
      res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Vary", "Origin");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Body parsers with payload size limits to prevent DoS
  app.use(express.json({ limit: "500kb" }));
  app.use(express.urlencoded({ extended: true, limit: "500kb" }));

  // In-memory rate limiting for /api endpoints (200 req / minute per IP)
  const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  app.use("/api", (req, res, next) => {
    if (req.path === "/health") return next();

    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 200;

    let record = rateLimitMap.get(ip);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      rateLimitMap.set(ip, record);
    } else {
      record.count++;
      if (record.count > maxRequests) {
        const retryAfter = Math.ceil((record.resetTime - now) / 1000);
        res.setHeader("Retry-After", String(retryAfter));
        res.status(429).json({
          error: "Too many requests. Please try again shortly.",
          retryAfterSeconds: retryAfter,
        });
        return;
      }
    }
    next();
  });

  // Clean memory cleanup for rate limiting map every 10 minutes
  setInterval(() => {
    const now = Date.now();
    rateLimitMap.forEach((record, ip) => {
      if (now > record.resetTime) rateLimitMap.delete(ip);
    });
  }, 10 * 60 * 1000).unref();

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

  // Catch-all 404 for unhandled API endpoints
  app.all("/api/*", (_req, res) => {
    res.status(404).json({ error: "Endpoint not found", status: 404 });
  });

  // Development vs Production serving
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

  // Centralized Error Handling Middleware (prevents leaking internal stack traces)
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[Aureus AI Server Error]", err);
    res.status(err.status || 500).json({
      error: isProd ? "Internal server error" : (err.message || "An unexpected error occurred"),
      status: "error",
    });
  });

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  server.listen(port, "0.0.0.0", () => {
    console.log(`[Aureus AI] Server running on http://localhost:${port}/ (${isProd ? "production" : "development"})`);
  });
}

startServer().catch((err) => {
  console.error("[Aureus AI] Fatal server startup error:", err);
  process.exit(1);
});
