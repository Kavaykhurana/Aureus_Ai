/**
 * Type-Safe Aureus AI API Client
 * Connects frontend components to the backend Express and SSE services.
 */

export interface PortfolioData {
  totalValue: number;
  cash: number;
  currency: string;
  pnlToday: number;
  pnlTodayPct: number;
  quarterReturnPct: number;
  alphaCapture: number;
  concentrationPct: number;
  concentrationTicker: string;
  holdings: Array<{
    ticker: string;
    name: string;
    weight: number;
    shares: number;
    last_price: number;
    cost_basis: number;
    return_pct: number;
    sector: string;
    tone: string;
  }>;
  chartData: Array<{ month: string; portfolio: number; benchmark: number }>;
}

export interface RiskData {
  portfolioVaR: number;
  vaRChangeToday: string;
  openAlerts: number;
  requiresReviewCount: number;
  policyHealthScore: number;
  stressLossPct: number;
  dimensions: Array<{
    dimension: string;
    level: string;
    value: string;
    note: string;
    tone: string;
  }>;
}

export interface AuditEvent {
  id: string;
  time: string;
  agent: string;
  message: string;
  category: string;
  tone: string;
  hash: string;
  signed_by: string;
  status: string;
}

export interface PolicyData {
  version: string;
  positionLimit: number;
  approvalVaR: number;
  complianceHardStop: boolean;
  twoPersonApproval: boolean;
  healthScore: number;
  updatedAt: string;
}

export interface ExceptionItem {
  id: string;
  title: string;
  details: string;
  severity: string;
  time: string;
  status: string;
  owner: string;
  ticker?: string;
}

export interface AnalysisRecord {
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
}

export interface StockDetailData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  peRatio: number;
  grossMarginPct: number;
  marketCapB: number;
  sector: string;
  confidence: number;
  filingSummary: string;
  riskFactors: string[];
  keyCatalysts: string[];
  evidence: Array<{ title: string; copy: string; tone: string }>;
  sourceScores: Array<{ name: string; score: number; detail: string }>;
  priceSeries: number[];
}

export interface WatchlistData {
  bullishCount: number;
  avgConfidence: number;
  activeAlerts: number;
  netMovePct: number;
  symbols: Array<{
    ticker: string;
    name: string;
    price: number;
    change_pct: number;
    confidence: number;
    signal: string;
    tone: string;
    alertArmed: boolean;
  }>;
}

export interface EarningsData {
  nextCatalyst: string;
  nextCatalystName: string;
  highImpactCount: number;
  trackedCount: number;
  lastRefresh: string;
  catalysts: Array<{
    id: string;
    date_str: string;
    ticker: string;
    title: string;
    timing: string;
    impact: string;
    move_str: string;
    tone: string;
    alertArmed: boolean;
  }>;
}

export interface SwarmThought {
  agent: string;
  state: "RUNNING" | "COMPLETED" | "FLAGGED";
  message: string;
  timestamp: number;
}

export interface SwarmResult {
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

export const api = {
  async getPortfolio(): Promise<PortfolioData> {
    const res = await fetch("/api/portfolio");
    if (!res.ok) throw new Error("Failed to fetch portfolio");
    return res.json();
  },

  async addHolding(holding: {
    ticker: string;
    name?: string;
    weight: number;
    shares: number;
    lastPrice: number;
    costBasis: number;
    sector?: string;
  }): Promise<{ success: boolean; ticker: string }> {
    const res = await fetch("/api/portfolio/holdings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(holding),
    });
    if (!res.ok) throw new Error("Failed to add holding");
    return res.json();
  },

  async getRiskData(): Promise<RiskData> {
    const res = await fetch("/api/risk");
    if (!res.ok) throw new Error("Failed to fetch risk data");
    return res.json();
  },

