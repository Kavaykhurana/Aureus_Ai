import { useEffect, useState } from "react";
import { ArrowUpRight, Clock3, FileClock, Play, Search, SlidersHorizontal } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import { api, type AnalysisRecord } from "@/lib/api";

function signalTone(signal: string) {
  if (["Bullish", "Constructive"].includes(signal)) return "positive";
  if (["Bearish", "Mixed"].includes(signal)) return "warning";
  return "neutral";
}

export default function AnalysisHistory() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [runs, setRuns] = useState<AnalysisRecord[]>([]);
  const [totalRuns, setTotalRuns] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    api
      .getHistory(query)
      .then((data) => {
        setRuns(data.runs);
        setTotalRuns(data.totalRuns);
      })
      .catch(() => toast.error("Failed to load analysis history"))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [query]);

  return (
    <WorkspaceLayout
      eyebrow="Decision memory"
      title="Analysis history"
      description="Replay prior agent runs, compare decisions, and return to the command center with context intact."
    >
      <div className="history-hero mt-5">
        <div>
          <div className="eyebrow">
            <FileClock size={11} /> Saved intelligence
          </div>
          <h2 className="mt-3 font-display text-[32px] tracking-[-.04em] text-[#242424]">
            Every decision leaves a trail.
          </h2>
          <p className="mt-2 max-w-lg text-[12px] leading-5 text-[#8e7970]">
            Aureus keeps the full reasoning chain behind every run so your team can review what
            changed, why it changed, and who approved it.
          </p>
        </div>
        <div className="history-count">
          <span className="font-display text-[40px]">{totalRuns}</span>
          <span className="font-mono text-[9px] uppercase tracking-[.12em] text-[#9c8982]">
            saved runs
          </span>
        </div>
      </div>

      <section className="panel mt-5">
        <div className="panel-header">
          <div>
            <div className="eyebrow">
              <Clock3 size={11} /> Run archive
            </div>
            <h2 className="panel-title">Recent analyses</h2>
          </div>
          <div className="flex gap-2">
            <div className="mini-search">
              <Search size={14} />
              <input
                aria-label="Search analysis history"
                placeholder="Search ticker or decision"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button
              className="secondary-button"
              onClick={() =>
                toast("History filters", {
                  description: "Filter drawer is ready for date, agent, and decision filters.",
                })
              }
            >
              <SlidersHorizontal size={14} /> Filter
            </button>
          </div>
        </div>

        <div className="history-list">
          {loading && (
            <div className="px-5 py-10 text-center text-[11px] text-[#9c8982]">
              Loading analysis history…
            </div>
          )}
          {!loading &&
            runs.map((run) => (
              <div className="history-row" key={run.id}>
                <div className="ticker-avatar">{run.ticker.slice(0, 1)}</div>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-[#40332c]">
                    {run.ticker} analysis
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-[#a18e87]">
                    <Clock3 size={11} />
                    {new Date(run.timestamp).toLocaleString()} · {run.signal} signal
                  </div>
                </div>
                <div className={`history-decision history-decision-${signalTone(run.signal)}`}>
                  {run.decision}
                </div>
                <div className="hidden text-right sm:block">
                  <div className="font-mono text-[11px] text-[#594941]">
                    {run.confidence}%
                  </div>
                  <div className="mt-1 text-[9px] text-[#a18e87]">confidence</div>
                </div>
                <button
                  className="history-replay"
                  onClick={() => {
                    setLocation(`/stock/${run.ticker}`);
                    toast(`${run.ticker} run opened`, {
                      description: "Position detail loaded from analysis history.",
                    });
                  }}
                >
                  <Play size={13} fill="currentColor" /> Replay
                </button>
                <ArrowUpRight size={14} className="text-[#b39e94]" />
              </div>
            ))}
          {!loading && !runs.length && (
            <div className="px-5 py-10 text-center text-[11px] text-[#9c8982]">
              No saved runs match your search.
            </div>
          )}
        </div>
      </section>
    </WorkspaceLayout>
  );
}
