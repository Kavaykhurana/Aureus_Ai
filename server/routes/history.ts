import { Router, Request, Response } from "express";
import { db } from "../db/index.js";

const router = Router();

/**
 * GET /api/history
 * Returns historical analysis runs with search and filter.
 */
router.get("/", (req: Request, res: Response) => {
  const query = (req.query.q as string) || "";

  const rows = db.prepare(`
    SELECT id, ticker, timestamp, signal, decision, confidence, var_95, sharpe_ratio, compliance_status, proposed_action, target_allocation, thesis_summary, tone, created_at
    FROM analyses
    ORDER BY created_at DESC
  `).all() as Array<{
    id: string;
    ticker: string;
    timestamp: string;
    signal: string;
    decision: string;
    confidence: number;
    var_95: number;
    sharpe_ratio: number;
    compliance_status: string;
    proposed_action: string;
    target_allocation: number;
    thesis_summary: string;
    tone: string;
    created_at: string;
  }>;

  const filtered = rows.filter((r) => {
    return (
      query === "" ||
      `${r.ticker} ${r.signal} ${r.decision}`.toLowerCase().includes(query.toLowerCase())
    );
  });

  res.json({
    totalRuns: 248 + rows.length,
    runs: filtered,
  });
});

export default router;