  async runScenario(scenario: string, threshold: number) {
    const res = await fetch("/api/risk/scenario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario, threshold }),
    });
    if (!res.ok) throw new Error("Failed to run scenario");
    return res.json();
  },

  async getAuditEvents(filter = "All events", query = ""): Promise<{
    eventsToday: number;
    integrityPct: number;
    humanActionsCount: number;
    retentionPolicy: string;
    events: AuditEvent[];
  }> {
    const params = new URLSearchParams();
    if (filter) params.set("filter", filter);
    if (query) params.set("q", query);
    const res = await fetch(`/api/audit?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch audit events");
    return res.json();
  },

  async getHistory(query = ""): Promise<{ totalRuns: number; runs: AnalysisRecord[] }> {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    const res = await fetch(`/api/history?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch history");
    return res.json();
  },

  async getPolicies(): Promise<PolicyData> {
    const res = await fetch("/api/policies");
    if (!res.ok) throw new Error("Failed to fetch policies");
    return res.json();
  },

  async savePolicies(policy: {
    positionLimit: number;
    approvalVaR: number;
    complianceHardStop: boolean;
    twoPersonApproval: boolean;
  }) {
    const res = await fetch("/api/policies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(policy),
    });
    if (!res.ok) throw new Error("Failed to save policies");
    return res.json();
  },

  async getExceptions(): Promise<{
    openCount: number;
    avgAgeMinutes: number;
    resolvedToday: number;
    ownerCoveragePct: number;
    items: ExceptionItem[];
  }> {
    const res = await fetch("/api/exceptions");
    if (!res.ok) throw new Error("Failed to fetch exceptions");
    return res.json();
  },

  async resolveException(id: string) {
    const res = await fetch(`/api/exceptions/${id}/resolve`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to resolve exception");
    return res.json();
  },

  async getStockDetail(ticker: string): Promise<StockDetailData> {
    const res = await fetch(`/api/stock/${ticker}`);
    if (!res.ok) throw new Error("Failed to fetch stock detail");
    return res.json();
  },

  async getWatchlist(): Promise<WatchlistData> {
    const res = await fetch("/api/watchlist");
    if (!res.ok) throw new Error("Failed to fetch watchlist");
    return res.json();
  },

  async toggleWatchlistAlert(ticker: string) {
    const res = await fetch("/api/watchlist/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker }),
    });
    if (!res.ok) throw new Error("Failed to toggle alert");
    return res.json();
  },

  async getEarnings(): Promise<EarningsData> {
    const res = await fetch("/api/earnings");
    if (!res.ok) throw new Error("Failed to fetch earnings");
    return res.json();
  },

  async toggleEarningsAlert(ticker: string) {
    const res = await fetch("/api/earnings/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker }),
    });
    if (!res.ok) throw new Error("Failed to toggle earnings alert");
    return res.json();
  },

  async executeTradeDecision(payload: {
    ticker: string;
    decision: "approved" | "rejected";
    orderNotional?: number;
    targetAllocation?: string;
    notes?: string;
  }) {
    const res = await fetch("/api/swarm/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to execute decision");
    return res.json();
  },

  /**
   * Connects to SSE stream for live 5-agent swarm thought execution.
   */
  connectSwarmStream(
    ticker: string,
    onThought: (thought: SwarmThought) => void,
    onComplete: (result: SwarmResult) => void,
    onError?: (err: unknown) => void
  ): () => void {
    const es = new EventSource(`/api/swarm/stream?ticker=${encodeURIComponent(ticker)}`);

    const handleError = (err: unknown) => {
      if (typeof onError === "function") {
        onError(err);
      } else {
        console.warn("[Aureus AI] Swarm SSE stream error:", err);
      }
      es.close();
    };

    es.addEventListener("AGENT_THOUGHT", (evt) => {
      try {
        const thought = JSON.parse(evt.data) as SwarmThought;
        onThought(thought);
      } catch (e) {
        console.error("Error parsing AGENT_THOUGHT:", e);
      }
    });

    es.addEventListener("PIPELINE_COMPLETE", (evt) => {
      try {
        const result = JSON.parse(evt.data) as SwarmResult;
        onComplete(result);
      } catch (e) {
        console.error("Error parsing PIPELINE_COMPLETE:", e);
      }
      es.close();
    });

    es.addEventListener("ERROR", (evt) => {
      handleError(evt);
    });

    es.onerror = (err) => {
      handleError(err);
    };

    return () => {
      es.close();
    };
  },
};
