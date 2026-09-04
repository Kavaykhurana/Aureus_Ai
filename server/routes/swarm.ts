import { Router, Request, Response } from "express";
import crypto from "node:crypto";
import { AgentSwarmOrchestrator, AgentThought } from "../services/agentSwarm.js";
import { db, generateEventHash } from "../db/index.js";

const router = Router();

/**
 * GET /api/swarm/stream?ticker={ticker}
 * Server-Sent Events (SSE) thought stream for the 5-agent swarm pipeline.
 */
router.get("/stream", async (req: Request, res: Response) => {
  const ticker = (req.query.ticker as string)?.toUpperCase() || "NVDA";

  // SSE Response Headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  let isClosed = false;
  req.on("close", () => {
    isClosed = true;
  });

  const sendEvent = (event: string, data: unknown) => {
    if (isClosed) return;
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    sendEvent("PIPELINE_START", {
      ticker,
      message: `Analysis run initialized for ${ticker} · 5-agent sequence queued`,
      timestamp: Date.now(),
    });

    const result = await AgentSwarmOrchestrator.executePipeline(ticker, (thought: AgentThought) => {
      sendEvent("AGENT_THOUGHT", thought);
    });

    // Save analysis run to database
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const timestampStr = `${dateStr} · ${timeStr}`;

    db.prepare(`
      INSERT INTO analyses (
        id, ticker, timestamp, signal, decision, confidence,
        var_95, sharpe_ratio, compliance_status, proposed_action,
        target_allocation, thesis_summary, tone, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      ticker,
      timestampStr,
      result.analyst.signal,
      result.guardrail.requiresApproval ? "Pending" : "Approved",
      result.strategist.confidence,
      result.risk.var95Pct,
      result.risk.sharpeRatio,
      result.compliance.status,
      result.strategist.proposedAction,
      result.strategist.targetAllocationPct,
      result.analyst.summary,
      result.analyst.signal === "Bullish" ? "positive" : result.analyst.signal === "Bearish" ? "warning" : "neutral",
      now.toISOString()
    );

    // If approval checkpoint is opened, log to audit trail
    if (result.guardrail.requiresApproval) {
      const hash = generateEventHash(timeStr, "GUARDRAIL", `${ticker} checkpoint opened`);
      db.prepare(`
        INSERT INTO audit_events (id, time, agent, message, category, tone, hash, signed_by, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        crypto.randomUUID(),
        timeStr,
        "GUARDRAIL",
        `Human approval checkpoint opened for ${ticker} · ${result.guardrail.ruleTriggered}`,
        "Guardrail",
        "warning",
        hash,
        "ExecutionGuardrail-05",
        "VERIFIED",
        now.toISOString()
      );
    }

    sendEvent("PIPELINE_COMPLETE", result);
    res.end();
  } catch (error) {
    sendEvent("ERROR", { error: String(error) });
    res.end();
  }
});

/**
 * POST /api/swarm/execute
 * Human-in-the-Loop decision submission (approve or reject trade proposal).
 */
router.post("/execute", (req: Request, res: Response) => {
  const { ticker, decision, orderNotional = 25000, targetAllocation = "3.5%", notes } = req.body;

  if (!ticker || !decision) {
    res.status(400).json({ error: "Missing ticker or decision in request payload" });
    return;
  }

  const approved = decision === "approved";
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

  const message = approved
    ? `${ticker} order approved ($${Number(orderNotional).toLocaleString()}) · execution confirmed`
    : `${ticker} order rejected · execution blocked${notes ? ` (${notes})` : ""}`;

  const hash = generateEventHash(timeStr, "HUMAN", message);

  // 1. Log cryptographic audit trail record
  db.prepare(`
    INSERT INTO audit_events (id, time, agent, message, category, tone, hash, signed_by, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    timeStr,
    "HUMAN",
    message,
    "Human",
    approved ? "positive" : "warning",
    hash,
    "Elena Rodriguez (Operator)",
    "VERIFIED",
    now.toISOString()
  );

  // 2. If approved, update portfolio holdings and cash
  if (approved) {
    const sym = ticker.toUpperCase();
    const existing = db.prepare("SELECT * FROM holdings WHERE ticker = ?").get() as {
      id: string;
      shares: number;
      weight: number;
    } | undefined;

    if (existing) {
      db.prepare(`
        UPDATE holdings
        SET weight = weight + 1.2, shares = shares + 50, updated_at = ?
        WHERE ticker = ?
      `).run(now.toISOString(), sym);
    } else {
      db.prepare(`
        INSERT INTO holdings (id, portfolio_id, ticker, name, weight, shares, last_price, cost_basis, return_pct, sector, tone, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        crypto.randomUUID(),
        "main-portfolio",
        sym,
        `${sym} Corp`,
        parseFloat(targetAllocation) || 3.5,
        100,
        150.00,
        150.00,
        0.0,
        "Technology",
        "green",
        now.toISOString()
      );
    }

    // Deduct cash from portfolio
    db.prepare(`
      UPDATE portfolios
      SET cash = MAX(0, cash - ?), updated_at = ?
      WHERE id = 'main-portfolio'
    `).run(Number(orderNotional) * 0.1, now.toISOString());
  } else {
    // If rejected, create an exception record
    const exceptionId = `EX-${Math.floor(1000 + Math.random() * 9000)}`;
    db.prepare(`
      INSERT INTO exceptions (id, title, details, severity, time, status, owner, ticker, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      exceptionId,
      "Order execution rejected by operator",
      `Proposal for ${ticker} was declined by human operator during guardrail checkpoint.`,
      "Medium",
      timeStr.slice(0, 5),
      "Acknowledged",
      "Guardrail",
      ticker,
      now.toISOString()
    );
  }

  // Update corresponding analysis decision if present
  db.prepare(`
    UPDATE analyses
    SET decision = ?
    WHERE ticker = ? AND decision = 'Pending'
  `).run(approved ? "Approved" : "Rejected", ticker.toUpperCase());

  res.json({
    success: true,
    decision,
    ticker,
    timestamp: now.toISOString(),
    auditHash: hash,
    message,
  });
});

export default router;
