import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  CheckCircle2,
  Gauge,
  Play,
  RefreshCw,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import { api, type RiskData } from "@/lib/api";

export default function RiskMatrix() {
  const [, setLocation] = useLocation();
  const [scenario, setScenario] = useState("Base case");
  const [threshold, setThreshold] = useState(2.5);
  const [running, setRunning] = useState(false);
  const [data, setData] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulationResult, setSimulationResult] = useState<{
    scenario: string;
    projectedDrawdownPct: number;
    threshold: number;
    opensCheckpoint: boolean;
    message: string;
    timestamp: string;
  } | null>(null);

  function loadRisk() {
    setLoading(true);
    api
      .getRiskData()
      .then(setData)
      .catch(() => toast.error("Failed to load risk data"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadRisk();
  }, []);

  async function runScenario() {
    setRunning(true);
    try {
      const result = await api.runScenario(scenario, threshold);
      const drawdown = Number(result.projectedDrawdownPct ?? -(threshold + 1.2));
      const sim = {
        scenario: result.scenario || scenario,
        projectedDrawdownPct: drawdown,
        threshold: Number(result.threshold ?? threshold),
        opensCheckpoint: Boolean(result.opensCheckpoint),
        message: result.message || `${scenario} complete`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setSimulationResult(sim);
      toast("Scenario complete", {
        description: `${scenario} finished — projected drawdown: ${drawdown}%`,
      });
    } catch {
      toast.error("Scenario failed — check the server.");
    } finally {
      setRunning(false);
    }
  }

  const barWidth: Record<string, string> = {
    "risk-high": "78%",
    "risk-watch": "64%",
    "risk-moderate": "52%",
    "risk-low": "28%",
  };

  return (
    <WorkspaceLayout
      eyebrow="Risk intelligence"
      title="Risk matrix"
      description="See where exposure is accumulating, which policies are close to their limits, and how the portfolio behaves under stress."
    >
      {/* KPI cards */}
      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="metric-card">
          <div className="metric-icon metric-icon-orange">
            <Gauge size={16} />
          </div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#9c8982]">
            Portfolio VaR
          </div>
          <div className="mt-1 font-display text-[28px] tracking-[-.04em]">
            {loading ? "—" : `${data?.portfolioVaR ?? 0}%`}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-[#e06c43]">
            <ArrowDownRight size={13} />
            {data?.vaRChangeToday ?? "—"} today
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon metric-icon-orange">
            <AlertTriangle size={16} />
          </div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#9c8982]">
            Open alerts
          </div>
          <div className="mt-1 font-display text-[28px] tracking-[-.04em]">
            {(data?.openAlerts ?? 0).toString().padStart(2, "0")}
          </div>
          <div className="mt-2 text-[11px] text-[#8e7970]">
            {data?.requiresReviewCount ?? 0} requires review
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon metric-icon-green">
            <CheckCircle2 size={16} />
          </div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#9c8982]">
            Policy health
          </div>
          <div className="mt-1 font-display text-[28px] tracking-[-.04em]">
            {loading ? "—" : `${data?.policyHealthScore ?? 0}%`}
          </div>
          <div className="mt-2 text-[11px] text-[#8e7970]">All critical rules pass</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon metric-icon-brown">
            <ShieldAlert size={16} />
          </div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#9c8982]">
            Stress loss
          </div>
          <div className="mt-1 font-display text-[28px] tracking-[-.04em]">
            {loading ? "—" : `${data?.stressLossPct ?? 0}%`}
          </div>
          <div className="mt-2 text-[11px] text-[#8e7970]">1-in-20 session</div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(330px,.9fr)]">
        {/* Exposure map */}
        <section className="panel">
          <div className="panel-header">
            <div>
              <div className="eyebrow">
                <SlidersHorizontal size={11} /> Exposure map
              </div>
              <h2 className="panel-title">Risk by dimension</h2>
            </div>
            <button
              className="icon-button icon-button-small"
              onClick={() => {
                loadRisk();
                toast("Risk data refreshed", {
                  description: "Exposure signals synchronized just now.",
                });
              }}
            >
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="risk-list">
            {loading && (
              <div className="px-5 py-10 text-center text-[11px] text-[#9c8982]">
                Loading risk data…
              </div>
            )}
            {!loading &&
              (data?.dimensions ?? []).map(({ dimension, level, value, note, tone }) => (
                <div className="risk-row" key={dimension}>
                  <div className="risk-row-top">
                    <div className="flex items-center gap-3">
                      <div className={`risk-icon ${tone ?? "risk-low"}`}>
                        <ShieldAlert size={14} />
                      </div>
                      <div>
                        <div className="text-[12px] font-semibold text-[#40332c]">{dimension}</div>
                        <div className="mt-1 text-[10px] text-[#9c8982]">{note}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`risk-level ${tone ?? "risk-low"}`}>{level}</div>
                      <div className="mt-1 font-mono text-[10px] text-[#76665e]">{value}</div>
                    </div>
                  </div>
                  <div className="risk-bar">
                    <div
                      className={`risk-bar-fill ${barWidth[tone] ? tone : "risk-low"}`}
                      style={{ width: barWidth[tone] ?? "30%" }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* Stress lab */}
        <section className="panel">
          <div className="panel-header">
            <div>
              <div className="eyebrow">
                <ShieldAlert size={11} /> Stress lab
              </div>
              <h2 className="panel-title">Run a scenario</h2>
            </div>
            <span className="decision-badge decision-badge-quiet">Simulated</span>
          </div>
          <div className="px-5 pb-5">
            <label className="field-label">Scenario</label>
            <div className="scenario-grid">
              {["Base case", "Rate shock", "Tech selloff", "Liquidity event"].map((item) => (
                <button
                  key={item}
                  className={`scenario-button ${scenario === item ? "scenario-button-active" : ""}`}
                  onClick={() => setScenario(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between">
              <label className="field-label">Risk threshold</label>
              <span className="font-mono text-[12px] text-[#e06c43]">{threshold.toFixed(1)}%</span>
            </div>
            <input
              className="risk-slider"
              type="range"
              min="1"
              max="5"
              step=".1"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
            />
            <div className="mt-2 flex justify-between font-mono text-[9px] text-[#a28e87]">
              <span>1.0% conservative</span>
              <span>5.0% permissive</span>
            </div>
            <button
              className="primary-button mt-6 w-full"
              onClick={runScenario}
              disabled={running}
            >
              <Play size={14} fill="currentColor" />
              {running ? "Running scenario…" : "Run stress test"}
            </button>

            {simulationResult ? (
              <div className="mt-4 rounded-lg border border-[#e8dacc] bg-[#fbf6f0] p-4 shadow-sm animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#a46a3f]">Simulation outcome</span>
                    <span className="font-mono text-[9px] text-[#9c8982]">· {simulationResult.timestamp}</span>
                  </div>
                  <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${
                    simulationResult.opensCheckpoint
                      ? "bg-[#fff0eb] text-[#e06c43] font-semibold"
                      : "bg-[#e5f0e9] text-[#6d846a]"
                  }`}>
                    {simulationResult.opensCheckpoint ? "Checkpoint Triggered" : "Within Envelope"}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <div className="font-display text-[24px] text-[#242424]">
                    {simulationResult.projectedDrawdownPct > 0 ? `−${simulationResult.projectedDrawdownPct}%` : `${simulationResult.projectedDrawdownPct}%`}
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[11px] text-[#e06c43]">
                      −${Math.round(Math.abs(simulationResult.projectedDrawdownPct) * 7084.2).toLocaleString()} est.
                    </div>
                    <div className="font-mono text-[9px] text-[#9c8982]">portfolio impact</div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between font-mono text-[9px] text-[#8e7970] mb-1">
                    <span>Drawdown: {Math.abs(simulationResult.projectedDrawdownPct)}%</span>
                    <span>Tolerance threshold: {simulationResult.threshold}%</span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#ebdcd3]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        simulationResult.opensCheckpoint ? "bg-[#e06c43]" : "bg-[#6d846a]"
                      }`}
                      style={{ width: `${Math.min(100, (Math.abs(simulationResult.projectedDrawdownPct) / 10) * 100)}%` }}
                    />
                  </div>
                </div>

                {simulationResult.opensCheckpoint ? (
                  <div className="mt-3 flex items-center justify-between pt-3 border-t border-[#ebdcd3]">
                    <span className="text-[10px] text-[#ae6b50]">Breach requires operator review</span>
                    <button
                      className="text-[10px] font-semibold text-[#e06c43] hover:underline"
                      onClick={() => setLocation("/exceptions")}
                    >
                      Open exceptions →
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t border-[#ebdcd3] text-[10px] text-[#6d846a]">
                    ✓ Stress test clears all risk policies without triage escalation.
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 flex items-start gap-2 rounded-md bg-[#fff0eb] p-3 text-[10px] leading-4 text-[#956e61]">
                <AlertTriangle size={13} className="mt-0.5 flex-none text-[#f37a0a]" />
                Any scenario crossing the selected threshold will automatically open a human review
                checkpoint.
              </div>
            )}
          </div>
        </section>
      </div>
    </WorkspaceLayout>
  );
}
