-- Aureus AI Financial Intelligence Platform Schema

CREATE TABLE IF NOT EXISTS portfolios (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  total_value REAL NOT NULL,
  cash REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS holdings (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL,
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  weight REAL NOT NULL,
  shares REAL NOT NULL,
  last_price REAL NOT NULL,
  cost_basis REAL NOT NULL,
  return_pct REAL NOT NULL,
  sector TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'green',
  updated_at TEXT NOT NULL,
  FOREIGN KEY (portfolio_id) REFERENCES portfolios(id)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  time TEXT NOT NULL,
  agent TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'neutral',
  hash TEXT NOT NULL,
  signed_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'VERIFIED',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  ticker TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  signal TEXT NOT NULL,
  decision TEXT NOT NULL,
  confidence REAL NOT NULL,
  var_95 REAL NOT NULL,
  sharpe_ratio REAL NOT NULL,
  compliance_status TEXT NOT NULL,
  proposed_action TEXT NOT NULL,
  target_allocation REAL NOT NULL,
  thesis_summary TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'positive',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS policies (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  position_limit REAL NOT NULL DEFAULT 25.0,
  approval_var_threshold REAL NOT NULL DEFAULT 2.5,
  compliance_hard_stop INTEGER NOT NULL DEFAULT 1,
  two_person_approval INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exceptions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  details TEXT NOT NULL,
  severity TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open',
  owner TEXT NOT NULL,
  ticker TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS watchlist (
  ticker TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  change_pct REAL NOT NULL,
  confidence REAL NOT NULL,
  signal TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'green',
  alert_armed INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS catalysts (
  id TEXT PRIMARY KEY,
  date_str TEXT NOT NULL,
  ticker TEXT NOT NULL,
  title TEXT NOT NULL,
  timing TEXT NOT NULL,
  impact TEXT NOT NULL,
  move_str TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'orange',
  alert_armed INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
