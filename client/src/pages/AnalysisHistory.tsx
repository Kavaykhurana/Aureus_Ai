import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Check, Clock3, FileClock, Filter, Play, RotateCcw, Search, SlidersHorizontal, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import { api, type AnalysisRecord } from "@/lib/api";

function signalTone(signal: string) {
  if (["Bullish", "Constructive"].includes(signal)) return "positive";
  if (["Bearish", "Mixed"].includes(signal)) return "warning";
  return "neutral";
}

function formatTimestamp(ts: string, createdAt?: string) {
  if (!ts || ts === "Invalid Date") {
    return createdAt ? new Date(createdAt).toLocaleString() : "Recently";
  }
  if (ts.includes("T") && ts.includes("Z")) {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? ts : d.toLocaleString();
  }
  return ts;
}

export default function AnalysisHistory() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [runs, setRuns] = useState<AnalysisRecord[]>([]);
  const [totalRuns, setTotalRuns] = useState(0);
  const [loading, setLoading] = useState(true);

  // Interactive filters
  const [filterOpen, setFilterOpen] = useState(false);
  const [decisionFilter, setDecisionFilter] = useState<string>("All");
  const [signalFilter, setSignalFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"newest" | "confidence_desc" | "confidence_asc">("newest");

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

  const activeFilterCount = (decisionFilter !== "All" ? 1 : 0) + (signalFilter !== "All" ? 1 : 0);

  const filteredRuns = useMemo(() => {
    return runs
      .filter((run) => {
        const matchesDecision =
          decisionFilter === "All" ||
          run.decision.toLowerCase() === decisionFilter.toLowerCase();
        const matchesSignal =
          signalFilter === "All" ||
          run.signal.toLowerCase() === signalFilter.toLowerCase();
        return matchesDecision && matchesSignal;
      })
      .sort((a, b) => {
        if (sortBy === "confidence_desc") return b.confidence - a.confidence;
        if (sortBy === "confidence_asc") return a.confidence - b.confidence;
        return 0; // Default order is newest from server
      });
  }, [runs, decisionFilter, signalFilter, sortBy]);

  function resetFilters() {
    setDecisionFilter("All");
    setSignalFilter("All");
    setSortBy("newest");
    setQuery("");
  }

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
          <div className="flex items-center gap-2">
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
              className={`secondary-button cursor-pointer ${
                filterOpen || activeFilterCount > 0 ? "border-[#e06c43] bg-[#fff0eb] text-[#e06c43]" : ""
              }`}
              onClick={() => setFilterOpen(!filterOpen)}
              aria-label="Toggle filters"
            >
              <SlidersHorizontal size={14} />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-[#e06c43] px-1.5 py-0.2 font-mono text-[9px] text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Expandable Filter Bar */}
        {filterOpen && (
          <div className="border-b border-[#f0ebea] bg-[#fcf8f5] px-5 py-3 transition-all">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] uppercase text-[#a18e87]">Decision:</span>
                  <div className="flex items-center gap-1">
                    {["All", "Approved", "Rejected", "Pending"].map((dec) => (
                      <button
                        key={dec}
                        onClick={() => setDecisionFilter(dec)}
                        className={`cursor-pointer rounded-md px-2 py-1 font-mono text-[10px] transition-colors ${
                          decisionFilter === dec
                            ? "bg-[#e06c43] text-white"
                            : "bg-[#f1e8e2] text-[#6d5b52] hover:bg-[#e7dcde]"
                        }`}
                      >
                        {dec}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] uppercase text-[#a18e87]">Signal:</span>
                  <div className="flex items-center gap-1">
                    {["All", "Bullish", "Constructive", "Mixed", "Bearish"].map((sig) => (
                      <button
                        key={sig}
                        onClick={() => setSignalFilter(sig)}
                        className={`cursor-pointer rounded-md px-2 py-1 font-mono text-[10px] transition-colors ${
                          signalFilter === sig
                            ? "bg-[#e06c43] text-white"
                            : "bg-[#f1e8e2] text-[#6d5b52] hover:bg-[#e7dcde]"
                        }`}
                      >
                        {sig}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] uppercase text-[#a18e87]">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="cursor-pointer rounded-md border border-[#e2d6d0] bg-white px-2 py-1 font-mono text-[10px] text-[#594941]"
                  >
                    <option value="newest">Newest first</option>
                    <option value="confidence_desc">Confidence: High → Low</option>
                    <option value="confidence_asc">Confidence: Low → High</option>
                  </select>
                </div>
              </div>

              {(activeFilterCount > 0 || query !== "") && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 font-mono text-[10px] text-[#9c8982] hover:text-[#e06c43]"
                >
                  <RotateCcw size={11} /> Reset all
                </button>
              )}
            </div>
          </div>
        )}

        <div className="history-list">
          {loading && (
            <div className="px-5 py-10 text-center text-[11px] text-[#9c8982]">
              Loading analysis history…
            </div>
          )}
          {!loading &&
            filteredRuns.map((run) => (
              <div className="history-row" key={run.id}>
                <div className="ticker-avatar">{run.ticker.slice(0, 1)}</div>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-[#40332c]">
                    {run.ticker} analysis
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-[#a18e87]">
                    <Clock3 size={11} />
                    {formatTimestamp(run.timestamp, (run as any).created_at)} · {run.signal} signal
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
                <div className="flex items-center gap-2">
                  <button
                    className="history-replay cursor-pointer"
                    onClick={() => {
                      setLocation(`/stock/${run.ticker}`);
                      toast(`${run.ticker} opened`, {
                        description: "Position detail loaded from analysis history.",
                      });
                    }}
                  >
                    <Play size={13} fill="currentColor" /> View
                  </button>
                  <button
                    className="secondary-button text-[10px]"
                    title="Re-run 5-agent analysis"
                    onClick={() => {
                      setLocation(`/?ticker=${run.ticker}`);
                      toast(`Re-running ${run.ticker}`, {
                        description: "Fresh 5-agent pipeline launching.",
                      });
                    }}
                  >
                    <Zap size={12} /> Re-run
                  </button>
                </div>
                <ArrowUpRight size={14} className="text-[#b39e94]" />
              </div>
            ))}
          {!loading && !filteredRuns.length && (
            <div className="px-5 py-10 text-center text-[11px] text-[#9c8982]">
              No saved runs match your active search or filter criteria.
            </div>
          )}
        </div>
      </section>
    </WorkspaceLayout>
  );
}
