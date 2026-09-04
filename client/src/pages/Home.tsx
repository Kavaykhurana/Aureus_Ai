import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  CircleDollarSign,
  Clock3,
  Command,
  FileCheck2,
  Gauge,
  GitBranch,
  Hexagon,
  LineChart as LineChartIcon,
  LockKeyhole,
  Menu,
  MoreHorizontal,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { api, SwarmResult, SwarmThought } from "@/lib/api";


type AgentStatus = "idle" | "running" | "completed" | "flagged";
type Decision = "pending" | "approved" | "rejected";

type Agent = {
  id: string;
  name: string;
  short: string;
  description: string;
  icon: typeof BrainCircuit;
  color: string;
};

type FeedItem = {
  id: number;
  time: string;
  agent: string;
  message: string;
  tone: string;
};

const agents: Agent[] = [
  {
    id: "analyst",
    name: "Analyst",
    short: "01",
    description: "Signal & sentiment",
    icon: BrainCircuit,
    color: "#a46a3f",
  },
  {
    id: "risk",
    name: "Risk",
    short: "02",
    description: "Exposure & VaR",
    icon: Gauge,
    color: "#b78757",
  },
  {
    id: "compliance",
    name: "Compliance",
    short: "03",
    description: "Policy & constraints",
    icon: ShieldCheck,
    color: "#6c8369",
  },
  {
    id: "strategist",
    name: "Strategist",
    short: "04",
    description: "Allocation & thesis",
    icon: GitBranch,
    color: "#87654d",
  },
  {
    id: "guardrail",
    name: "Execution guardrail",
    short: "05",
    description: "Human checkpoint",
    icon: LockKeyhole,
    color: "#c3863f",
  },
];

const chartData = [
  { month: "Apr 01", portfolio: 100, benchmark: 100 },
  { month: "Apr 08", portfolio: 101.8, benchmark: 100.9 },
  { month: "Apr 15", portfolio: 101.2, benchmark: 101.8 },
  { month: "Apr 22", portfolio: 103.1, benchmark: 102.4 },
  { month: "Apr 29", portfolio: 102.8, benchmark: 103.2 },
  { month: "May 06", portfolio: 105.4, benchmark: 104.1 },
  { month: "May 13", portfolio: 104.9, benchmark: 104.7 },
  { month: "May 20", portfolio: 107.3, benchmark: 105.9 },
  { month: "May 27", portfolio: 108.4, benchmark: 106.8 },
  { month: "Jun 03", portfolio: 110.1, benchmark: 108.1 },
  { month: "Jun 10", portfolio: 109.5, benchmark: 108.8 },
  { month: "Jun 17", portfolio: 112.7, benchmark: 110.2 },
];

const initialStatuses: Record<string, AgentStatus> = {
  analyst: "idle",
  risk: "idle",
  compliance: "idle",
  strategist: "idle",
  guardrail: "idle",
};

const initialFeed: FeedItem[] = [
  {
    id: 1,
    time: "09:41:08",
    agent: "SYSTEM",
    message: "Awaiting a new ticker analysis request",
    tone: "neutral",
  },
  {
    id: 2,
    time: "09:40:52",
    agent: "GUARDRAIL",
    message: "Human approval policy loaded · v2.4",
    tone: "positive",
  },
  {
    id: 3,
    time: "09:40:49",
    agent: "COMPLIANCE",
    message: "Restricted list synced · 4,208 issuers checked",
    tone: "positive",
  },
];

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

function statusLabel(status: AgentStatus) {
  if (status === "running") return "Thinking";
  if (status === "completed") return "Complete";
  if (status === "flagged") return "Flagged";
  return "Standby";
}

function statusClass(status: AgentStatus) {
  if (status === "running") return "status-running";
  if (status === "completed") return "status-complete";
  if (status === "flagged") return "status-flagged";
  return "status-idle";
}

