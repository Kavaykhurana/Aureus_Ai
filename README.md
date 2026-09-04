<div align="center">

<img src="https://img.shields.io/badge/Aureus_AI-Command_Center-f37a0a?style=for-the-badge&labelColor=1a1210" alt="Aureus AI" />

# Aureus AI — Command Center

**An inspectable multi-agent financial intelligence OS.**  
Five AI agents collaborate in real time to analyse equities, model risk, enforce compliance, and propose trade decisions — with a mandatory human-in-the-loop checkpoint before any execution.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-000?style=flat-square&logo=express)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-node%3Asqlite-003b57?style=flat-square&logo=sqlite)](https://nodejs.org/api/sqlite.html)
[![Vite](https://img.shields.io/badge/Vite-7-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](LICENSE)

</div>

---

## ✦ What is Aureus AI?

Aureus is a **financial decision intelligence platform** that orchestrates a swarm of five specialised AI agents. Every decision is fully auditable, every trade requires explicit operator approval, and every reasoning step is logged with a cryptographic hash — making the entire system inspectable, reversible, and compliance-ready.

```
User query  →  [Analyst]  →  [Risk Engine]  →  [Compliance]  →  [Strategist]  →  [Guardrail]
                   ↓              ↓                 ↓                ↓                ↓
              Sentiment       VaR / Sharpe      Restricted       BUY/TRIM/       HUMAN or
              + signals       + Drawdown         list check        HOLD rec.      AUTO exec.
```

---

## ✦ Agent Architecture

| Agent | Responsibility |
|---|---|
| **Analyst** | Processes market sentiment, earnings catalysts, and SEC filing signals to produce a directional score |
| **Risk Engine** | Calculates 95% VaR, Sharpe ratio, beta, max drawdown, and annualised volatility |
| **Compliance** | Checks restricted lists, quiet periods, ESG scores, and sanctions flags |
| **Strategist** | Synthesises all inputs to propose a BUY / TRIM / HOLD / REBALANCE action with a target allocation |
| **Guardrail** | Evaluates the proposal against policy thresholds — either auto-executes or opens a human review checkpoint |

Agent thoughts stream in real time to the UI via **Server-Sent Events (SSE)**.

---

## ✦ Feature Overview

### 🏠 Command Center (Home)
Live ticker analysis with real-time SSE thought stream. Watch all five agents reason sequentially before surfacing a recommendation. Includes the **HITL checkpoint** — a one-click approve/reject decision that is signed with a SHA-256 hash and written permanently to the audit trail.

### 📊 Portfolio
Live holdings dashboard showing position weights, P&L, sector breakdown, and a benchmark comparison chart. Add holdings via the API.

### 🛡️ Risk Matrix
Real-time VaR, open alerts, and policy health score. Includes a **Stress Lab** to run four configurable scenarios (base case, rate shock, tech selloff, liquidity event) and see projected drawdown before committing.

### 📋 Audit Trail
Immutable, cryptographically hashed event log. Every agent action, human decision, and policy change is recorded with a SHA-256 signature and a `signed_by` field — 7-year retention policy.

### ⚖️ Policy Center
Configure guardrail parameters in real time:
- Single-position concentration limit (5–50%)
- VaR threshold that triggers human approval (1–5%)
- Compliance hard stop toggle
- Two-person approval (enterprise)

All policies are persisted to the database and applied on the next analysis run.

### ⚠️ Exceptions
A triage queue for policy breaches, stale evidence windows, and overdue human approvals. Resolve, route, or dismiss — all actions are audit-logged.

### ⭐ Core Watchlist
Priority coverage list ranked by the latest Aureus signal. Real-time confidence bars, price change, and per-symbol alert arming.

### 📅 Earnings Radar
Upcoming catalyst calendar ranked by implied volatility and portfolio relevance. Per-event alert toggle with 7 / 30 / 90-day horizon selector.

### 🔍 Stock Detail
Deep-dive workspace per ticker with a dynamic intraday sparkline, tabbed thesis / evidence / risk panels fed from the latest agent run, and source-score breakdown.

### 📁 Analysis History
Full replay log of every prior agent run — searchable by ticker or decision. Click **Replay** to jump straight to the stock detail for that instrument.

---

## ✦ Technology Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React 19 + Vite 7 + TypeScript | Fast HMR, type-safe component tree |
| **Styling** | Vanilla CSS + Tailwind CSS v4 | Zero-runtime, design-system tokens |
| **Routing** | Wouter | Lightweight client-side SPA routing |
| **Charts** | Recharts | Composable React chart primitives |
| **Backend** | Node.js (ESM) + Express 4 | Familiar, fast, minimal overhead |
| **Database** | `node:sqlite` (built-in, `DatabaseSync`) | Zero-dependency, transactional SQLite — no external DB process needed |
| **Streaming** | Server-Sent Events (SSE) | Real-time agent thought streaming without WebSocket complexity |
| **Package manager** | pnpm | Fast, strict, disk-efficient |
| **Containerisation** | Docker + Docker Compose | One-command production deployment |

> **Why `node:sqlite`?** It ships with Node.js ≥ 22 — no native bindings, no `better-sqlite3` compilation step, full synchronous transaction support, and zero extra dependencies. Perfect for a self-contained Intelligence OS.

---

## ✦ Project Structure

```
aureus-ai-command-center/
├── client/                     # React SPA
│   ├── index.html
│   └── src/
│       ├── App.tsx             # Router + page layout
│       ├── lib/
│       │   └── api.ts          # Type-safe fetch + SSE client
│       ├── components/
│       │   ├── WorkspaceLayout.tsx
│       │   └── ui/             # Radix UI primitives
│       └── pages/
│           ├── Home.tsx        # Command Center + swarm stream
│           ├── Portfolio.tsx
│           ├── RiskMatrix.tsx
│           ├── AuditTrail.tsx
│           ├── PolicyCenter.tsx
│           ├── Exceptions.tsx
│           ├── CoreWatchlist.tsx
│           ├── EarningsRadar.tsx
│           ├── StockDetail.tsx
│           └── AnalysisHistory.tsx
├── server/                     # Express API
│   ├── index.ts                # Entry — mounts Vite in dev, serves dist/ in prod
│   ├── db/
│   │   ├── schema.sql          # Relational schema (auto-applied on boot)
│   │   └── index.ts            # DB initialiser + seed data
│   ├── routes/                 # One file per feature domain
│   │   ├── swarm.ts            # SSE stream + HITL execute
│   │   ├── portfolio.ts
│   │   ├── risk.ts
│   │   ├── audit.ts
│   │   ├── history.ts
│   │   ├── policies.ts
│   │   ├── exceptions.ts
│   │   ├── stock.ts
│   │   ├── watchlist.ts
│   │   └── earnings.ts
│   └── services/
│       ├── agentSwarm.ts       # 5-agent pipeline orchestrator
│       ├── mathEngine.ts       # Deterministic VaR / Sharpe / drawdown
│       ├── marketDataService.ts
│       └── secRagService.ts
├── shared/                     # Shared TS types
├── Dockerfile                  # Multi-stage production image
├── docker-compose.yml          # SQLite volume + health check
└── package.json
```

---

## ✦ Quick Start

### Prerequisites
- **Node.js ≥ 22** (required for `node:sqlite`)
- **pnpm ≥ 10** — `npm i -g pnpm`

### Development

```bash
# 1. Clone
git clone https://github.com/Kavaykhurana/Aureus_Ai.git
cd Aureus_Ai

# 2. Install dependencies
pnpm install

# 3. Start (backend + Vite HMR in one command)
pnpm dev
```

Open **http://localhost:3000** — the database is seeded automatically on first boot.

### Production (Docker)

```bash
# Build and run
docker compose up -d

# Logs
docker compose logs -f aureus

# Stop
docker compose down
```

The SQLite database is stored in a named Docker volume (`aureus-data`) and persists across container restarts.

### Production (manual)

```bash
# Build Vite frontend + esbuild server bundle
pnpm build

# Run
NODE_ENV=production node dist/index.js
```

---

## ✦ API Reference

All endpoints are under `/api/`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server status + version |
| `GET` | `/api/swarm/stream?ticker=NVDA` | SSE — live agent thought stream |
| `POST` | `/api/swarm/execute` | Sign + record a trade decision (approve/reject) |
| `GET` | `/api/portfolio` | Full portfolio with holdings + chart data |
| `POST` | `/api/portfolio/holdings` | Add a new holding |
| `GET` | `/api/risk` | VaR, alerts, stress loss, risk dimensions |
| `POST` | `/api/risk/scenario` | Run a stress scenario |
| `GET` | `/api/audit` | Immutable audit log (filterable) |
| `GET` | `/api/history` | Analysis run archive (searchable) |
| `GET` | `/api/policies` | Current guardrail policy set |
| `POST` | `/api/policies` | Save updated policy set |
| `GET` | `/api/exceptions` | Open exception triage queue |
| `POST` | `/api/exceptions/:id/resolve` | Mark exception resolved |
| `GET` | `/api/stock/:ticker` | Deep-dive data for one instrument |
| `GET` | `/api/watchlist` | Watchlist with confidence signals |
| `POST` | `/api/watchlist/toggle` | Arm / mute a watchlist alert |
| `GET` | `/api/earnings` | Upcoming earnings catalysts |
| `POST` | `/api/earnings/toggle` | Arm / mute an earnings alert |

---

## ✦ Database Schema

```sql
portfolio_holdings   -- position weights, shares, cost basis, sector
watchlist            -- tracked symbols, confidence, signal, alert_armed
earnings_catalysts   -- upcoming events, implied move, tone, alert_armed
audit_events         -- immutable log with SHA-256 hash + signed_by
exceptions           -- policy breach triage queue
analysis_history     -- full record of every agent run
policies             -- persisted guardrail configuration
```

The schema is applied automatically via `server/db/schema.sql` on every server boot (idempotent — uses `CREATE TABLE IF NOT EXISTS`).

---

## ✦ Human-in-the-Loop (HITL) Design

When the **Guardrail** agent determines that a trade proposal exceeds policy thresholds (VaR > approval threshold, or position > concentration limit), it opens a **human review checkpoint**. The operator sees:

1. The full agent reasoning chain (all five agents' thoughts)
2. The proposed action, target allocation, and order notional
3. An **Approve** or **Reject** button

On submission, the decision is:
- SHA-256 hashed with the ticker, decision, timestamp, and notional
- Written to `audit_events` with `signed_by = "operator"`
- Returned to the client with the hash for verification

This makes the audit trail **tamper-evident** — any post-hoc modification would invalidate the hash.

---

## ✦ Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Set to `production` to serve built static files |
| `PORT` | `3000` | HTTP server port |
| `VITE_ANALYTICS_ENDPOINT` | *(unset)* | Optional Umami analytics URL |
| `VITE_ANALYTICS_WEBSITE_ID` | *(unset)* | Optional Umami site ID |

No external API keys are required — all market data and agent logic is self-contained.

---

## ✦ Deployment

### Fly.io

```bash
fly launch --dockerfile Dockerfile
fly volumes create aureus_data --size 1
# Add to fly.toml: [mounts] source = "aureus_data", destination = "/app/.data"
fly deploy
```

### Railway / Render

Set `NODE_ENV=production`, point to the repo root, and set the start command to `node dist/index.js`. Mount a persistent volume at `/app/.data`.

---

## ✦ License

MIT © [Kavay Khurana](https://github.com/Kavaykhurana)
