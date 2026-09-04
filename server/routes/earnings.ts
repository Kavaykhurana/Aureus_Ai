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

  res.json({
    nextCatalyst: "01 day",
    nextCatalystName: "NVDA earnings",
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
  if (!ticker) {
    res.status(400).json({ error: "Ticker required" });
    return;
  }

  const sym = ticker.toUpperCase();
  const existing = db.prepare("SELECT alert_armed FROM catalysts WHERE ticker = ?").get() as { alert_armed: number } | undefined;

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

export default router;
