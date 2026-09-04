import { Router, Request, Response } from "express";

const router = Router();

const RISK_DIMENSIONS = [
  { dimension: "Technology", level: "High", value: "42.8%", note: "Elevated correlation across NVDA / MSFT", tone: "risk-high" },
  { dimension: "Single name", level: "Watch", value: "28.4%", note: "NVDA concentration above 25% policy guide", tone: "risk-watch" },
  { dimension: "Liquidity", level: "Low", value: "1.2%", note: "Median exit horizon under 2 sessions", tone: "risk-low" },
  { dimension: "Factor momentum", level: "Moderate", value: "64 / 100", note: "Momentum factor is crowded but improving", tone: "risk-moderate" },
  { dimension: "Counterparty", level: "Low", value: "0.4%", note: "No material counterparty concentration", tone: "risk-low" },
];

/**
 * GET /api/risk
 * Returns the portfolio risk matrix, VaR, health score, and risk dimensions.
 */
router.get("/", (_req: Request, res: Response) => {
  res.json({
    portfolioVaR: 2.4,
    vaRChangeToday: "+0.3%",
    openAlerts: 3,
    requiresReviewCount: 1,
    policyHealthScore: 94,
    stressLossPct: -8.2,
    dimensions: RISK_DIMENSIONS,
  });
});

/**
 * POST /api/risk/scenario
 * Runs a stress-test scenario.
 */
router.post("/scenario", (req: Request, res: Response) => {
  const { scenario = "Base case", threshold = 2.5 } = req.body;
  const cleanScenario = typeof scenario === "string" ? scenario.slice(0, 50) : "Base case";
  const cleanThreshold = Number.isFinite(Number(threshold)) ? Math.max(0.1, Math.min(50, Number(threshold))) : 2.5;

  let drawdown = 0;
  switch (cleanScenario) {
    case "Rate shock":
      drawdown = cleanThreshold + 2.8;
      break;
    case "Tech selloff":
      drawdown = cleanThreshold + 4.6;
      break;
    case "Liquidity event":
      drawdown = cleanThreshold + 3.1;
      break;
    default:
      drawdown = cleanThreshold + 1.2;
      break;
  }

  const opensCheckpoint = drawdown > cleanThreshold + 2.0;

  res.json({
    scenario: cleanScenario,
    projectedDrawdownPct: Number((-drawdown).toFixed(1)),
    threshold: cleanThreshold,
    opensCheckpoint,
    message: `${cleanScenario} stress test finished with a projected -${drawdown.toFixed(1)}% drawdown.`,
  });
});

export default router;
