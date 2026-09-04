import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, "../../.data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.SQLITE_DB_PATH || path.join(dataDir, "aureus.db");
export const db = new DatabaseSync(dbPath);

// Enable WAL mode & foreign keys for performance and data integrity
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");
db.exec("PRAGMA synchronous = NORMAL;");   // Durable enough with WAL; faster than FULL
db.exec("PRAGMA cache_size = -32000;");    // 32MB page cache
db.exec("PRAGMA temp_store = MEMORY;");    // Use memory for temp tables

// Initialize Schema
let schemaPath = path.join(__dirname, "schema.sql");
if (!fs.existsSync(schemaPath)) {
  // Check if running from dist/
  schemaPath = path.resolve(__dirname, "../server/db/schema.sql");
}
if (!fs.existsSync(schemaPath)) {
  // Fallback check current working directory
  schemaPath = path.resolve(process.cwd(), "server/db/schema.sql");
}
const schemaSql = fs.readFileSync(schemaPath, "utf-8");
db.exec(schemaSql);

// Helper for cryptographic event hashes
export function generateEventHash(time: string, agent: string, message: string): string {
  return crypto.createHash("sha256").update(`${time}:${agent}:${message}:${Date.now()}`).digest("hex");
}

// Seed initial state if database is unseeded
function seedInitialData() {
  const existingPortfolio = db.prepare("SELECT count(*) as count FROM portfolios").get() as { count: number };
  if (existingPortfolio.count > 0) {
    return;
  }

  const now = new Date().toISOString();
  const portfolioId = "main-portfolio";

  // 1. Portfolio
  db.prepare(`
    INSERT OR IGNORE INTO portfolios (id, name, total_value, cash, currency, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(portfolioId, "Aureus Sovereign Alpha Fund", 708420.00, 34000.00, "USD", now);

  // 2. Holdings (Rich Multi-Sector Coverage)
  const holdingsData = [
    { ticker: "NVDA", name: "NVIDIA Corporation", weight: 26.4, shares: 1400, last_price: 132.40, cost_basis: 112.00, return_pct: 18.2, sector: "Technology", tone: "green" },
    { ticker: "MSFT", name: "Microsoft Corporation", weight: 18.2, shares: 290, last_price: 445.70, cost_basis: 399.40, return_pct: 11.6, sector: "Technology", tone: "green" },
    { ticker: "AMZN", name: "Amazon.com, Inc.", weight: 12.5, shares: 480, last_price: 186.10, cost_basis: 170.90, return_pct: 8.9, sector: "Consumer", tone: "green" },
    { ticker: "META", name: "Meta Platforms", weight: 10.8, shares: 155, last_price: 498.20, cost_basis: 468.60, return_pct: 6.3, sector: "Technology", tone: "green" },
    { ticker: "GOOGL", name: "Alphabet Inc.", weight: 8.5, shares: 340, last_price: 178.20, cost_basis: 156.00, return_pct: 14.2, sector: "Technology", tone: "green" },
    { ticker: "LLY", name: "Eli Lilly and Company", weight: 6.2, shares: 50, last_price: 885.40, cost_basis: 721.00, return_pct: 22.8, sector: "Healthcare", tone: "green" },
    { ticker: "JPM", name: "JPMorgan Chase & Co.", weight: 5.4, shares: 190, last_price: 201.30, cost_basis: 181.00, return_pct: 11.2, sector: "Financials", tone: "green" },
    { ticker: "CASH", name: "USD Cash & Equivalents", weight: 4.8, shares: 34000, last_price: 1.00, cost_basis: 1.00, return_pct: 0.0, sector: "Cash", tone: "neutral" },
    { ticker: "AMD", name: "Advanced Micro Devices", weight: 4.2, shares: 180, last_price: 164.73, cost_basis: 161.30, return_pct: 2.1, sector: "Technology", tone: "green" },
    { ticker: "AVGO", name: "Broadcom Inc.", weight: 3.8, shares: 16, last_price: 1732.12, cost_basis: 1750.00, return_pct: -1.0, sector: "Technology", tone: "warning" },
    { ticker: "TSM", name: "Taiwan Semiconductor", weight: 3.2, shares: 130, last_price: 177.10, cost_basis: 169.00, return_pct: 4.8, sector: "Technology", tone: "green" },
    { ticker: "ASML", name: "ASML Holding N.V.", weight: 2.8, shares: 20, last_price: 998.40, cost_basis: 864.00, return_pct: 15.6, sector: "Technology", tone: "green" },
    { ticker: "CAT", name: "Caterpillar Inc.", weight: 2.2, shares: 45, last_price: 345.10, cost_basis: 321.40, return_pct: 7.4, sector: "Industrials", tone: "green" }
  ];

  const insertHolding = db.prepare(`
    INSERT OR REPLACE INTO holdings (id, portfolio_id, ticker, name, weight, shares, last_price, cost_basis, return_pct, sector, tone, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const h of holdingsData) {
    const existing = db.prepare("SELECT id FROM holdings WHERE ticker = ?").get(h.ticker) as { id: string } | undefined;
    insertHolding.run(existing?.id || crypto.randomUUID(), portfolioId, h.ticker, h.name, h.weight, h.shares, h.last_price, h.cost_basis, h.return_pct, h.sector, h.tone, now);
  }

  // 3. Policies
  db.prepare(`
    INSERT OR IGNORE INTO policies (id, version, position_limit, approval_var_threshold, compliance_hard_stop, two_person_approval, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run("active-policy", "v2.4", 25.0, 2.5, 1, 0, now);

  // 4. Audit Trail (Comprehensive Regulatory & Operator Records)
  const initialAuditEvents = [
    { time: "09:41:08", agent: "SYSTEM", message: "Analysis run initialized for NVDA · 5-agent sequence queued", category: "System", tone: "neutral", signed_by: "Kernel-v2.4" },
    { time: "09:41:09", agent: "ANALYST", message: "Market sentiment mapped to 78 / 100 bullish signal · 10-Q filing confirmed", category: "Analyst", tone: "positive", signed_by: "AnalystAgent-01" },
    { time: "09:41:12", agent: "RISK", message: "1-day VaR calculated at 2.4% · 95% confidence interval established", category: "Risk", tone: "positive", signed_by: "QuantRiskAgent-02" },
    { time: "09:41:15", agent: "COMPLIANCE", message: "Restricted list verified · no sanctions or insider blackout conflicts", category: "Compliance", tone: "positive", signed_by: "ComplianceAgent-03" },
    { time: "09:41:18", agent: "STRATEGIST", message: "Portfolio allocation sized at 3.5% ($24,860 notional order)", category: "Strategist", tone: "neutral", signed_by: "PortfolioStrategist-04" },
    { time: "09:41:20", agent: "GUARDRAIL", message: "Human approval checkpoint opened: single-position exposure near 25% policy limit", category: "Guardrail", tone: "warning", signed_by: "ExecutionGuardrail-05" },
    { time: "09:41:45", agent: "HUMAN", message: "NVDA order approved ($24,860) · execution confirmed by operator", category: "Human", tone: "positive", signed_by: "Elena Rodriguez (Operator)" },
    { time: "09:18:12", agent: "GUARDRAIL", message: "TSLA trim recommendation flagged: auto-execution blocked by operator review", category: "Guardrail", tone: "warning", signed_by: "ExecutionGuardrail-05" },
    { time: "09:02:44", agent: "COMPLIANCE", message: "Regulatory compliance periodic scan completed: 4,208 issuers screened", category: "Compliance", tone: "positive", signed_by: "ComplianceAgent-03" },
    { time: "08:52:10", agent: "ANALYST", message: "AMD SEC 10-Q ingested · gross margin trajectory stable at 52.6%", category: "Analyst", tone: "positive", signed_by: "AnalystAgent-01" },
    { time: "08:30:15", agent: "RISK", message: "Macro stress simulation finished: Base case projected drawdown −3.7%", category: "Risk", tone: "neutral", signed_by: "QuantRiskAgent-02" },
    { time: "Yesterday", agent: "HUMAN", message: "MSFT holding rebalanced: allocation matched to 18.2% target", category: "Human", tone: "positive", signed_by: "Elena Rodriguez (Operator)" },
    { time: "Yesterday", agent: "STRATEGIST", message: "GOOGL position sized at 8.5% following Q1 cloud acceleration review", category: "Strategist", tone: "positive", signed_by: "PortfolioStrategist-04" },
    { time: "Jun 17", agent: "GUARDRAIL", message: "Policy parameter synchronization confirmed across 5-agent swarm", category: "Guardrail", tone: "positive", signed_by: "ExecutionGuardrail-05" },
    { time: "Jun 14", agent: "SYSTEM", message: "Daily ledger snapshot verified against settlement custodian", category: "System", tone: "positive", signed_by: "Kernel-v2.4" }
  ];

  const insertAudit = db.prepare(`
    INSERT OR REPLACE INTO audit_events (id, time, agent, message, category, tone, hash, signed_by, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const a of initialAuditEvents) {
    const hash = generateEventHash(a.time, a.agent, a.message);
    insertAudit.run(crypto.randomUUID(), a.time, a.agent, a.message, a.category, a.tone, hash, a.signed_by, "VERIFIED", now);
  }

  // 5. Analyses History (15 Detailed Historical Inferences)
  const initialAnalyses = [
    { ticker: "NVDA", timestamp: "Today · 09:41", signal: "Bullish", decision: "Approved", confidence: 82.0, var_95: 2.4, sharpe_ratio: 2.68, compliance_status: "APPROVED", proposed_action: "BUY", target_allocation: 3.5, thesis_summary: "Robust data center acceleration and strong gross margin expansion.", tone: "positive" },
    { ticker: "MSFT", timestamp: "Yesterday · 16:22", signal: "Constructive", decision: "Approved", confidence: 76.0, var_95: 1.8, sharpe_ratio: 2.14, compliance_status: "APPROVED", proposed_action: "HOLD", target_allocation: 18.2, thesis_summary: "Azure cloud growth resilient; enterprise AI co-pilot adoption accelerating.", tone: "positive" },
    { ticker: "TSLA", timestamp: "Jun 18 · 11:08", signal: "Mixed", decision: "Rejected", confidence: 51.0, var_95: 3.9, sharpe_ratio: 1.15, compliance_status: "FLAGGED", proposed_action: "TRIM", target_allocation: 2.0, thesis_summary: "Automotive margin compression and heightened regulatory scrutiny.", tone: "warning" },
    { ticker: "AMD", timestamp: "Jun 17 · 14:50", signal: "Bullish", decision: "Pending", confidence: 69.0, var_95: 2.7, sharpe_ratio: 1.88, compliance_status: "APPROVED", proposed_action: "BUY", target_allocation: 4.2, thesis_summary: "MI300 ramp capturing incremental sovereign AI accelerator demand.", tone: "neutral" },
    { ticker: "AAPL", timestamp: "Jun 14 · 10:12", signal: "Neutral", decision: "Approved", confidence: 64.0, var_95: 1.6, sharpe_ratio: 1.95, compliance_status: "APPROVED", proposed_action: "HOLD", target_allocation: 5.0, thesis_summary: "Services growth stabilizing; Apple Intelligence upgrade cycle expected in H2.", tone: "positive" },
    { ticker: "GOOGL", timestamp: "Jun 12 · 15:30", signal: "Bullish", decision: "Approved", confidence: 79.0, var_95: 2.1, sharpe_ratio: 2.42, compliance_status: "APPROVED", proposed_action: "BUY", target_allocation: 8.5, thesis_summary: "Gemini enterprise monetization accelerating Google Cloud margins to 11.2%.", tone: "positive" },
    { ticker: "META", timestamp: "Jun 10 · 09:15", signal: "Constructive", decision: "Approved", confidence: 72.0, var_95: 2.3, sharpe_ratio: 2.05, compliance_status: "APPROVED", proposed_action: "HOLD", target_allocation: 10.8, thesis_summary: "Advantage+ advertising return on ad spend delivering industry-leading yield.", tone: "positive" },
    { ticker: "AMZN", timestamp: "Jun 08 · 13:45", signal: "Bullish", decision: "Approved", confidence: 81.0, var_95: 2.0, sharpe_ratio: 2.30, compliance_status: "APPROVED", proposed_action: "BUY", target_allocation: 12.5, thesis_summary: "AWS re-accelerating to 17% growth; regional fulfillment efficiency improving.", tone: "positive" },
    { ticker: "AVGO", timestamp: "Jun 05 · 11:20", signal: "Mixed", decision: "Rejected", confidence: 58.0, var_95: 3.4, sharpe_ratio: 1.45, compliance_status: "APPROVED", proposed_action: "TRIM", target_allocation: 3.8, thesis_summary: "Custom silicon ASIC pipeline robust but valuation premium is elevated.", tone: "warning" },
    { ticker: "LLY", timestamp: "Jun 03 · 14:10", signal: "Bullish", decision: "Approved", confidence: 85.0, var_95: 1.7, sharpe_ratio: 2.85, compliance_status: "APPROVED", proposed_action: "BUY", target_allocation: 6.2, thesis_summary: "Incretin metabolic franchise capacity expanding; international distribution unlocking.", tone: "positive" },
    { ticker: "JPM", timestamp: "May 30 · 10:05", signal: "Constructive", decision: "Approved", confidence: 73.0, var_95: 1.5, sharpe_ratio: 2.10, compliance_status: "APPROVED", proposed_action: "HOLD", target_allocation: 5.4, thesis_summary: "Net interest income upside guidance retained with solid balance sheet reserves.", tone: "positive" },
    { ticker: "TSM", timestamp: "May 28 · 16:40", signal: "Bullish", decision: "Approved", confidence: 75.0, var_95: 2.5, sharpe_ratio: 2.18, compliance_status: "APPROVED", proposed_action: "BUY", target_allocation: 3.2, thesis_summary: "N3 and N2 leading-edge foundry utilization near 100% capacity.", tone: "positive" },
    { ticker: "ASML", timestamp: "May 24 · 09:50", signal: "Bullish", decision: "Approved", confidence: 78.0, var_95: 2.2, sharpe_ratio: 2.35, compliance_status: "APPROVED", proposed_action: "BUY", target_allocation: 2.8, thesis_summary: "High-NA EUV tool deliveries progressing on schedule with strong tier-1 orders.", tone: "positive" },
    { ticker: "PLTR", timestamp: "May 20 · 15:15", signal: "Mixed", decision: "Pending", confidence: 62.0, var_95: 3.7, sharpe_ratio: 1.60, compliance_status: "APPROVED", proposed_action: "HOLD", target_allocation: 1.5, thesis_summary: "Commercial AIP bootcamps expanding; government revenue visibility steady.", tone: "neutral" },
    { ticker: "QCOM", timestamp: "May 16 · 11:30", signal: "Constructive", decision: "Approved", confidence: 70.0, var_95: 2.4, sharpe_ratio: 1.92, compliance_status: "APPROVED", proposed_action: "BUY", target_allocation: 2.0, thesis_summary: "Snapdragon X Elite on-device neural processing momentum gaining PC OEM share.", tone: "positive" }
  ];

  const insertAnalysis = db.prepare(`
    INSERT OR REPLACE INTO analyses (id, ticker, timestamp, signal, decision, confidence, var_95, sharpe_ratio, compliance_status, proposed_action, target_allocation, thesis_summary, tone, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const an of initialAnalyses) {
    insertAnalysis.run(crypto.randomUUID(), an.ticker, an.timestamp, an.signal, an.decision, an.confidence, an.var_95, an.sharpe_ratio, an.compliance_status, an.proposed_action, an.target_allocation, an.thesis_summary, an.tone, now);
  }

  // 6. Exceptions (6 Active Edge Cases with Varied Severities & Owners)
  const initialExceptions = [
    { id: "EX-1048", title: "Position concentration limit", details: "NVDA weight has reached 26.4%, above the 25% single-name policy threshold.", severity: "High", time: "09:41", status: "Open", owner: "Risk", ticker: "NVDA" },
    { id: "EX-1047", title: "Human approval overdue", details: "TSLA trim recommendation requires explicit operator sign-off (pending 18m).", severity: "Medium", time: "09:18", status: "Open", owner: "Guardrail", ticker: "TSLA" },
    { id: "EX-1045", title: "Export restriction regulatory query", details: "TSM third-party packaging contractor under export restriction review.", severity: "High", time: "09:02", status: "Open", owner: "Compliance", ticker: "TSM" },
    { id: "EX-1042", title: "Stale market sentiment evidence", details: "AMD sentiment evidence timestamp is older than the configured 24h refresh window.", severity: "Low", time: "08:52", status: "Acknowledged", owner: "Analyst", ticker: "AMD" },
    { id: "EX-1039", title: "Option chain liquidity spread", details: "AVGO implied volatility spread widened above 15 bps threshold during pre-market.", severity: "Medium", time: "08:30", status: "Open", owner: "Risk", ticker: "AVGO" },
    { id: "EX-1035", title: "Technology sector concentration", details: "Aggregate technology sector weighting reached 68% of active sovereign fund assets.", severity: "Medium", time: "Yesterday", status: "Open", owner: "Risk", ticker: "TECH" }
  ];

  const insertException = db.prepare(`
    INSERT OR REPLACE INTO exceptions (id, title, details, severity, time, status, owner, ticker, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const ex of initialExceptions) {
    insertException.run(ex.id, ex.title, ex.details, ex.severity, ex.time, ex.status, ex.owner, ex.ticker, now);
  }

  // 7. Watchlist (14 Priority Instruments with Live Confidences)
  const initialWatchlist = [
    { ticker: "NVDA", name: "NVIDIA Corporation", price: 132.40, change_pct: 4.18, confidence: 82, signal: "Bullish", tone: "green", alert_armed: 1 },
    { ticker: "MSFT", name: "Microsoft Corporation", price: 445.70, change_pct: 1.36, confidence: 76, signal: "Constructive", tone: "green", alert_armed: 1 },
    { ticker: "AMZN", name: "Amazon.com, Inc.", price: 186.10, change_pct: 0.92, confidence: 81, signal: "Bullish", tone: "green", alert_armed: 0 },
    { ticker: "GOOGL", name: "Alphabet Inc.", price: 178.20, change_pct: 2.45, confidence: 79, signal: "Bullish", tone: "green", alert_armed: 1 },
    { ticker: "META", name: "Meta Platforms", price: 498.20, change_pct: -0.84, confidence: 72, signal: "Constructive", tone: "green", alert_armed: 0 },
    { ticker: "AMD", name: "Advanced Micro Devices", price: 164.73, change_pct: 2.11, confidence: 69, signal: "Constructive", tone: "green", alert_armed: 0 },
    { ticker: "LLY", name: "Eli Lilly and Company", price: 885.40, change_pct: 1.82, confidence: 85, signal: "Bullish", tone: "green", alert_armed: 1 },
    { ticker: "JPM", name: "JPMorgan Chase & Co.", price: 201.30, change_pct: 0.65, confidence: 73, signal: "Constructive", tone: "green", alert_armed: 0 },
    { ticker: "TSM", name: "Taiwan Semiconductor", price: 177.10, change_pct: 3.20, confidence: 75, signal: "Bullish", tone: "green", alert_armed: 0 },
    { ticker: "ASML", name: "ASML Holding N.V.", price: 998.40, change_pct: 2.85, confidence: 78, signal: "Bullish", tone: "green", alert_armed: 0 },
    { ticker: "AVGO", name: "Broadcom Inc.", price: 1732.12, change_pct: -1.02, confidence: 58, signal: "Mixed", tone: "warning", alert_armed: 0 },
    { ticker: "AAPL", name: "Apple Inc.", price: 214.20, change_pct: 0.87, confidence: 64, signal: "Neutral", tone: "neutral", alert_armed: 0 },
    { ticker: "TSLA", name: "Tesla, Inc.", price: 184.50, change_pct: -2.02, confidence: 51, signal: "Mixed", tone: "warning", alert_armed: 1 },
    { ticker: "PLTR", name: "Palantir Technologies", price: 25.80, change_pct: 3.40, confidence: 62, signal: "Neutral", tone: "neutral", alert_armed: 0 }
  ];

  const insertWatchlist = db.prepare(`
    INSERT OR REPLACE INTO watchlist (ticker, name, price, change_pct, confidence, signal, tone, alert_armed, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const w of initialWatchlist) {
    insertWatchlist.run(w.ticker, w.name, w.price, w.change_pct, w.confidence, w.signal, w.tone, w.alert_armed, now);
  }

  // 8. Catalysts (Upcoming Earnings, Policy Decisions, Economic Releases)
  const initialCatalysts = [
    { id: "CAT-1", date_str: "JUN 21", ticker: "NVDA", title: "Q1 FY25 earnings", timing: "After market", impact: "High", move_str: "+12.4% implied move", tone: "orange", alert_armed: 1 },
    { id: "CAT-2", date_str: "JUN 25", ticker: "MU", title: "Q3 earnings release", timing: "After market", impact: "High", move_str: "+9.8% implied move", tone: "orange", alert_armed: 0 },
    { id: "CAT-3", date_str: "JUN 27", ticker: "NKE", title: "Q4 FY24 earnings", timing: "Before market", impact: "Medium", move_str: "+5.2% implied move", tone: "gold", alert_armed: 0 },
    { id: "CAT-4", date_str: "JUL 02", ticker: "TSM", title: "June revenue report", timing: "Before market", impact: "Medium", move_str: "+4.8% implied move", tone: "gold", alert_armed: 0 },
    { id: "CAT-5", date_str: "JUL 11", ticker: "CPI", title: "US Consumer Price Index", timing: "Before market", impact: "High", move_str: "Macro interest rate catalyst", tone: "orange", alert_armed: 1 },
    { id: "CAT-6", date_str: "JUL 18", ticker: "MSFT", title: "Q4 FY24 earnings", timing: "After market", impact: "High", move_str: "+6.3% implied move", tone: "orange", alert_armed: 1 },
    { id: "CAT-7", date_str: "JUL 24", ticker: "GOOGL", title: "Q2 FY24 earnings", timing: "After market", impact: "High", move_str: "+7.1% implied move", tone: "orange", alert_armed: 1 },
    { id: "CAT-8", date_str: "JUL 31", ticker: "FOMC", title: "Federal Reserve Rate Decision", timing: "After market", impact: "High", move_str: "Monetary policy guidance", tone: "orange", alert_armed: 1 },
    { id: "CAT-9", date_str: "AUG 15", ticker: "AMZN", title: "AWS Cloud & Retail Mid-Quarter Check", timing: "Before market", impact: "Medium", move_str: "+4.5% implied move", tone: "gold", alert_armed: 0 }
  ];

  const insertCatalyst = db.prepare(`
    INSERT OR REPLACE INTO catalysts (id, date_str, ticker, title, timing, impact, move_str, tone, alert_armed, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of initialCatalysts) {
    insertCatalyst.run(c.id, c.date_str, c.ticker, c.title, c.timing, c.impact, c.move_str, c.tone, c.alert_armed, now);
  }
}

seedInitialData();
