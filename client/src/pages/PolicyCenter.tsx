import { useEffect, useMemo, useState } from "react";
import { Check, LockKeyhole, Save, ShieldAlert, ShieldCheck, SlidersHorizontal, UserCheck, X } from "lucide-react";
import { toast } from "sonner";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import { api, type PolicyData } from "@/lib/api";

export default function PolicyCenter() {
  const [positionLimit, setPositionLimit] = useState(25);
  const [approvalVaR, setApprovalVaR] = useState(2.5);
  const [complianceHardStop, setComplianceHardStop] = useState(true);
  const [twoPersonApproval, setTwoPersonApproval] = useState(false);
  const [saved, setSaved] = useState(true);
  const [policyVersion, setPolicyVersion] = useState("v2.4");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getPolicies()
      .then((data: PolicyData) => {
        setPositionLimit(data.positionLimit);
        setApprovalVaR(data.approvalVaR);
        setComplianceHardStop(data.complianceHardStop ?? true);
        setTwoPersonApproval(data.twoPersonApproval ?? false);
        setPolicyVersion(data.version || "v2.4");
        setSaved(true);
      })
      .catch(() => toast.error("Failed to load policy settings"))
      .finally(() => setLoading(false));
  }, []);

  // Dynamic posture score that immediately recalculates when left-side values change
  const calculatedHealthScore = useMemo(() => {
    let score = 75;

    // Compliance hard stop: critical rule (+15 if active, -30 if bypassed)
    if (complianceHardStop) {
      score += 15;
    } else {
      score -= 30;
    }

    // Two-person approval adds enterprise dual-operator rigor (+6)
    if (twoPersonApproval) {
      score += 6;
    }

    // Single-position limit: 5% strict (+7), 25% baseline (+0), 50% permissive (-10)
    score += Math.round((25 - positionLimit) * 0.38);

    // Approval VaR threshold: 1.0% strict (+6), 2.5% baseline (+0), 5.0% permissive (-8)
    score += Math.round((2.5 - approvalVaR) * 3.2);

    return Math.max(30, Math.min(99, score));
  }, [positionLimit, approvalVaR, complianceHardStop, twoPersonApproval]);

  const postureInfo = useMemo(() => {
    if (calculatedHealthScore >= 90) {
      return {
        label: "Healthy configuration",
        description: "All critical rules are active and synchronized across the agent fabric.",
        color: "#e06c43",
        tone: "decision-badge-approved",
        icon: ShieldCheck,
      };
    }
    if (calculatedHealthScore >= 75) {
      return {
        label: "Balanced configuration",
        description: "Standard risk parameters active. Balanced capital velocity with operator checkpoints.",
        color: "#a47148",
        tone: "decision-badge-quiet",
        icon: ShieldCheck,
      };
    }
    return {
      label: "Permissive posture",
      description: "Warning: relaxed thresholds allow higher concentration risk and reduce automated checkpoints.",
      color: "#c2410c",
      tone: "decision-badge-rejected",
      icon: ShieldAlert,
    };
  }, [calculatedHealthScore]);

  async function savePolicy() {
    try {
      await api.savePolicies({
        positionLimit,
        approvalVaR,
        complianceHardStop,
        twoPersonApproval,
      });
      setSaved(true);
      toast.success("Policy set saved", {
        description: `New guardrail thresholds (${calculatedHealthScore}% posture) applied to live agents.`,
      });
    } catch {
      toast.error("Failed to save policy");
    }
  }

  return (
    <WorkspaceLayout
      eyebrow="Governance controls"
      title="Policy center"
      description="Configure the rules that shape agent recommendations and determine when a human must review a proposed trade."
    >
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
        <section className="panel">
          <div className="panel-header">
            <div>
              <div className="eyebrow">
                <SlidersHorizontal size={11} /> Active policy set
              </div>
              <h2 className="panel-title">Guardrail parameters</h2>
            </div>
            <span className={`decision-badge ${postureInfo.tone}`}>
              {loading ? "…" : `${policyVersion} active`}
            </span>
          </div>

          <div className="policy-form">
            <div className="policy-control">
              <div className="flex items-start justify-between">
                <div>
                  <label>Single position limit</label>
                  <p>Pause execution when a position exceeds this portfolio weight.</p>
                </div>
                <strong>{positionLimit}%</strong>
              </div>
              <input
                type="range"
                className="risk-slider"
                min="5"
                max="50"
                value={positionLimit}
                onChange={(e) => {
                  setPositionLimit(Number(e.target.value));
                  setSaved(false);
                }}
              />
              <div className="policy-scale">
                <span>5% strict</span>
                <span>50% permissive</span>
              </div>
            </div>

            <div className="policy-control">
              <div className="flex items-start justify-between">
                <div>
                  <label>Approval VaR threshold</label>
                  <p>Require explicit operator approval above this 1-day VaR.</p>
                </div>
                <strong>{approvalVaR.toFixed(1)}%</strong>
              </div>
              <input
                type="range"
                className="risk-slider"
                min="1"
                max="5"
                step=".1"
                value={approvalVaR}
                onChange={(e) => {
                  setApprovalVaR(Number(e.target.value));
                  setSaved(false);
                }}
              />
              <div className="policy-scale">
                <span>1.0% strict</span>
                <span>5.0% permissive</span>
              </div>
            </div>

            <div className="policy-toggle-row">
              <div>
                <label>Compliance hard stop</label>
                <p>Never allow restricted-list or sanctions conflicts to proceed.</p>
              </div>
              <button
                type="button"
                className={complianceHardStop ? "toggle-on cursor-pointer" : "toggle-off cursor-pointer"}
                onClick={() => {
                  setComplianceHardStop(!complianceHardStop);
                  setSaved(false);
                }}
                aria-label="Toggle compliance hard stop"
              >
                {complianceHardStop ? (
                  <>
                    <Check size={13} /> On
                  </>
                ) : (
                  <>
                    <X size={13} /> Off
                  </>
                )}
              </button>
            </div>

            <div className="policy-toggle-row">
              <div>
                <label>Require two-person approval</label>
                <p>Escalate trades above $50,000 notional to a second operator.</p>
              </div>
              <button
                type="button"
                className={twoPersonApproval ? "toggle-on cursor-pointer" : "toggle-off cursor-pointer"}
                onClick={() => {
                  setTwoPersonApproval(!twoPersonApproval);
                  setSaved(false);
                }}
                aria-label="Toggle two-person approval"
              >
                {twoPersonApproval ? (
                  <>
                    <UserCheck size={13} /> On
                  </>
                ) : (
                  "Off"
                )}
              </button>
            </div>
          </div>

          <div className="policy-footer">
            <span className="font-mono text-[9px] text-[#a18e87]">
              {saved ? "All changes saved to database" : "Unsaved changes — save to apply"}
            </span>
            <button className="primary-button min-h-[36px] px-4 cursor-pointer" onClick={savePolicy}>
              <Save size={14} /> Save policy set
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <div className="eyebrow">
                <postureInfo.icon size={11} /> Policy health
              </div>
              <h2 className="panel-title">Current posture</h2>
            </div>
          </div>
          <div className="policy-health">
            <div className="health-score" style={{ color: postureInfo.color }}>
              {loading ? "—" : calculatedHealthScore}
              <span>%</span>
            </div>
            <div className="mt-2 text-[12px] font-semibold text-[#4d413b]">
              {postureInfo.label}
            </div>
            <div className="mt-1 text-[11px] leading-5 text-[#8e7970]">
              {postureInfo.description}
            </div>
          </div>
          <div className="mt-5 space-y-3 px-5 pb-5">
            <div className="health-row">
              <span>
                {complianceHardStop ? <Check size={13} /> : <X size={13} className="text-[#c2410c]" />} Restricted list
              </span>
              <b style={{ color: complianceHardStop ? "#6d846a" : "#c2410c" }}>
                {complianceHardStop ? "Enforced" : "Bypassed"}
              </b>
            </div>
            <div className="health-row">
              <span>
                <Check size={13} /> Human checkpoint
              </span>
              <b>
                {twoPersonApproval
                  ? "Dual Operator"
                  : approvalVaR <= 2.5
                  ? "Strict Armed"
                  : "Permissive"}
              </b>
            </div>
            <div className="health-row">
              <span>
                <SlidersHorizontal size={13} /> Position ceiling
              </span>
              <b>
                {positionLimit <= 20 ? "Conservative" : positionLimit <= 35 ? "Moderate" : "Permissive"} ({positionLimit}%)
              </b>
            </div>
            <div className="health-row">
              <span>
                <ShieldCheck size={13} /> VaR threshold
              </span>
              <b>{approvalVaR.toFixed(1)}% 1-day</b>
            </div>
            <div className="health-row">
              <span>
                <LockKeyhole size={13} /> Audit retention
              </span>
              <b>7 years</b>
            </div>
          </div>
        </section>
      </div>
    </WorkspaceLayout>
  );
}
