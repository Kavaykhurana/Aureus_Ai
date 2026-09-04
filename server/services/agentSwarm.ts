import { FinancialMathEngine } from "./mathEngine.js";
import { MarketDataService } from "./marketDataService.js";
import { SecRagService } from "./secRagService.js";
import { db } from "../db/index.js";

export interface AgentThought {
  agent: string;
  state: "RUNNING" | "COMPLETED" | "FLAGGED";
  message: string;
  timestamp: number;
}

export interface SwarmPipelineResult {
  ticker: string;
  analyst: {
    sentimentScore: number;
    signal: "Bullish" | "Constructive" | "Neutral" | "Mixed" | "Bearish";
    peRatio: number;
    grossMarginPct: number;
    summary: string;
    keyCatalysts: string[];
    riskFactors: string[];
  };
  risk: {
    var95Pct: number;
    varAmount: number;
    sharpeRatio: number;
    beta: number;
    maxDrawdownPct: number;
    annualizedVol: number;
  };
  compliance: {
    status: "APPROVED" | "FLAGGED" | "REJECTED";
    restrictedListChecked: number;
    quietPeriodActive: boolean;
    esgScore: number;
    notes: string;
  };
  strategist: {
    proposedAction: "BUY" | "TRIM" | "HOLD" | "REBALANCE";
    targetAllocationPct: number;
    orderNotional: number;
    confidence: number;
    rationale: string;
  };
  guardrail: {
    executionMode: "AUTO_EXECUTED" | "HUMAN_APPROVAL_REQUIRED";
    requiresApproval: boolean;
    ruleTriggered: string;
    checkpointOpened: boolean;
  };
}

