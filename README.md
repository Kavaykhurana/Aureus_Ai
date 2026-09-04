<div align="center">

<img src="https://img.shields.io/badge/Aureus_AI-Command_Center-f37a0a?style=for-the-badge&labelColor=1a1210" alt="Aureus AI" />

# Aureus AI — Command Center

**An inspectable multi-agent financial intelligence OS.**  
Five AI agents collaborate in real time to analyse equities, model risk, enforce compliance, and propose trade decisions — with a mandatory human-in-the-loop checkpoint before any execution.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Online-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://aureus-ai-command-center.onrender.com)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Kavaykhurana/Aureus_Ai)

<br/>

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-000?style=flat-square&logo=express)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-node%3Asqlite-003b57?style=flat-square&logo=sqlite)](https://nodejs.org/api/sqlite.html)
[![Vite](https://img.shields.io/badge/Vite-7-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](LICENSE)

> 🌐 **Live Public Deployment**: [aureus-ai-command-center.onrender.com](https://aureus-ai-command-center.onrender.com)

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
Live ticker analysis with a real-time SSE thought stream. Watch all five agents reason sequentially before surfacing a recommendation. Includes the **HITL checkpoint** — a one-click approve/reject decision signed with a SHA-256 hash and written permanently to the audit trail.

- Accepts a `?ticker=NVDA` URL parameter to auto-trigger analysis (used by "Run fresh analysis" from Stock Detail and "Re-run" from Analysis History)
- Portfolio performance chart with 1M / 3M / 1Y range switching

### 📊 Portfolio
Live holdings dashboard with 13 pre-seeded positions across Technology, Healthcare, Financials, Consumer, and Industrials sectors.

- **In-app Add Position modal** — add new holdings with ticker, weight, shares, price, and sector; no browser prompts
- **Dynamic chart periods** — 1W / 1M / 3M / 1Y views with distinct SVG path data and S&P 500 benchmark comparison
- **Sector allocation donut** — dynamically recalculates from live holdings data
- **Return % computed server-side** — `(last_price − cost_basis) / cost_basis × 100` on every read
- **CSV Export** — download full holdings ledger as a dated file

### 🛡️ Risk Matrix
Real-time VaR, open alerts, and policy health score with a 5-dimension exposure map.

- **Stress Lab** — four configurable scenarios: Base case, Rate shock, Tech selloff, Liquidity event
- **Simulation outcome card** — shows projected drawdown %, estimated dollar impact, a fill bar, and a direct link to the Exceptions queue if a checkpoint was triggered
- Risk threshold slider (1.0% – 5.0%)

### 📋 Audit Trail
Immutable, cryptographically hashed event log. Every agent action, human decision, and policy change is recorded with a SHA-256 signature and a `signed_by` field — 7-year retention policy.

- Filter by agent type: Analyst, Risk, Compliance, Strategist, Guardrail, Human, System
- Full-text search across event messages
- CSV export of signed audit records

### ⚖️ Policy Center
Configure guardrail parameters in real time with a **live health score** that responds instantly to every slider/toggle change:

- Single-position concentration limit (5–50%)
- VaR threshold that triggers human approval (1–5%)
- Compliance hard stop toggle
- Two-person approval (enterprise dual-operator)
- Dynamic posture label: Healthy / Balanced / Permissive

All policies are persisted to the database and applied on the next analysis run.

### ⚠️ Exceptions
A triage queue for policy breaches, stale evidence windows, and overdue human approvals.

- **Resolve** — marks closed and writes an audit event
- **Dismiss** — records dismissal in the audit log
- **Investigate** — context-aware routing: ticker → Stock Detail, Risk owner → Risk Matrix, Compliance/Guardrail → Policy Center
- Filter by severity (High / Medium / Low) and status (Open / Resolved / Dismissed)

### ⭐ Core Watchlist
14 pre-seeded priority symbols ranked by Aureus signal with live confidence bars.

- **In-app Add Symbol modal** — enter any ticker; server auto-generates price, confidence, and signal
- Alert toggle per symbol (armed/muted) — persisted to database
- Sort by Signal, % Change, or alphabetical
- Click any symbol to navigate to its Stock Detail page

### 📅 Earnings Radar
Upcoming catalyst calendar ranked by implied volatility and portfolio relevance.

- 9 pre-seeded events across NVDA, MU, TSLA, MSFT, GOOGL, FOMC, and others
- **Filter drawer** — filter by Impact level (High / Medium) and Alert status (Armed only)
- **7 / 30 / 90-day horizon selector** — dynamically filters the catalyst list
- **Add Custom Catalyst modal** — add any ticker with timing, impact, implied move, and date
- Per-event alert toggle; armed count reflects in the top metric card
- Next catalyst derived dynamically from the first DB entry

### 🔍 Stock Detail
Deep-dive workspace per ticker with data-driven visualisation.

- **Dynamic intraday sparkline** — rendered from a `priceSeries` array via inline SVG polyline
- **Tabbed content** — Thesis (filing summary), Evidence (agent signals), Risk notes (risk factors)
- **Add to Watchlist / toggle** — pre-checks existing watchlist status on load
- **"Run fresh analysis"** — navigates to `/?ticker=TICKER` and auto-triggers the 5-agent pipeline

### 📁 Analysis History
Full archive of 15 pre-seeded agent runs, fully searchable and filterable.

- Filter by Decision (Approved / Rejected / Pending) and Signal (Bullish / Constructive / Mixed / Bearish)
- Sort by newest, confidence high→low, or confidence low→high
- **View** — opens Stock Detail for that instrument
- **Re-run** — navigates to `/?ticker=TICKER` to launch a fresh 5-agent analysis

---

## ✦ Synthetic Data Layer

The database is seeded automatically on first boot with realistic financial data:

| Table | Entries | Coverage |
|---|---|---|
| `holdings` | 13 positions | NVDA, MSFT, AMZN, META, GOOGL, LLY, JPM, AMD, AVGO, TSM, ASML, CAT, CASH |
| `watchlist` | 14 symbols | All major holdings + AAPL, TSLA, PLTR |
| `catalysts` | 9 events | NVDA, MU, NKE, TSM, CPI, MSFT, GOOGL, FOMC, AMZN |
| `analyses` | 15 runs | Full reasoning records with VaR, Sharpe, thesis summaries |
| `exceptions` | 6 items | Mix of High / Medium / Low severity across all owners |
| `audit_events` | 15 records | SHA-256 hashed entries for all agent types |
| `policies` | 1 active set | Position limit 25%, VaR threshold 2.5%, hard stop enabled |

---

## ✦ Technology Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React 19 + Vite 7 + TypeScript | Fast HMR, type-safe component tree |
| **Styling** | Vanilla CSS + Tailwind CSS v4 | Zero-runtime, design-system tokens |
| **Routing** | Wouter | Lightweight client-side SPA routing |
| **Charts** | Recharts + inline SVG | Composable chart primitives + custom sparklines |
| **Backend** | Node.js (ESM) + Express 4 | Familiar, fast, minimal overhead |
| **Database** | `node:sqlite` (built-in `DatabaseSync`) | Zero-dependency, transactional SQLite — no external DB process |
| **Streaming** | Server-Sent Events (SSE) | Real-time agent thought streaming without WebSocket complexity |
| **Toast** | Sonner | Non-blocking feedback for every user action |
| **Package manager** | pnpm | Fast, strict, disk-efficient |
| **Containerisation** | Docker + Docker Compose | One-command production deployment |

> **Why `node:sqlite`?** Ships with Node.js ≥ 22 — no native bindings, no `better-sqlite3` compilation step, full synchronous transaction support, and zero extra dependencies.

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
│       │   └── WorkspaceLayout.tsx
│       └── pages/
│           ├── Home.tsx        # Command Center + swarm stream + URL param listener
│           ├── Portfolio.tsx   # Holdings, Add modal, period chart, CSV export
│           ├── RiskMatrix.tsx  # Stress Lab + simulation outcome card
│           ├── AuditTrail.tsx  # Hashed event log + agent filter + CSV
│           ├── PolicyCenter.tsx# Live health score + policy sliders
│           ├── Exceptions.tsx  # Resolve / Dismiss / Investigate triage
│           ├── CoreWatchlist.tsx # Add Symbol modal + alert toggle
│           ├── EarningsRadar.tsx # Filter drawer + Add Catalyst modal
│           ├── StockDetail.tsx # Sparkline + tabs + Run fresh analysis
│           └── AnalysisHistory.tsx # View + Re-run + filters
├── server/                     # Express API
│   ├── index.ts                # Entry point
│   ├── db/
│   │   ├── schema.sql          # Relational schema (auto-applied on boot)
│   │   └── index.ts            # DB initialiser + rich synthetic seed data
│   ├── routes/
│   │   ├── swarm.ts            # SSE stream + HITL execute
│   │   ├── portfolio.ts        # Holdings with dynamic return_pct
│   │   ├── risk.ts             # VaR + scenario stress test
│   │   ├── audit.ts            # Immutable event log
│   │   ├── history.ts          # Analysis run archive
│   │   ├── policies.ts         # Guardrail config
│   │   ├── exceptions.ts       # Resolve + dismiss endpoints
│   │   ├── stock.ts            # Per-ticker detail
│   │   ├── watchlist.ts        # Add + toggle alert
│   │   └── earnings.ts         # Add catalyst + toggle alert
│   └── services/
│       ├── agentSwarm.ts       # 5-agent pipeline orchestrator
│       ├── mathEngine.ts       # Deterministic VaR / Sharpe / drawdown
│       ├── marketDataService.ts
│       └── secRagService.ts
├── shared/                     # Shared TS types
├── Dockerfile                  # Multi-stage production image
├── docker-compose.yml          # SQLite volume + health check
├── render.yaml                 # Render.com deployment config
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

Open **http://localhost:3000** — the database seeds automatically on first boot with 13 holdings, 15 analyses, 14 watchlist symbols, 9 earnings catalysts, 6 exceptions, and 15 audit events.

### Production (Docker)

```bash
docker compose up -d        # Build and run
docker compose logs -f      # Stream logs
docker compose down         # Stop
```

The SQLite database is stored in a named Docker volume (`aureus-data`) and persists across restarts.

### Production (manual)

```bash
pnpm build                            # Build Vite + esbuild server
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
| `GET` | `/api/portfolio` | Holdings with dynamic `return_pct` + chart data |
| `POST` | `/api/portfolio/holdings` | Add or rebalance a position |
| `GET` | `/api/risk` | VaR, alerts, stress loss, risk dimensions |
| `POST` | `/api/risk/scenario` | Run a stress scenario |
| `GET` | `/api/audit` | Immutable audit log (filterable, searchable) |
| `GET` | `/api/history` | Analysis run archive |
| `GET` | `/api/policies` | Current guardrail policy set |
| `POST` | `/api/policies` | Save updated policy set |
| `GET` | `/api/exceptions` | Open exception triage queue |
| `POST` | `/api/exceptions/:id/resolve` | Mark resolved + write audit event |
| `POST` | `/api/exceptions/:id/dismiss` | Mark dismissed + write audit event |
| `GET` | `/api/stock/:ticker` | Deep-dive data for one instrument |
| `GET` | `/api/watchlist` | Watchlist with confidence signals |
| `POST` | `/api/watchlist/add` | Add a new symbol (auto-generates price/confidence) |
| `POST` | `/api/watchlist/toggle` | Arm / mute a watchlist alert |
| `GET` | `/api/earnings` | Upcoming earnings catalysts (dynamic next catalyst) |
| `POST` | `/api/earnings/add` | Add a custom catalyst event |
| `POST` | `/api/earnings/toggle` | Arm / mute an earnings alert |

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
| `SQLITE_DB_PATH` | `.data/aureus.db` | Override the SQLite file path (for persistent volume mounts) |
| `VITE_ANALYTICS_ENDPOINT` | *(unset)* | Optional Umami analytics URL |
| `VITE_ANALYTICS_WEBSITE_ID` | *(unset)* | Optional Umami site ID |

No external API keys are required — all market data and agent logic is self-contained.

---

## ✦ Deployment

### Render *(current live deployment)*

The project ships with `render.yaml` for one-click deployment.

1. Fork / push to GitHub
2. Connect the repo in the [Render dashboard](https://dashboard.render.com)
3. Render auto-detects `render.yaml` — build: `pnpm build`, start: `node dist/index.js`
4. Set `NODE_ENV=production` in the environment tab
5. Mount a **Persistent Disk** at `/app/.data` to preserve the SQLite database across deploys

> Every `git push origin main` automatically triggers a new deploy on Render.

### Docker

```bash
docker compose up -d
```

### Fly.io

```bash
fly launch --dockerfile Dockerfile
fly volumes create aureus_data --size 1
# Add to fly.toml: [mounts] source = "aureus_data", destination = "/app/.data"
fly deploy
```

### Railway

Set `NODE_ENV=production`, build command `pnpm build`, start command `node dist/index.js`. Mount a persistent volume at `/app/.data`.

---

## ✦ License

MIT © [Kavay Khurana](https://github.com/Kavaykhurana)
