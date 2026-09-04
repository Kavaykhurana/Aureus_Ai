import { useEffect, useState } from "react";
import { Check, LockKeyhole, Save, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import { api, type PolicyData } from "@/lib/api";

export default function PolicyCenter() {
  const [positionLimit, setPositionLimit] = useState(25);
  const [approvalVaR, setApprovalVaR] = useState(2.5);
  const [saved, setSaved] = useState(true);
  const [healthScore, setHealthScore] = useState(94);
  const [policyVersion, setPolicyVersion] = useState("v2.4");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getPolicies()
      .then((data: PolicyData) => {
        setPositionLimit(data.positionLimit);
        setApprovalVaR(data.approvalVaR);
        setHealthScore(data.healthScore);
        setPolicyVersion(data.version);
        setSaved(true);
      })
      .catch(() => toast.error("Failed to load policy settings"))
      .finally(() => setLoading(false));
  }, []);

  async function savePolicy() {
    try {
      await api.savePolicies({
        positionLimit,
        approvalVaR,
        complianceHardStop: true,
        twoPersonApproval: false,
      });
      setSaved(true);
      toast.success("Policy set saved", {
        description: "New guardrail thresholds will apply to the next analysis.",
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
            <span className="decision-badge decision-badge-approved">
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
              <div className="toggle-on">
                <Check size={13} /> On
              </div>
            </div>

            <div className="policy-toggle-row">
              <div>
                <label>Require two-person approval</label>
                <p>Escalate trades above $50,000 notional to a second operator.</p>
              </div>
              <button
                className="toggle-off"
                onClick={() =>
                  toast("Two-person approval", {
                    description:
                      "This policy is available to enable in your enterprise configuration.",
                  })
                }
              >
                Off
              </button>
            </div>
          </div>

          <div className="policy-footer">
            <span className="font-mono text-[9px] text-[#a18e87]">
              {saved ? "All changes saved to database" : "Unsaved changes — save to apply"}
            </span>
            <button className="primary-button min-h-[36px] px-4" onClick={savePolicy}>
              <Save size={14} /> Save policy set
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <div className="eyebrow">
                <ShieldCheck size={11} /> Policy health
              </div>
              <h2 className="panel-title">Current posture</h2>
            </div>
          </div>
          <div className="policy-health">
            <div className="health-score">
              {loading ? "—" : healthScore}
              <span>%</span>
            </div>
            <div className="mt-2 text-[12px] font-semibold text-[#4d413b]">
              Healthy configuration
            </div>
            <div className="mt-1 text-[11px] leading-5 text-[#8e7970]">
              All critical rules are active and synchronized across the agent fabric.
            </div>
          </div>
          <div className="mt-5 space-y-3 px-5 pb-5">
            <div className="health-row">
              <span>
                <Check size={13} /> Restricted list
              </span>
              <b>Passed</b>
            </div>
            <div className="health-row">
              <span>
                <Check size={13} /> Human checkpoint
              </span>
              <b>Armed</b>
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