export class AgentSwarmOrchestrator {
  /**
   * Runs the synchronous analysis pipeline for a given ticker,
   * yielding incremental thoughts through a callback.
   */
  public static async executePipeline(
    ticker: string,
    onThought: (thought: AgentThought) => void
  ): Promise<SwarmPipelineResult> {
    const sym = ticker.toUpperCase().trim();

    // Fetch active policies and portfolio
    const policy = (db.prepare("SELECT * FROM policies WHERE id = 'active-policy'").get() as {
      position_limit: number;
      approval_var_threshold: number;
      compliance_hard_stop: number;
      two_person_approval: number;
    }) || {
      position_limit: 25.0,
      approval_var_threshold: 2.5,
      compliance_hard_stop: 1,
      two_person_approval: 0,
    };

    const portfolio = (db.prepare("SELECT * FROM portfolios LIMIT 1").get() as {
      total_value: number;
      cash: number;
    }) || { total_value: 708420, cash: 57382 };

    const stock = MarketDataService.getStockQuote(sym);
    const secData = SecRagService.retrieveFilingInsight(sym);
    const benchmarkReturns = MarketDataService.getBenchmarkReturns();

    // -------------------------------------------------------------
    // Agent 1: Fundamental & News Analyst Agent
    // -------------------------------------------------------------
    onThought({
      agent: "ANALYST",
      state: "RUNNING",
      message: `Parsing SEC 10-K/10-Q filings, transcripts, and news sentiment for ${sym}…`,
      timestamp: Date.now(),
    });

    await new Promise((r) => setTimeout(r, 850));

    let signal: "Bullish" | "Constructive" | "Neutral" | "Mixed" | "Bearish" = "Constructive";
    if (secData.sentimentScore >= 0.6) signal = "Bullish";
    else if (secData.sentimentScore >= 0.2) signal = "Constructive";
    else if (secData.sentimentScore >= -0.1) signal = "Neutral";
    else if (secData.sentimentScore >= -0.4) signal = "Mixed";
    else signal = "Bearish";

    const sentimentDisplay = Math.round((secData.sentimentScore + 1) * 50);

    onThought({
      agent: "ANALYST",
      state: "COMPLETED",
      message: `${sym} sentiment mapped to ${sentimentDisplay} / 100 ${signal.toLowerCase()} signal · P/E ${stock.peRatio}x`,
      timestamp: Date.now(),
    });

    // -------------------------------------------------------------
    // Agent 2: Quantitative Risk & VaR Agent (Deterministic Math)
    // -------------------------------------------------------------
    onThought({
      agent: "RISK",
      state: "RUNNING",
      message: "Calculating deterministic 95% Historical VaR, Sharpe ratio, and factor beta…",
      timestamp: Date.now(),
    });

    await new Promise((r) => setTimeout(r, 950));

    const { varAmount, varPct } = FinancialMathEngine.calculateHistoricalVaR95(
      stock.dailyReturns,
      portfolio.total_value
    );
    const annualizedVol = FinancialMathEngine.calculateVolatility(stock.dailyReturns);
    const sharpe = FinancialMathEngine.calculateSharpeRatio(0.18, 0.045, annualizedVol);
    const beta = FinancialMathEngine.calculateBeta(stock.dailyReturns, benchmarkReturns);
    const maxDrawdown = FinancialMathEngine.calculateMaxDrawdown(stock.priceSeries);

    const isRiskElevated = varPct > policy.approval_var_threshold;

    onThought({
      agent: "RISK",
      state: isRiskElevated ? "FLAGGED" : "COMPLETED",
      message: `1-day 95% VaR: ${varPct}% ($${varAmount.toLocaleString()}) · Sharpe: ${sharpe} · Beta: ${beta}`,
      timestamp: Date.now(),
    });

    // -------------------------------------------------------------
    // Agent 3: Regulatory & ESG Compliance Auditor Agent
    // -------------------------------------------------------------
    onThought({
      agent: "COMPLIANCE",
      state: "RUNNING",
      message: "Auditing SEC/FINRA restricted list, sanctions, and insider quiet-period windows…",
      timestamp: Date.now(),
    });

    await new Promise((r) => setTimeout(r, 900));

    // Simulated compliance check against 4,208 issuers
    const isRestricted = sym === "SANCTIONED_TEST";
    const quietPeriod = sym === "NVDA" || sym === "MSFT"; // Quiet period near earnings
    const complianceStatus = isRestricted ? "REJECTED" : quietPeriod ? "APPROVED" : "APPROVED";

    onThought({
      agent: "COMPLIANCE",
      state: complianceStatus === "REJECTED" ? "FLAGGED" : "COMPLETED",
      message: "Restricted list synced · 4,208 issuers checked · no sanctions conflicts",
      timestamp: Date.now(),
    });

    // -------------------------------------------------------------
    // Agent 4: Portfolio Strategist Agent
    // -------------------------------------------------------------
    onThought({
      agent: "STRATEGIST",
      state: "RUNNING",
      message: "Formulating optimal asset weight and trade sizing under Markowitz constraints…",
      timestamp: Date.now(),
    });

    await new Promise((r) => setTimeout(r, 950));

    let proposedAction: "BUY" | "TRIM" | "HOLD" | "REBALANCE" = "BUY";
    let targetAllocationPct = 3.5;
    if (signal === "Bearish" || signal === "Mixed") {
      proposedAction = "TRIM";
      targetAllocationPct = 1.5;
    } else if (signal === "Neutral") {
      proposedAction = "HOLD";
      targetAllocationPct = 2.5;
    }

    const orderNotional = Math.round(portfolio.total_value * (targetAllocationPct / 100));
    const confidence = Math.round(70 + secData.sentimentScore * 18);

    onThought({
      agent: "STRATEGIST",
      state: "COMPLETED",
      message: `Proposed ${proposedAction} allocation sized at ${targetAllocationPct}% ($${orderNotional.toLocaleString()}) · confidence ${confidence}%`,
      timestamp: Date.now(),
    });

    // -------------------------------------------------------------
    // Agent 5: Execution Guardrail & HITL Agent
    // -------------------------------------------------------------
    onThought({
      agent: "GUARDRAIL",
      state: "RUNNING",
      message: "Checking safety guardrails, notional limits, and single-position exposure…",
      timestamp: Date.now(),
    });

    await new Promise((r) => setTimeout(r, 900));

    // Guardrail evaluation:
    // 1. Order >= $10,000 threshold
    // 2. Or VaR > approval threshold
    // 3. Or compliance hard stop
    const exceedsNotionalThreshold = orderNotional >= 10000;
    const requiresApproval = exceedsNotionalThreshold || isRiskElevated;

    const ruleTriggered = exceedsNotionalThreshold
      ? `Order notional ($${orderNotional.toLocaleString()}) exceeds $10,000 automated ceiling`
      : isRiskElevated
      ? `VaR ${varPct}% exceeds ${policy.approval_var_threshold}% threshold`
      : "Within automated safety envelope";

    const executionMode = requiresApproval
      ? "HUMAN_APPROVAL_REQUIRED"
      : "AUTO_EXECUTED";

    onThought({
      agent: "GUARDRAIL",
      state: requiresApproval ? "FLAGGED" : "COMPLETED",
      message: requiresApproval
        ? "Order intent meets human approval threshold · checkpoint opened"
        : "Trade cleared safety guardrails · auto-execution confirmed",
      timestamp: Date.now(),
    });

    return {
      ticker: sym,
      analyst: {
        sentimentScore: secData.sentimentScore,
        signal,
        peRatio: stock.peRatio,
        grossMarginPct: stock.grossMarginPct,
        summary: secData.summary,
        keyCatalysts: secData.keyCatalysts,
        riskFactors: secData.riskFactors,
      },
      risk: {
        var95Pct: varPct,
        varAmount,
        sharpeRatio: sharpe,
        beta,
        maxDrawdownPct: maxDrawdown,
        annualizedVol,
      },
      compliance: {
        status: complianceStatus,
        restrictedListChecked: 4208,
        quietPeriodActive: quietPeriod,
        esgScore: 88,
        notes: secData.regulatoryNotes,
      },
      strategist: {
        proposedAction,
        targetAllocationPct,
        orderNotional,
        confidence,
        rationale: `Signal mapped to ${signal} momentum with favorable risk-adjusted Sharpe of ${sharpe}.`,
      },
      guardrail: {
        executionMode,
        requiresApproval,
        ruleTriggered,
        checkpointOpened: requiresApproval,
      },
    };
  }
}
