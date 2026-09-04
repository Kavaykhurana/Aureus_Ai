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
    holdings: (holdings as Array<{ ticker: string; name: string; weight: number; shares: number; last_price: number; cost_basis: number; return_pct: number; sector: string; tone: string }>).map((h) => ({
      ...h,
      return_pct: h.cost_basis > 0
        ? Number((((h.last_price - h.cost_basis) / h.cost_basis) * 100).toFixed(1))
        : h.return_pct,
    })),
    chartData,
  });
});

/**
 * POST /api/portfolio/holdings
 * Add or adjust a position.
 */
router.post("/holdings", (req: Request, res: Response) => {
  const { ticker, name, weight, shares, lastPrice, costBasis, sector = "Technology", tone = "green" } = req.body;

  if (!ticker || typeof ticker !== "string") {
    res.status(400).json({ error: "Ticker string is required" });
    return;
  }

  const sym = ticker.toUpperCase().replace(/[^A-Z0-9.-]/g, "").slice(0, 10);
  if (!sym) {
    res.status(400).json({ error: "Valid ticker symbol is required" });
    return;
  }

  const cleanWeight = Number.isFinite(Number(weight)) ? Math.max(0, Number(weight)) : 3.0;
  const cleanShares = Number.isFinite(Number(shares)) ? Math.max(0, Math.round(Number(shares))) : 100;
  const cleanLastPrice = Number.isFinite(Number(lastPrice)) ? Math.max(0, Number(lastPrice)) : 100.0;
  const cleanCostBasis = Number.isFinite(Number(costBasis)) ? Math.max(0, Number(costBasis)) : 100.0;
  const cleanName = typeof name === "string" && name.trim() ? name.trim().slice(0, 80) : `${sym} Corporation`;
  const cleanSector = typeof sector === "string" ? sector.slice(0, 40) : "Technology";
  const cleanTone = typeof tone === "string" ? tone.slice(0, 20) : "green";

  const now = new Date().toISOString();
  const existing = db.prepare("SELECT * FROM holdings WHERE ticker = ?").get(sym) as { id: string } | undefined;

  if (existing) {
    db.prepare(`
      UPDATE holdings
      SET weight = ?, shares = ?, last_price = ?, cost_basis = ?, updated_at = ?
      WHERE ticker = ?
    `).run(cleanWeight, cleanShares, cleanLastPrice, cleanCostBasis, now, sym);
  } else {
    db.prepare(`
      INSERT INTO holdings (id, portfolio_id, ticker, name, weight, shares, last_price, cost_basis, return_pct, sector, tone, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      "main-portfolio",
      sym,
      cleanName,
      cleanWeight,
      cleanShares,
      cleanLastPrice,
      cleanCostBasis,
      0.0,
      cleanSector,
      cleanTone,
      now
    );
  }

  res.json({ success: true, ticker: sym });
});

export default router;
