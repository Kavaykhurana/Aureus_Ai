import { Router, Request, Response } from "express";
import { db } from "../db/index.js";

const router = Router();

/**
 * GET /api/policies
 * Returns active policy set and parameters.
 */
router.get("/", (_req: Request, res: Response) => {
  const policy = (db.prepare("SELECT * FROM policies WHERE id = 'active-policy'").get() as {
    version: string;
    position_limit: number;
    approval_var_threshold: number;
    compliance_hard_stop: number;
    two_person_approval: number;
    updated_at: string;
  }) || {
    version: "v2.4",
    position_limit: 25.0,
    approval_var_threshold: 2.5,
    compliance_hard_stop: 1,
    two_person_approval: 0,
    updated_at: new Date().toISOString(),
  };

  res.json({
    version: policy.version,
    positionLimit: policy.position_limit,
    approvalVaR: policy.approval_var_threshold,
    complianceHardStop: Boolean(policy.compliance_hard_stop),
    twoPersonApproval: Boolean(policy.two_person_approval),
    healthScore: 94,
    updatedAt: policy.updated_at,
  });
});

/**
 * POST /api/policies
 * Updates active guardrail policy parameters.
 */
router.post("/", (req: Request, res: Response) => {
  const { positionLimit, approvalVaR, complianceHardStop, twoPersonApproval } = req.body;

  const now = new Date().toISOString();

  const rawLimit = Number(positionLimit);
  const rawVaR = Number(approvalVaR);

  const cleanLimit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1.0), 100.0) : 25.0;
  const cleanVaR = Number.isFinite(rawVaR) ? Math.min(Math.max(rawVaR, 0.1), 50.0) : 2.5;

  db.prepare(`
    UPDATE policies
    SET position_limit = ?, approval_var_threshold = ?, compliance_hard_stop = ?, two_person_approval = ?, updated_at = ?
    WHERE id = 'active-policy'
  `).run(
    cleanLimit,
    cleanVaR,
    complianceHardStop !== undefined ? (complianceHardStop ? 1 : 0) : 1,
    twoPersonApproval !== undefined ? (twoPersonApproval ? 1 : 0) : 0,
    now
  );

  res.json({
    success: true,
    message: "Policy set updated successfully",
    updatedAt: now,
  });
});

export default router;
