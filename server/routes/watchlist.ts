import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { MarketDataService } from "../services/marketDataService.js";

const router = Router();

/**
 * GET /api/watchlist
 * Returns all monitored watchlist symbols.
 */
router.get("/", (_req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT ticker, name, price, change_pct, confidence, signal, tone, alert_armed, updated_at
    FROM watchlist
    ORDER BY confidence DESC
  `).all() as Array<{
    ticker: string;
    name: string;
    price: number;
    change_pct: number;
    confidence: number;
    signal: string;
    tone: string;
    alert_armed: number;
    updated_at: string;
  }>;

  const bullishCount = rows.filter((r) => r.confidence >= 70).length;
  const avgConfidence = Math.round(
    rows.reduce((sum, r) => sum + r.confidence, 0) / (rows.length || 1)
  );
  const activeAlerts = rows.filter((r) => r.alert_armed === 1).length;

  res.json({
    bullishCount,
    avgConfidence,
    activeAlerts,
    netMovePct: 1.8,
    symbols: rows.map((r) => ({
      ...r,
      alertArmed: Boolean(r.alert_armed),
    })),
  });
});

/**
 * POST /api/watchlist/add
 * Explicitly adds a new symbol to the watchlist with market metrics.
 */
router.post("/add", (req: Request, res: Response) => {
  const { ticker, name } = req.body;
  if (!ticker || typeof ticker !== "string") {
    res.status(400).json({ error: "Valid ticker required" });
    return;
  }

  const sym = ticker.toUpperCase().replace(/[^A-Z0-9.-]/g, "").slice(0, 10);
  if (!sym) {
    res.status(400).json({ error: "Valid ticker symbol required" });
    return;
  }

  const quote = MarketDataService.getStockQuote(sym);
  const companyName = name && typeof name === "string" && name.trim() ? name.trim() : quote.name;
  const confidence = 65 + Math.floor(Math.random() * 25);
  const signal = confidence >= 80 ? "Bullish" : confidence >= 70 ? "Constructive" : "Neutral";
  const tone = confidence >= 75 ? "green" : confidence >= 68 ? "gold" : "neutral";
  const now = new Date().toISOString();

  const existing = db.prepare("SELECT alert_armed FROM watchlist WHERE ticker = ?").get(sym) as { alert_armed: number } | undefined;

  if (existing) {
    db.prepare(`
      UPDATE watchlist
      SET name = ?, price = ?, change_pct = ?, updated_at = ?
      WHERE ticker = ?
    `).run(companyName, quote.price, quote.changePct, now, sym);
  } else {
    db.prepare(`
      INSERT INTO watchlist (ticker, name, price, change_pct, confidence, signal, tone, alert_armed, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(sym, companyName, quote.price, quote.changePct, confidence, signal, tone, now);
  }

  res.json({
    success: true,
    symbol: {
      ticker: sym,
      name: companyName,
      price: quote.price,
      change_pct: quote.changePct,
      confidence,
      signal,
      tone,
      alertArmed: true,
    },
  });
});

/**
 * POST /api/watchlist/toggle
 * Toggle alert for a ticker.
 */
router.post("/toggle", (req: Request, res: Response) => {
  const { ticker } = req.body;
  if (!ticker || typeof ticker !== "string") {
    res.status(400).json({ error: "Valid ticker required" });
    return;
  }

  const sym = ticker.toUpperCase().replace(/[^A-Z0-9.-]/g, "").slice(0, 10);
  if (!sym) {
    res.status(400).json({ error: "Valid ticker symbol required" });
    return;
  }

  const existing = db.prepare("SELECT alert_armed FROM watchlist WHERE ticker = ?").get(sym) as { alert_armed: number } | undefined;

  const nextState = existing ? (existing.alert_armed === 1 ? 0 : 1) : 1;
  const now = new Date().toISOString();

  if (existing) {
    db.prepare(`
      UPDATE watchlist
      SET alert_armed = ?, updated_at = ?
      WHERE ticker = ?
    `).run(nextState, now, sym);
  } else {
    const quote = MarketDataService.getStockQuote(sym);
    const confidence = 72;
    db.prepare(`
      INSERT INTO watchlist (ticker, name, price, change_pct, confidence, signal, tone, alert_armed, updated_at)
      VALUES (?, ?, ?, ?, ?, 'Constructive', 'green', 1, ?)
    `).run(sym, quote.name, quote.price, quote.changePct, confidence, now);
  }

  res.json({ success: true, ticker: sym, alertArmed: Boolean(nextState) });
});

export default router;
