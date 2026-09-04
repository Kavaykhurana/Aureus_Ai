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
    INSERT INTO portfolios (id, name, total_value, cash, currency, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(portfolioId, "Aureus Sovereign Alpha Fund", 708420.00, 57382.02, "USD", now);

  // 2. Holdings
  const holdingsData = [
    { ticker: "NVDA", name: "NVIDIA Corporation", weight: 28.4, shares: 1520, last_price: 132.40, cost_basis: 112.00, return_pct: 18.2, sector: "Technology", tone: "green" },
    { ticker: "MSFT", name: "Microsoft Corporation", weight: 19.7, shares: 313, last_price: 445.70, cost_basis: 399.40, return_pct: 11.6, sector: "Technology", tone: "green" },
    { ticker: "AMZN", name: "Amazon.com, Inc.", weight: 14.2, shares: 540, last_price: 186.10, cost_basis: 170.90, return_pct: 8.9, sector: "Consumer", tone: "green" },
    { ticker: "META", name: "Meta Platforms", weight: 11.6, shares: 165, last_price: 498.20, cost_basis: 468.60, return_pct: 6.3, sector: "Technology", tone: "green" },
    { ticker: "CASH", name: "Cash & equivalents", weight: 8.1, shares: 57382, last_price: 1.00, cost_basis: 1.00, return_pct: 0.0, sector: "Cash", tone: "neutral" },
    { ticker: "AMD", name: "Advanced Micro Devices", weight: 7.2, shares: 310, last_price: 164.73, cost_basis: 161.30, return_pct: 2.1, sector: "Technology", tone: "green" },
    { ticker: "AVGO", name: "Broadcom Inc.", weight: 6.8, shares: 28, last_price: 1732.12, cost_basis: 1750.00, return_pct: -1.0, sector: "Technology", tone: "warning" },
    { ticker: "TSM", name: "Taiwan Semiconductor", weight: 4.0, shares: 160, last_price: 177.10, cost_basis: 169.00, return_pct: 4.8, sector: "Technology", tone: "green" }
  ];

  const insertHolding = db.prepare(`
    INSERT INTO holdings (id, portfolio_id, ticker, name, weight, shares, last_price, cost_basis, return_pct, sector, tone, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const h of holdingsData) {
    insertHolding.run(crypto.randomUUID(), portfolioId, h.ticker, h.name, h.weight, h.shares, h.last_price, h.cost_basis, h.return_pct, h.sector, h.tone, now);
  }

  // 3. Policies
  db.prepare(`
    INSERT INTO policies (id, version, position_limit, approval_var_threshold, compliance_hard_stop, two_person_approval, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run("active-policy", "v2.4", 25.0, 2.5, 1, 0, now);

  // 4. Audit Trail
  const initialAuditEvents = [
    { time: "09:41:08", agent: "SYSTEM", message: "Analysis run initialized for NVDA", category: "System", tone: "neutral", signed_by: "Kernel-v2.4" },
    { time: "09:41:09", agent: "ANALYST", message: "Sentiment mapped to 78 / 100 bullish signal", category: "Analyst", tone: "positive", signed_by: "AnalystAgent-01" },
    { time: "09:41:12", agent: "RISK", message: "1-day VaR calculated at 2.4% · 95% confidence", category: "Risk", tone: "positive", signed_by: "QuantRiskAgent-02" },
    { time: "09:41:15", agent: "COMPLIANCE", message: "No sanctions or restricted-list conflicts", category: "Compliance", tone: "positive", signed_by: "ComplianceAgent-03" },
    { time: "09:41:18", agent: "STRATEGIST", message: "Target allocation sized at 3.5%", category: "Strategist", tone: "neutral", signed_by: "PortfolioStrategist-04" },
    { time: "09:41:20", agent: "GUARDRAIL", message: "Human approval checkpoint opened", category: "Guardrail", tone: "warning", signed_by: "ExecutionGuardrail-05" },
    { time: "09:41:45", agent: "HUMAN", message: "NVDA order approved · execution confirmed", category: "Human", tone: "positive", signed_by: "Elena Rodriguez (Operator)" }
  ];

  const insertAudit = db.prepare(`
    INSERT INTO audit_events (id, time, agent, message, category, tone, hash, signed_by, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const a of initialAuditEvents) {
    const hash = generateEventHash(a.time, a.agent, a.message);
    insertAudit.run(crypto.randomUUID(), a.time, a.agent, a.message, a.category, a.tone, hash, a.signed_by, "VERIFIED", now);
  }

  // 5. Analyses History
  const initialAnalyses = [
    { ticker: "NVDA", timestamp: "Today · 09:41", signal: "Bullish", decision: "Approved", confidence: 82.0, var_95: 2.4, sharpe_ratio: 2.68, compliance_status: "APPROVED", proposed_action: "BUY", target_allocation: 3.5, thesis_summary: "Robust data center acceleration and strong gross margin expansion.", tone: "positive" },
    { ticker: "MSFT", timestamp: "Yesterday · 16:22", signal: "Constructive", decision: "Approved", confidence: 76.0, var_95: 1.8, sharpe_ratio: 2.14, compliance_status: "APPROVED", proposed_action: "HOLD", target_allocation: 19.7, thesis_summary: "Azure cloud growth resilient; enterprise AI co-pilot adoption accelerating.", tone: "positive" },
    { ticker: "TSLA", timestamp: "Jun 18 · 11:08", signal: "Mixed", decision: "Rejected", confidence: 51.0, var_95: 3.9, sharpe_ratio: 1.15, compliance_status: "FLAGGED", proposed_action: "TRIM", target_allocation: 2.0, thesis_summary: "Automotive margin compression and heightened regulatory scrutiny.", tone: "warning" },
    { ticker: "AMD", timestamp: "Jun 17 · 14:50", signal: "Bullish", decision: "Pending", confidence: 69.0, var_95: 2.7, sharpe_ratio: 1.88, compliance_status: "APPROVED", proposed_action: "BUY", target_allocation: 7.2, thesis_summary: "MI300 ramp capturing incremental sovereign AI accelerator demand.", tone: "neutral" },
    { ticker: "AAPL", timestamp: "Jun 14 · 10:12", signal: "Neutral", decision: "Approved", confidence: 64.0, var_95: 1.6, sharpe_ratio: 1.95, compliance_status: "APPROVED", proposed_action: "HOLD", target_allocation: 5.0, thesis_summary: "Services growth stabilizing; Apple Intelligence upgrade cycle expected in H2.", tone: "positive" }
  ];

  const insertAnalysis = db.prepare(`
    INSERT INTO analyses (id, ticker, timestamp, signal, decision, confidence, var_95, sharpe_ratio, compliance_status, proposed_action, target_allocation, thesis_summary, tone, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const an of initialAnalyses) {
    insertAnalysis.run(crypto.randomUUID(), an.ticker, an.timestamp, an.signal, an.decision, an.confidence, an.var_95, an.sharpe_ratio, an.compliance_status, an.proposed_action, an.target_allocation, an.thesis_summary, an.tone, now);
  }

  // 6. Exceptions
  const initialExceptions = [
    { id: "EX-1048", title: "Position concentration", details: "NVDA has moved above the 25% single-name limit.", severity: "High", time: "09:41", status: "Open", owner: "Risk", ticker: "NVDA" },
    { id: "EX-1047", title: "Human approval overdue", details: "TSLA proposal has been waiting for operator review for 18m.", severity: "Medium", time: "09:18", status: "Open", owner: "Guardrail", ticker: "TSLA" },
    { id: "EX-1042", title: "Stale market evidence", details: "AMD sentiment evidence is older than the configured 24h window.", severity: "Low", time: "08:52", status: "Acknowledged", owner: "Analyst", ticker: "AMD" }
  ];

  const insertException = db.prepare(`
    INSERT INTO exceptions (id, title, details, severity, time, status, owner, ticker, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const ex of initialExceptions) {
    insertException.run(ex.id, ex.title, ex.details, ex.severity, ex.time, ex.status, ex.owner, ex.ticker, now);
  }

  // 7. Watchlist
  const initialWatchlist = [
    { ticker: "NVDA", name: "NVIDIA Corporation", price: 132.40, change_pct: 4.18, confidence: 78, signal: "Bullish", tone: "green", alert_armed: 1 },
    { ticker: "MSFT", name: "Microsoft Corporation", price: 445.70, change_pct: 1.36, confidence: 74, signal: "Constructive", tone: "green", alert_armed: 0 },
    { ticker: "AMZN", name: "Amazon.com, Inc.", price: 186.10, change_pct: 0.92, confidence: 71, signal: "Bullish", tone: "green", alert_armed: 0 },
    { ticker: "META", name: "Meta Platforms", price: 498.20, change_pct: -0.84, confidence: 63, signal: "Neutral", tone: "neutral", alert_armed: 0 },
    { ticker: "AMD", name: "Advanced Micro Devices", price: 164.73, change_pct: 2.11, confidence: 69, signal: "Constructive", tone: "green", alert_armed: 0 },
    { ticker: "AVGO", name: "Broadcom Inc.", price: 1732.12, change_pct: -1.02, confidence: 58, signal: "Mixed", tone: "warning", alert_armed: 0 }
  ];

  const insertWatchlist = db.prepare(`
    INSERT INTO watchlist (ticker, name, price, change_pct, confidence, signal, tone, alert_armed, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const w of initialWatchlist) {
    insertWatchlist.run(w.ticker, w.name, w.price, w.change_pct, w.confidence, w.signal, w.tone, w.alert_armed, now);
  }

  // 8. Catalysts
  const initialCatalysts = [
    { id: "CAT-1", date_str: "JUN 21", ticker: "NVDA", title: "Q1 FY25 earnings", timing: "After market", impact: "High", move_str: "+12.4% implied move", tone: "orange", alert_armed: 1 },
    { id: "CAT-2", date_str: "JUN 25", ticker: "MU", title: "Q3 earnings", timing: "After market", impact: "High", move_str: "+9.8% implied move", tone: "orange", alert_armed: 0 },
    { id: "CAT-3", date_str: "JUN 27", ticker: "NKE", title: "Q4 FY24 earnings", timing: "Before market", impact: "Medium", move_str: "+5.2% implied move", tone: "gold", alert_armed: 0 },
    { id: "CAT-4", date_str: "JUL 02", ticker: "TSM", title: "June revenue report", timing: "Before market", impact: "Medium", move_str: "+4.8% implied move", tone: "gold", alert_armed: 0 },
    { id: "CAT-5", date_str: "JUL 18", ticker: "MSFT", title: "Q4 FY24 earnings", timing: "After market", impact: "High", move_str: "+6.3% implied move", tone: "orange", alert_armed: 1 }
  ];

  const insertCatalyst = db.prepare(`
    INSERT INTO catalysts (id, date_str, ticker, title, timing, impact, move_str, tone, alert_armed, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of initialCatalysts) {
    insertCatalyst.run(c.id, c.date_str, c.ticker, c.title, c.timing, c.impact, c.move_str, c.tone, c.alert_armed, now);
  }
}

seedInitialData();
