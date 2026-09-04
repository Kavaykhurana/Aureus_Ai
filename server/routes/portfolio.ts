import { Router, Request, Response } from "express";
import crypto from "node:crypto";
import { db } from "../db/index.js";

const router = Router();

/**
 * GET /api/portfolio
 * Returns overall portfolio value, cash, positions, concentration, and performance series.
 */
router.get("/", (_req: Request, res: Response) => {
  const portfolio = (db.prepare("SELECT * FROM portfolios WHERE id = 'main-portfolio'").get() as {
    id: string;
    name: string;
    total_value: number;
    cash: number;
    currency: string;
    updated_at: string;
  }) || {
    id: "main-portfolio",
    name: "Aureus Sovereign Alpha Fund",
    total_value: 708420.0,
    cash: 57382.02,
    currency: "USD",
    updated_at: new Date().toISOString(),
  };

  const holdings = db.prepare(`
    SELECT ticker, name, weight, shares, last_price, cost_basis, return_pct, sector, tone
    FROM holdings
    ORDER BY weight DESC
  `).all();

  // Find max concentration
  const maxWeight = holdings.length > 0 ? (holdings[0] as { weight: number; ticker: string }) : { weight: 0, ticker: "NONE" };

  const chartData = [
    { month: "Apr 01", portfolio: 100, benchmark: 100 },
    { month: "Apr 08", portfolio: 101.8, benchmark: 100.9 },
    { month: "Apr 15", portfolio: 101.2, benchmark: 101.8 },
    { month: "Apr 22", portfolio: 103.1, benchmark: 102.4 },
    { month: "Apr 29", portfolio: 102.8, benchmark: 103.2 },
    { month: "May 06", portfolio: 105.4, benchmark: 104.1 },
    { month: "May 13", portfolio: 104.9, benchmark: 104.7 },
    { month: "May 20", portfolio: 107.3, benchmark: 105.9 },
    { month: "May 27", portfolio: 108.4, benchmark: 106.8 },
    { month: "Jun 03", portfolio: 110.1, benchmark: 108.1 },
    { month: "Jun 10", portfolio: 109.5, benchmark: 108.8 },
    { month: "Jun 17", portfolio: 112.7, benchmark: 110.2 },
  ];

  res.json({
    totalValue: portfolio.total_value,
    cash: portfolio.cash,
    currency: portfolio.currency,
    pnlToday: 4832,
    pnlTodayPct: 0.68,
    quarterReturnPct: 12.7,
    alphaCapture: 2.5,
    concentrationPct: maxWeight.weight,
    concentrationTicker: maxWeight.ticker,
    holdings,
    chartData,
  });
});

/**
 * POST /api/portfolio/holdings
 * Add or adjust a position.
 */
router.post("/holdings", (req: Request, res: Response) => {
  const { ticker, name, weight, shares, lastPrice, costBasis, sector = "Technology", tone = "green" } = req.body;

  if (!ticker) {
    res.status(400).json({ error: "Ticker is required" });
    return;
  }

  const sym = ticker.toUpperCase();
  const now = new Date().toISOString();

  const existing = db.prepare("SELECT * FROM holdings WHERE ticker = ?").get() as { id: string } | undefined;

  if (existing) {
    db.prepare(`
      UPDATE holdings
      SET weight = ?, shares = ?, last_price = ?, cost_basis = ?, updated_at = ?
      WHERE ticker = ?
    `).run(Number(weight), Number(shares), Number(lastPrice), Number(costBasis), now, sym);
  } else {
    db.prepare(`
      INSERT INTO holdings (id, portfolio_id, ticker, name, weight, shares, last_price, cost_basis, return_pct, sector, tone, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      "main-portfolio",
      sym,
      name || `${sym} Corporation`,
      Number(weight) || 3.0,
      Number(shares) || 100,
      Number(lastPrice) || 100.0,
      Number(costBasis) || 100.0,
      0.0,
      sector,
      tone,
      now
    );
  }

  res.json({ success: true, ticker: sym });
});

export default router;
