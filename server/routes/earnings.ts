import { Router, Request, Response } from "express";
import { db } from "../db/index.js";

const router = Router();

/**
 * GET /api/earnings
 * Returns upcoming earnings catalysts and quiet-period schedules.
 */
router.get("/", (_req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT id, date_str, ticker, title, timing, impact, move_str, tone, alert_armed, updated_at
    FROM catalysts
    ORDER BY id ASC
  `).all() as Array<{
    id: string;
    date_str: string;
    ticker: string;
    title: string;
    timing: string;
    impact: string;
    move_str: string;
    tone: string;
    alert_armed: number;
    updated_at: string;
  }>;

  const highImpactCount = rows.filter((r) => r.impact === "High").length;
  const trackedCount = rows.filter((r) => r.alert_armed === 1).length;

  // Derive next catalyst dynamically from the first entry
  const next = rows[0];
  const nextCatalyst = next ? "01 day" : "—";
  const nextCatalystName = next ? `${next.ticker} ${next.title.split(" ").slice(0, 2).join(" ")}` : "No upcoming events";

  res.json({
    nextCatalyst,
    nextCatalystName,
    highImpactCount,
    trackedCount,
    lastRefresh: "2m",
    catalysts: rows.map((r) => ({
      ...r,
      alertArmed: Boolean(r.alert_armed),
    })),
  });
});


/**
 * POST /api/earnings/toggle
 * Toggle earnings alert for a catalyst.
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

  const existing = db.prepare("SELECT alert_armed FROM catalysts WHERE ticker = ?").get(sym) as { alert_armed: number } | undefined;

  const nextState = existing ? (existing.alert_armed === 1 ? 0 : 1) : 1;
  const now = new Date().toISOString();

  if (existing) {
    db.prepare(`
      UPDATE catalysts
      SET alert_armed = ?, updated_at = ?
      WHERE ticker = ?
    `).run(nextState, now, sym);
  }

  res.json({ success: true, ticker: sym, alertArmed: Boolean(nextState) });
});

/**
 * POST /api/earnings/add
 * Adds a new custom catalyst to the event radar.
 */
router.post("/add", (req: Request, res: Response) => {
  const { ticker, title, date_str, timing = "Post-market", impact = "High", move_str = "±6.5%" } = req.body;
  if (!ticker || !title || !date_str) {
    res.status(400).json({ error: "ticker, title, and date_str are required" });
    return;
  }
  const sym = String(ticker).toUpperCase().replace(/[^A-Z0-9.-]/g, "").slice(0, 10);
  const id = `cat-${sym.toLowerCase()}-${Date.now().toString().slice(-4)}`;
  const tone = impact === "High" ? "orange" : impact === "Medium" ? "gold" : "green";
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO catalysts (id, date_str, ticker, title, timing, impact, move_str, tone, alert_armed, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(id, String(date_str).slice(0, 20), sym, String(title).slice(0, 100), String(timing).slice(0, 30), String(impact), String(move_str), tone, now);

  res.json({
    success: true,
    catalyst: {
      id,
      date_str,
      ticker: sym,
      title,
      timing,
      impact,
      move_str,
      tone,
      alertArmed: true,
    },
  });
});

export default router;
