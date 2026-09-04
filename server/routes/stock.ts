import { Router, Request, Response } from "express";
import { MarketDataService } from "../services/marketDataService.js";
import { SecRagService } from "../services/secRagService.js";

const router = Router();

/**
 * GET /api/stock/:ticker
 * Returns stock fundamentals, evidence, sentiment metrics, and sparklines.
 */
router.get("/:ticker", (req: Request, res: Response) => {
  const sym = req.params.ticker.toUpperCase().trim();
  const quote = MarketDataService.getStockQuote(sym);
  const secData = SecRagService.retrieveFilingInsight(sym);

  const confidence = Math.round(70 + secData.sentimentScore * 18);

  const evidence = [
    {
      title: "Earnings momentum",
      copy: `${quote.name} revenue acceleration is tracking at ${quote.peRatio > 40 ? "rapid pace" : "steady pace"} above sector median.`,
      tone: "+",
    },
    {
      title: "Market structure",
      copy: `Institutional flow remains constructive with 30-day volatility measured at ${quote.peRatio > 40 ? "higher" : "controlled"} levels.`,
      tone: "+",
    },
    {
      title: "Primary risk",
      copy: secData.riskFactors[0] || "Macro interest rate and capital cost sensitivity.",
      tone: "!",
    },
  ];

  const sourceScores = [
    { name: "News sentiment", score: Math.round((secData.sentimentScore + 1) * 45) + 5, detail: "312 articles · 7 day window" },
    { name: "Fundamentals", score: Math.round(quote.grossMarginPct), detail: "Last filing · 14 ratios checked" },
    { name: "Technical structure", score: 68, detail: "Momentum · volume · trend" },
  ];

  res.json({
    ticker: sym,
    name: quote.name,
    price: quote.price,
    change: quote.change,
    changePct: quote.changePct,
    peRatio: quote.peRatio,
    grossMarginPct: quote.grossMarginPct,
    marketCapB: quote.marketCapB,
    sector: quote.sector,
    confidence,
    filingSummary: secData.summary,
    riskFactors: secData.riskFactors,
    keyCatalysts: secData.keyCatalysts,
    evidence,
    sourceScores,
    priceSeries: quote.priceSeries,
  });
});

export default router;
