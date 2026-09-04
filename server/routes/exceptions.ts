import { Router, Request, Response } from "express";
import crypto from "node:crypto";
import { db, generateEventHash } from "../db/index.js";

const router = Router();

/**
 * GET /api/exceptions
 * Returns all triage items and exception counts.
 */
router.get("/", (_req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT id, title, details, severity, time, status, owner, ticker, updated_at
    FROM exceptions
    ORDER BY updated_at DESC
  `).all() as Array<{
    id: string;
    title: string;
    details: string;
    severity: string;
    time: string;
    status: string;
    owner: string;
    ticker: string;
    updated_at: string;
  }>;

  const openCount = rows.filter((r) => r.status === "Open").length;

  res.json({
    openCount,
    avgAgeMinutes: 9,
    resolvedToday: 17,
    ownerCoveragePct: 100,
    items: rows,
  });
});

/**
 * POST /api/exceptions/:id/resolve
 * Marks an exception as resolved and records an audit trail event.
 */
router.post("/:id/resolve", (req: Request, res: Response) => {
  const rawId = req.params.id || "";
  const id = rawId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 30);
  if (!id) {
    res.status(400).json({ error: "Invalid exception ID format" });
    return;
  }

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  db.prepare(`
    UPDATE exceptions
    SET status = 'Resolved', updated_at = ?
    WHERE id = ?
  `).run(now.toISOString(), id);

  const hash = generateEventHash(timeStr, "HUMAN", `Exception ${id} resolved`);

  db.prepare(`
    INSERT INTO audit_events (id, time, agent, message, category, tone, hash, signed_by, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    timeStr,
    "HUMAN",
    `Exception ${id} resolved by operator and closed`,
    "Human",
    "positive",
    hash,
    "Elena Rodriguez (Operator)",
    "VERIFIED",
    now.toISOString()
  );

  res.json({
    success: true,
    id,
    status: "Resolved",
  });
});

/**
 * POST /api/exceptions/:id/dismiss
 * Marks an exception as dismissed and records an audit event.
 */
router.post("/:id/dismiss", (req: Request, res: Response) => {
  const rawId = req.params.id || "";
  const id = rawId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 30);
  if (!id) {
    res.status(400).json({ error: "Invalid exception ID format" });
    return;
  }

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  db.prepare(`
    UPDATE exceptions
    SET status = 'Dismissed', updated_at = ?
    WHERE id = ?
  `).run(now.toISOString(), id);

  const hash = generateEventHash(timeStr, "HUMAN", `Exception ${id} dismissed`);

  db.prepare(`
    INSERT INTO audit_events (id, time, agent, message, category, tone, hash, signed_by, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    timeStr,
    "HUMAN",
    `Exception ${id} dismissed by operator without intervention`,
    "Human",
    "neutral",
    hash,
    "Elena Rodriguez (Operator)",
    "VERIFIED",
    now.toISOString()
  );

  res.json({
    success: true,
    id,
    status: "Dismissed",
  });
});

export default router;