function MetricCard({
  label,
  value,
  detail,
  trend,
  icon: Icon,
  accent = "brown",
}: {
  label: string;
  value: string;
  detail: string;
  trend: "up" | "down" | "flat";
  icon: typeof Activity;
  accent?: "brown" | "green" | "orange";
}) {
  return (
    <div className="metric-card group">
      <div className="flex items-start justify-between gap-3">
        <div className={`metric-icon metric-icon-${accent}`}>
          <Icon size={16} strokeWidth={1.8} />
        </div>
        <MoreHorizontal size={17} className="text-[#9b8c79] transition-colors group-hover:text-[#594638]" />
      </div>
      <div className="mt-5">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#988875]">{label}</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-display text-[28px] leading-none tracking-[-0.04em] text-[#2c241e]">{value}</span>
          {trend === "up" && <ArrowUpRight size={15} className="text-[#6c8369]" />}
          {trend === "down" && <ArrowDownRight size={15} className="text-[#b96a4d]" />}
        </div>
        <div className="mt-2 text-[11px] text-[#8f8170]">{detail}</div>
      </div>
    </div>
  );
}

function PipelineNode({ agent, status, index }: { agent: Agent; status: AgentStatus; index: number }) {
  const Icon = agent.icon;
  return (
    <div className={`pipeline-node ${statusClass(status)}`}>
      {index !== 0 && <div className={`pipeline-connector ${status === "running" || status === "completed" ? "connector-active" : ""}`} />}
      <div className="pipeline-node-top">
        <span className="font-mono text-[9px] font-semibold tracking-[0.14em] text-[#ad9a85]">{agent.short}</span>
        <span className="node-status-dot" />
      </div>
      <div className="pipeline-icon" style={{ borderColor: `${agent.color}44`, color: agent.color }}>
        <Icon size={18} strokeWidth={1.8} />
      </div>
      <div className="mt-3 min-w-0">
        <div className="truncate text-[12px] font-semibold text-[#3b3028]">{agent.name}</div>
        <div className="mt-1 truncate text-[10px] text-[#9a8976]">{agent.description}</div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 border-t border-[#e6ddd0] pt-2.5">
        {status === "running" && <span className="thinking-bars"><i /><i /><i /></span>}
        {status === "completed" && <Check size={12} className="text-[#6c8369]" />}
        {status === "flagged" && <CircleAlert size={12} className="text-[#b96a4d]" />}
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[#917f6c]">{statusLabel(status)}</span>
      </div>
    </div>
  );
}

function FeedRow({ item }: { item: FeedItem }) {
  return (
    <div className="feed-row">
      <span className="feed-time">{item.time}</span>
      <span className={`feed-agent feed-agent-${item.tone}`}>{item.agent}</span>
      <span className="min-w-0 truncate text-[11px] text-[#756657]">{item.message}</span>
    </div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [ticker, setTicker] = useState("NVDA");
  const [activeTicker, setActiveTicker] = useState("NVDA");
  const [statuses, setStatuses] = useState(initialStatuses);
  const [pipelineResult, setPipelineResult] = useState<SwarmResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [feed, setFeed] = useState<FeedItem[]>(initialFeed);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [decision, setDecision] = useState<Decision>("pending");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastRun, setLastRun] = useState("—");
  const [chartRange, setChartRange] = useState("3M");
  const [feedFilter, setFeedFilter] = useState("All agents");
  const streamCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      streamCleanupRef.current?.();
    };
  }, []);

  const completedCount = Object.values(statuses).filter((status) => status === "completed" || status === "flagged").length;
  const progress = Math.round((completedCount / agents.length) * 100);
  const activeAgent = agents.find((agent) => statuses[agent.id] === "running");
  const liveTime = useMemo(() => formatTime(), [feed]);
  const visibleFeed = feedFilter === "All agents"
    ? feed
    : feed.filter((item) => item.agent.toLowerCase().includes(feedFilter.toLowerCase()));

  const agentIdMap: Record<string, string> = {
    ANALYST: "analyst",
    RISK: "risk",
    COMPLIANCE: "compliance",
    STRATEGIST: "strategist",
    GUARDRAIL: "guardrail",
  };

  function startRun(tickerOverride?: string) {
    const nextTicker = (tickerOverride ?? ticker).trim().toUpperCase();
    if (!nextTicker) {
      toast.error("Enter a ticker first", { description: "Try a symbol like NVDA, MSFT, or AAPL." });
      return;
    }
    if (isRunning) return;

    setActiveTicker(nextTicker);
    setStatuses({ ...initialStatuses, analyst: "running" });
    setIsRunning(true);
    setRequiresApproval(false);
    setDecision("pending");
    setPipelineResult(null);
    setLastRun(formatTime());

    setFeed((current) => [
      {
        id: Date.now(),
        time: formatTime(),
        agent: "ORCHESTRATOR",
        message: `Analysis run initialized for ${nextTicker} · 5-agent sequence queued`,
        tone: "neutral",
      },
      ...current,
    ].slice(0, 10));

    toast.success(`Analyzing ${nextTicker}`, { description: "The agent swarm is now running live." });
 
    streamCleanupRef.current?.();
    streamCleanupRef.current = api.connectSwarmStream(
      nextTicker,
      (thought: SwarmThought) => {
        const agentKey = agentIdMap[thought.agent] || thought.agent.toLowerCase();
        const agentObj = agents.find((a) => a.id === agentKey);
        const agentName = agentObj ? agentObj.name.toUpperCase().replace("EXECUTION ", "") : thought.agent;

        setStatuses((current) => {
          const next = { ...current };
          if (thought.state === "RUNNING") {
            const agentIndex = agents.findIndex((a) => a.id === agentKey);
            for (let i = 0; i < agentIndex; i++) {
              if (next[agents[i].id] !== "flagged") {
                next[agents[i].id] = "completed";
              }
            }
            next[agentKey] = "running";
          } else if (thought.state === "COMPLETED") {
            next[agentKey] = "completed";
          } else if (thought.state === "FLAGGED") {
            next[agentKey] = "flagged";
          }
          return next;
        });

        setFeed((current) => [
          {
            id: Date.now() + Math.random(),
            time: formatTime(new Date(thought.timestamp)),
            agent: agentName,
            message: thought.message,
            tone: thought.state === "FLAGGED" ? "warning" : thought.state === "COMPLETED" ? "positive" : "neutral",
          },
          ...current,
        ].slice(0, 10));
      },
      (result: SwarmResult) => {
        setIsRunning(false);
        setPipelineResult(result);

        setStatuses({
          analyst: "completed",
          risk: result.risk.var95Pct > 2.5 ? "flagged" : "completed",
          compliance: result.compliance.status === "APPROVED" ? "completed" : "flagged",
          strategist: "completed",
          guardrail: result.guardrail.requiresApproval ? "flagged" : "completed",
        });

        if (result.guardrail.requiresApproval) {
          setRequiresApproval(true);
          setFeed((current) => [
            {
              id: Date.now(),
              time: formatTime(),
              agent: "SYSTEM",
              message: `Human-in-the-loop approval required: ${result.guardrail.ruleTriggered}`,
              tone: "warning",
            },
            ...current,
          ].slice(0, 10));
          toast("Approval checkpoint opened", { description: `${result.ticker} is ready for your decision.` });
        } else {
          setRequiresApproval(false);
          setDecision("approved");
          setFeed((current) => [
            {
              id: Date.now(),
              time: formatTime(),
              agent: "GUARDRAIL",
              message: `${result.ticker} cleared safety guardrails · auto-execution confirmed`,
              tone: "positive",
            },
            ...current,
          ].slice(0, 10));
          toast.success("Execution completed", { description: `${result.ticker} auto-executed within safety envelope.` });
        }
      },
      (err) => {
        setIsRunning(false);
        console.error("Swarm stream error:", err);
        toast.error("Pipeline error", { description: "Agent stream encountered an error." });
      }
    );
  }

  function startGuidedDemo() {
    if (isRunning) return;
    setTicker("NVDA");
    toast("Guided demo started", { description: "Aureus will walk NVDA from signal to human approval." });
    startRun("NVDA");
  }

  async function handleDecision(nextDecision: Exclude<Decision, "pending">) {
    setDecision(nextDecision);
    setRequiresApproval(false);
    const approved = nextDecision === "approved";

    try {
      await api.executeTradeDecision({
        ticker: activeTicker,
        decision: nextDecision,
        orderNotional: pipelineResult?.strategist.orderNotional || 24860,
        targetAllocation: `${pipelineResult?.strategist.targetAllocationPct || 3.5}%`,
        notes: approved ? "Approved via command center checkpoint" : "Declined by operator",
      });

      setFeed((current) => [
        {
          id: Date.now(),
          time: formatTime(),
          agent: "HUMAN",
          message: approved ? `${activeTicker} order approved · execution confirmed` : `${activeTicker} order rejected · execution blocked`,
          tone: approved ? "positive" : "warning",
        },
        ...current,
      ].slice(0, 10));

      toast(approved ? "Execution confirmed" : "Execution blocked", {
        description: approved ? `${activeTicker} order released to execution venue.` : "No order was sent. The proposal remains archived.",
      });
    } catch (err) {
      toast.error("Failed to record decision", { description: String(err) });
    }
  }

  function resetRun() {
    setStatuses(initialStatuses);
    setIsRunning(false);
    setRequiresApproval(false);
    setDecision("pending");
    setPipelineResult(null);
    setFeed(initialFeed);
    toast("Run reset", { description: "The command center is ready for a new analysis." });
  }

  function selectWorkspace(name: string) {
    if (name === "Command center") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setMobileMenuOpen(false);
      return;
    }
    if (name === "Portfolio") { setLocation("/portfolio"); return; }
    if (name === "Risk matrix") { setLocation("/risk"); return; }
    if (name === "Audit trail") { setLocation("/audit"); return; }
    toast(`${name} selected`, { description: `${name} is ready for drill-down in the Aureus workspace.` });
  }

  function selectSavedView(name: string) {
    toast(`${name} loaded`, { description: "Saved view filters are applied to the live workspace." });
  }

  function selectChartRange(range: string) {
    setChartRange(range);
    toast(`${range} performance view`, { description: "Chart range updated for the current portfolio snapshot." });
  }

  function cycleFeedFilter() {
    const filters = ["All agents", ...agents.map((agent) => agent.name.split(" ")[0]), "Human", "System"];
    const next = filters[(filters.indexOf(feedFilter) + 1) % filters.length];
    setFeedFilter(next);
  }

  return (
    <div className="min-h-screen bg-[#f3ede3] text-[#2c241e]">
      <div className="grain fixed inset-0 pointer-events-none opacity-[0.035]" />
      <div className="flex min-h-screen">
        <aside className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}>
          <div className="flex items-center justify-between px-5 pb-8 pt-6">
            <div className="flex items-center gap-3">
              <div className="brand-mark"><Hexagon size={24} strokeWidth={1.35} /><span>A</span></div>
              <div>
                <div className="font-display text-[17px] tracking-[-0.03em] text-[#f3eadc]">Aureus</div>
                <div className="font-mono text-[8px] uppercase tracking-[0.24em] text-[#a89073]">Intelligence OS</div>
              </div>
            </div>
            <button className="lg:hidden text-[#bca88f]" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu"><X size={20} /></button>
          </div>
          <div className="px-4">
            <div className="sidebar-label">Workspace</div>
            <nav className="space-y-1">
              <button className="sidebar-link sidebar-link-active" onClick={() => selectWorkspace("Command center")}><Command size={16} /> Command center <span className="ml-auto nav-kbd">⌘ 1</span></button>
              <button className="sidebar-link" onClick={() => selectWorkspace("Portfolio")}><BarChart3 size={16} /> Portfolio <span className="ml-auto nav-count">12</span></button>
              <button className="sidebar-link" onClick={() => selectWorkspace("Risk matrix")}><Target size={16} /> Risk matrix</button>
              <button className="sidebar-link" onClick={() => selectWorkspace("Audit trail")}><FileCheck2 size={16} /> Audit trail</button>
            </nav>
            <div className="sidebar-label mt-9">Saved views</div>
            <nav className="space-y-1">
              <button className="sidebar-link" onClick={() => selectSavedView("Core watchlist")}><span className="watch-dot watch-dot-green" /> Core watchlist <span className="ml-auto nav-count">08</span></button>
              <button className="sidebar-link" onClick={() => selectSavedView("Earnings radar")}><span className="watch-dot watch-dot-gold" /> Earnings radar <span className="ml-auto nav-count">24</span></button>
              <button className="sidebar-link" onClick={() => selectSavedView("Exceptions")}><span className="watch-dot watch-dot-red" /> Exceptions <span className="ml-auto nav-count nav-count-red">03</span></button>
            </nav>
          </div>
          <div className="mt-auto px-4 pb-5">
            <div className="sidebar-foot-card">
              <div className="flex items-center gap-2"><span className="pulse-dot pulse-dot-green" /><span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#bca88f]">All systems nominal</span></div>
              <div className="mt-3 flex items-end justify-between"><div className="font-mono text-[10px] text-[#8e7760]">Model fabric</div><div className="font-mono text-[10px] text-[#cfb18d]">v2.4.18</div></div>
            </div>
            <div className="mt-4 flex items-center gap-3 border-t border-[#5b4638] pt-4">
              <div className="avatar">ER</div><div className="min-w-0"><div className="truncate text-[11px] font-medium text-[#eadfce]">Elena Rodriguez</div><div className="font-mono text-[9px] text-[#9c846c]">Risk operator</div></div><ChevronDown size={14} className="ml-auto text-[#9c846c]" />
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="topbar">
            <button className="mr-3 text-[#6d5b4c] lg:hidden" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu"><Menu size={21} /></button>
            <div className="min-w-0"><div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#a38f79]">Thursday, June 20, 2024 · 09:41 UTC</div><h1 className="mt-1 truncate font-display text-[24px] tracking-[-0.04em] text-[#30261f]">Good morning, Elena<span className="text-[#bd8553]">.</span></h1></div>
            <div className="ml-auto flex items-center gap-3 sm:gap-5"><div className="hidden items-center gap-2 sm:flex"><span className="pulse-dot pulse-dot-green" /><span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#71806e]">Live fabric connected</span></div><button className="icon-button" onClick={() => toast("No new alerts", { description: "Your command center is clear." })} aria-label="Notifications"><Bell size={17} /><span className="notification-dot" /></button><div className="avatar avatar-light">ER</div></div>
          </header>

          <div className="workspace px-4 pb-10 sm:px-6 lg:px-8">
            <section className="hero-card">
              <div className="relative z-10 max-w-[540px]">
                <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#dcc5a3]"><Sparkles size={12} /> Multi-agent financial intelligence</div>
                <h2 className="mt-4 font-display text-[31px] leading-[1.05] tracking-[-0.045em] text-[#fff8ec] sm:text-[39px]">See the signal.<br /><em>Trust the process.</em></h2>
                <p className="mt-4 max-w-[430px] text-[12px] leading-5 text-[#d5c2a9]">Aureus makes every machine decision inspectable — from first signal to final human approval.</p>
              </div>
              <div className="relative z-10 mt-7 flex max-w-[620px] flex-col gap-3 sm:flex-row">
                <div className="ticker-input-wrap"><Search size={17} className="text-[#a58a6e]" /><input aria-label="Ticker symbol" value={ticker} onChange={(event) => setTicker(event.target.value.toUpperCase())} onKeyDown={(event) => event.key === "Enter" && startRun()} placeholder="Enter ticker" maxLength={6} /><span className="font-mono text-[9px] text-[#9f886f]">/ NYSE</span></div>
                <button className="primary-button" onClick={() => startRun()} disabled={isRunning}><Play size={14} fill="currentColor" /> {isRunning ? "Pipeline running" : "Run analysis"}<span className="button-shortcut">↵</span></button><button className="hero-demo-button" onClick={startGuidedDemo} disabled={isRunning}><Sparkles size={14} /> Guided demo</button>
              </div>
              <div className="hero-orbit hero-orbit-one" /><div className="hero-orbit hero-orbit-two" /><div className="hero-grid" />
              <div className="hero-side-note"><span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#ad906e]">Decision engine</span><div className="mt-2 flex items-center gap-2 text-[11px] text-[#f0ddc2]"><span className="pulse-dot pulse-dot-gold" />Human-in-the-loop enabled</div></div>
            </section>

            <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
              <MetricCard label="Value at risk" value="2.4%" detail="1-day · 95% confidence" trend="down" icon={Activity} accent="orange" />
              <MetricCard label="Sharpe ratio" value="1.84" detail="+0.22 vs last month" trend="up" icon={TrendingUp} accent="green" />
              <MetricCard label="Max drawdown" value="−6.8%" detail="90-day rolling window" trend="down" icon={ArrowDownRight} accent="brown" />
              <MetricCard label="Portfolio beta" value="0.92" detail="vs S&P 500 · 30D" trend="flat" icon={LineChartIcon} accent="brown" />
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(330px,0.9fr)]">
              <section className="panel overflow-hidden">
                <div className="panel-header"><div><div className="eyebrow"><span className="pulse-dot pulse-dot-gold" />Live pipeline</div><h3 className="panel-title">Agent swarm <span className="font-mono text-[10px] font-normal tracking-normal text-[#9d8c79]">/ {progress}% synchronized</span></h3></div><button className="icon-button icon-button-small" onClick={resetRun} aria-label="Reset analysis"><RotateCcw size={15} /></button></div>
                <div className="pipeline-wrap">
                  <div className="pipeline-line" />
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-2">{agents.map((agent, index) => <PipelineNode key={agent.id} agent={agent} status={statuses[agent.id]} index={index} />)}</div>
                </div>
                <div className="pipeline-footer"><div className="flex min-w-0 items-center gap-2"><div className="agent-mini-avatar">{activeAgent ? <activeAgent.icon size={13} /> : <Zap size={13} />}</div><div className="min-w-0 truncate text-[11px] text-[#776757]">{isRunning ? <><span className="font-semibold text-[#4d3c2e]">{activeAgent?.name}</span> is evaluating the evidence chain…</> : decision === "approved" ? <><span className="font-semibold text-[#668064]">Execution confirmed</span> · audit trail sealed</> : decision === "rejected" ? <><span className="font-semibold text-[#ae6b50]">Execution blocked</span> · proposal archived</> : "Ready for a new ticker analysis"}</div></div><div className="hidden font-mono text-[9px] uppercase tracking-[0.12em] text-[#aa987f] sm:block">{lastRun === "—" ? "No run yet" : `Last run ${lastRun}`}</div></div>
              </section>

              <section className={`panel decision-panel ${requiresApproval ? "decision-panel-active" : ""}`}>
                <div className="panel-header"><div><div className="eyebrow"><LockKeyhole size={11} /> Human checkpoint</div><h3 className="panel-title">Execution guardrail</h3></div><span className={`decision-badge ${requiresApproval ? "decision-badge-waiting" : decision === "approved" ? "decision-badge-approved" : decision === "rejected" ? "decision-badge-rejected" : "decision-badge-quiet"}`}>{requiresApproval ? "Action required" : decision === "approved" ? "Released" : decision === "rejected" ? "Blocked" : "Monitoring"}</span></div>
                {requiresApproval ? <div className="approval-content"><div className="approval-prompt"><div className="approval-alert-icon"><CircleAlert size={19} /></div><div><div className="text-[13px] font-semibold text-[#4a3328]">Review proposed trade</div><div className="mt-1 text-[11px] leading-4 text-[#8a6d58]">Risk threshold exceeded. Your approval is required before any order is sent.</div></div></div><div className="trade-ticket"><div className="flex items-center justify-between"><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#9b775e]">Proposed order</span><span className="rounded-full bg-[#fbf2e5] px-2 py-1 font-mono text-[9px] text-[#a67145]">LIMIT</span></div><div className="mt-4 flex items-end justify-between"><div><div className="font-display text-[27px] tracking-[-0.04em] text-[#35271f]">{pipelineResult?.strategist.proposedAction || "BUY"} {activeTicker}</div><div className="mt-1 text-[11px] text-[#907765]">{pipelineResult?.strategist.targetAllocationPct || 3.5}% target allocation · ${pipelineResult?.strategist.orderNotional ? pipelineResult.strategist.orderNotional.toLocaleString() : "24,860"} notional</div></div><div className="text-right"><div className="font-mono text-[14px] font-semibold text-[#6b805e]">$132.40</div><div className="font-mono text-[9px] text-[#9a8774]">limit price</div></div></div><div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#e8dacc] pt-3"><div><div className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#a18a76]">Confidence</div><div className="mt-1 text-[11px] font-semibold text-[#514036]">{pipelineResult?.strategist.confidence || 82}%</div></div><div><div className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#a18a76]">VaR impact</div><div className="mt-1 text-[11px] font-semibold text-[#514036]">{pipelineResult ? `+${pipelineResult.risk.var95Pct}%` : "+0.3%"}</div></div><div><div className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#a18a76]">Policy</div><div className="mt-1 text-[11px] font-semibold text-[#6b805e]">{pipelineResult?.compliance.status || "Pass"}</div></div></div></div><div className="grid grid-cols-2 gap-2"><button className="decision-button decision-button-reject" onClick={() => handleDecision("rejected")}><X size={14} /> Reject</button><button className="decision-button decision-button-approve" onClick={() => handleDecision("approved")}><Check size={14} /> Approve & execute</button></div></div> : <div className="decision-empty"><div className={`decision-status-mark ${decision === "approved" ? "mark-approved" : decision === "rejected" ? "mark-rejected" : ""}`}>{decision === "approved" ? <CheckCircle2 size={25} /> : decision === "rejected" ? <X size={25} /> : <LockKeyhole size={23} />}</div><div className="mt-4 text-[13px] font-semibold text-[#4b3b30]">{decision === "approved" ? "Order released successfully" : decision === "rejected" ? "Order blocked by operator" : isRunning ? "Checkpoint will appear here" : "Awaiting pipeline completion"}</div><div className="mt-2 max-w-[240px] text-center text-[11px] leading-4 text-[#958170]">{decision === "approved" ? "Execution venue acknowledged the order. The audit trail is sealed." : decision === "rejected" ? "No order was sent. You can run another analysis at any time." : "Aureus pauses automatically when a trade crosses your configured risk threshold."}</div><div className="mt-5 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#a18d78]"><span className="pulse-dot pulse-dot-soft" />{isRunning ? "Listening to agents" : "Policy armed"}</div></div>}
              </section>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(310px,0.75fr)]">
              <section className="panel chart-panel"><div className="panel-header"><div><div className="eyebrow"><LineChartIcon size={11} /> Portfolio intelligence</div><h3 className="panel-title">Relative performance</h3></div><div className="chart-legend"><span><i className="legend-line legend-line-portfolio" /> Aureus portfolio</span><span><i className="legend-line legend-line-benchmark" /> S&amp;P 500</span></div></div><div className="chart-toolbar"><div className="font-mono text-[10px] text-[#9a8975]">Apr 01 — Jun 17, 2024</div><div className="flex items-center gap-1 rounded-md bg-[#f1e9dd] p-1"><button className={`range-button ${chartRange === "1M" ? "range-button-active" : ""}`} onClick={() => selectChartRange("1M")}>1M</button><button className={`range-button ${chartRange === "3M" ? "range-button-active" : ""}`} onClick={() => selectChartRange("3M")}>3M</button><button className={`range-button ${chartRange === "1Y" ? "range-button-active" : ""}`} onClick={() => selectChartRange("1Y")}>1Y</button></div></div><div className="mt-2 h-[220px] w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 12, right: 4, left: -18, bottom: 0 }}><CartesianGrid stroke="#eee5d8" strokeDasharray="2 4" vertical={false} /><XAxis dataKey="month" tick={{ fill: "#a69684", fontSize: 9, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} interval={2} /><YAxis domain={[98, 114]} tick={{ fill: "#a69684", fontSize: 9, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}`} /><Tooltip contentStyle={{ border: "1px solid #e3d7c7", borderRadius: 8, background: "#fffaf3", boxShadow: "0 8px 24px rgba(81,55,33,0.10)", fontSize: 11 }} labelStyle={{ color: "#8f7b67", fontFamily: "IBM Plex Mono", fontSize: 10 }} formatter={(value: number, name: string) => [`${value.toFixed(1)}`, name === "portfolio" ? "Aureus portfolio" : "S&P 500"]} /><Line type="monotone" dataKey="portfolio" stroke="#9b623c" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#9b623c", stroke: "#fffaf3", strokeWidth: 2 }} /><Line type="monotone" dataKey="benchmark" stroke="#bdb3a7" strokeWidth={1.6} strokeDasharray="4 4" dot={false} /></LineChart></ResponsiveContainer></div><div className="mt-1 flex items-center gap-2 border-t border-[#eee5da] pt-3 text-[11px] text-[#817162]"><span className="font-mono text-[10px] font-semibold text-[#6d846a]">+12.7%</span><span>portfolio return</span><span className="mx-1 text-[#c7b9a8]">·</span><span className="font-mono text-[10px] font-semibold text-[#938474]">+10.2%</span><span>benchmark return</span><span className="ml-auto font-mono text-[10px] text-[#a18e7b]">+2.5% alpha</span></div></section>

              <section className="panel"><div className="panel-header"><div><div className="eyebrow"><CircleDollarSign size={11} /> Signal quality</div><h3 className="panel-title">Sentiment &amp; compliance</h3></div><button className="icon-button icon-button-small" onClick={() => toast("Signal details", { description: "Signals are aggregated from market, filings, and news evidence." })} aria-label="View signal details"><MoreHorizontal size={15} /></button></div><div className="signal-score-wrap"><div className="score-ring"><div className="score-ring-inner"><span className="font-display text-[29px] tracking-[-0.05em] text-[#3b2e25]">78</span><span className="font-mono text-[9px] text-[#9b8975]">/ 100</span></div></div><div className="min-w-0"><div className="text-[14px] font-semibold text-[#493a2f]">Constructive bullish</div><div className="mt-1 text-[11px] leading-4 text-[#968272]">Analyst confidence is above the 70 threshold for consideration.</div><div className="mt-3 flex items-center gap-2"><span className="signal-pill signal-pill-green"><ArrowUpRight size={12} /> +8.4 pts</span><span className="font-mono text-[9px] text-[#aa9884]">vs 7D avg</span></div></div></div><div className="mt-5 space-y-4"><div><div className="mb-2 flex justify-between text-[10px] text-[#8f7b67]"><span>News velocity</span><span className="font-mono text-[#645344]">82%</span></div><div className="progress-track"><div className="progress-fill progress-fill-brown" style={{ width: "82%" }} /></div></div><div><div className="mb-2 flex justify-between text-[10px] text-[#8f7b67]"><span>Fundamental alignment</span><span className="font-mono text-[#645344]">74%</span></div><div className="progress-track"><div className="progress-fill progress-fill-gold" style={{ width: "74%" }} /></div></div></div><div className="compliance-row"><div className="flex items-center gap-2"><div className="compliance-check"><Check size={13} /></div><div><div className="text-[11px] font-semibold text-[#52654f]">Compliance approved</div><div className="mt-0.5 text-[10px] text-[#968474]">No restricted-list conflicts detected</div></div></div><ChevronDown size={14} className="text-[#a4927e]" /></div></section>
            </div>

            <section className="panel mt-5"><div className="panel-header"><div><div className="eyebrow"><Activity size={11} /> Live reasoning feed</div><h3 className="panel-title">Evidence chain <span className="font-mono text-[10px] font-normal tracking-normal text-[#9d8c79]">/ auto-updating</span></h3></div><div className="flex items-center gap-3"><span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-[#9f8a75] sm:block">Last event {liveTime}</span><button className="feed-filter" onClick={cycleFeedFilter}><span className="pulse-dot pulse-dot-soft" />{feedFilter} <ChevronDown size={12} /></button></div></div><div className="feed-header"><span>Timestamp</span><span>Agent</span><span>Reasoning event</span></div><div className="feed-list">{visibleFeed.length ? visibleFeed.map((item) => <FeedRow key={item.id} item={item} />) : <div className="px-5 py-8 text-center text-[11px] text-[#9b8975]">No events for {feedFilter} yet.</div>}</div><div className="feed-footer"><Clock3 size={12} /> Showing {visibleFeed.length} events · every handoff is cryptographically traceable <span className="ml-auto hidden font-mono text-[9px] text-[#a18d7a] sm:block">Stream latency 84ms</span></div></section>

            <footer className="mt-6 flex flex-col gap-2 border-t border-[#ded2c2] pt-4 text-[10px] text-[#9a8977] sm:flex-row sm:items-center"><div className="flex items-center gap-2"><LockKeyhole size={12} /> Aureus secure workspace · simulated market data</div><div className="sm:ml-auto font-mono">Data refresh 15m · Policy set 2.4 · {activeTicker}</div></footer>
          </div>
        </main>
      </div>
    </div>
  );
}
