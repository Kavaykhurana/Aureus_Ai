import { Router, Request, Response } from "express";
import { db } from "../db/index.js";

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
    db.prepare(`
      INSERT INTO watchlist (ticker, name, price, change_pct, confidence, signal, tone, alert_armed, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(sym, `${sym} Corp`, 100.0, 1.0, 65, "Neutral", "neutral", 1, now);
  }

  res.json({ success: true, ticker: sym, alertArmed: Boolean(nextState) });
});

export default router;
