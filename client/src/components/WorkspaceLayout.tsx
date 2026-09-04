import { ReactNode, useState } from "react";
import { Activity, BarChart3, Bell, Command, FileCheck2, FileClock, Hexagon, Menu, Shield, SlidersHorizontal, Target, X } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type WorkspaceLayoutProps = { children: ReactNode; eyebrow: string; title: string; description: string };

const navItems = [
  { label: "Command center", path: "/", icon: Command },
  { label: "Portfolio", path: "/portfolio", icon: BarChart3 },
  { label: "Risk matrix", path: "/risk", icon: Target },
  { label: "Audit trail", path: "/audit", icon: FileCheck2 },
  { label: "Analysis history", path: "/history", icon: FileClock },
  { label: "Policy center", path: "/policies", icon: SlidersHorizontal },
];

export default function WorkspaceLayout({ children, eyebrow, title, description }: WorkspaceLayoutProps) {
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  function go(path: string, label: string) {
    setMenuOpen(false);
    if (path === location) return;
    setLocation(path);
    toast(`${label} opened`, { description: "Workspace context updated." });
  }

  return (
    <div className="min-h-screen bg-[#f6f3f1] text-[#242424]">
      <div className="grain fixed inset-0 pointer-events-none opacity-[0.035]" />
      <div className="flex min-h-screen">
        <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
          <div className="flex items-center justify-between px-5 pb-8 pt-6">
            <button className="flex items-center gap-3 text-left" onClick={() => go("/", "Command center")} aria-label="Go to command center">
              <div className="brand-mark"><Hexagon size={24} strokeWidth={1.35} /><span>A</span></div>
              <div><div className="font-display text-[17px] tracking-[-0.03em] text-[#f6f3f1]">Aureus</div><div className="font-mono text-[8px] uppercase tracking-[0.24em] text-[#ae9183]">Intelligence OS</div></div>
            </button>
            <button className="lg:hidden text-[#c7b7b0]" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button>
          </div>
          <div className="px-4">
            <div className="sidebar-label">Workspace</div>
            <nav className="space-y-1">{navItems.map((item) => { const Icon = item.icon; return <button key={item.path} className={`sidebar-link ${location === item.path ? "sidebar-link-active" : ""}`} onClick={() => go(item.path, item.label)}><Icon size={16} /> {item.label}{item.path === "/portfolio" && <span className="ml-auto nav-count">12</span>}</button>; })}</nav>
            <div className="sidebar-label mt-9">Saved views</div>
            <nav className="space-y-1">
              <button className="sidebar-link" onClick={() => go("/watchlist", "Core watchlist")}><span className="watch-dot watch-dot-green" /> Core watchlist <span className="ml-auto nav-count">08</span></button>
              <button className="sidebar-link" onClick={() => go("/earnings", "Earnings radar")}><span className="watch-dot watch-dot-gold" /> Earnings radar <span className="ml-auto nav-count">24</span></button>
              <button className="sidebar-link" onClick={() => go("/exceptions", "Exceptions")}><span className="watch-dot watch-dot-red" /> Exceptions <span className="ml-auto nav-count nav-count-red">03</span></button>
            </nav>
          </div>
          <div className="mt-auto px-4 pb-5">
            <div className="sidebar-foot-card"><div className="flex items-center gap-2"><span className="pulse-dot pulse-dot-green" /><span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#c7b7b0]">All systems nominal</span></div><div className="mt-3 flex items-end justify-between"><div className="font-mono text-[10px] text-[#a58c81]">Model fabric</div><div className="font-mono text-[10px] text-[#ffb59a]">v2.4.18</div></div></div>
            <button className="mt-4 flex w-full items-center gap-3 border-t border-[#4e3d36] pt-4 text-left" onClick={() => toast("Operator profile", { description: "Elena Rodriguez · Risk operator" })}><div className="avatar">ER</div><div><div className="text-[11px] font-medium text-[#f3e5df]">Elena Rodriguez</div><div className="font-mono text-[9px] text-[#ac9186]">Risk operator</div></div><Shield size={14} className="ml-auto text-[#a58c81]" /></button>
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          <header className="topbar"><button className="mr-3 text-[#6d5b4c] lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={21} /></button><div><div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#967d73]">Aureus workspace · live</div><h1 className="mt-1 font-display text-[24px] tracking-[-0.04em] text-[#242424]">{title}</h1></div><div className="ml-auto flex items-center gap-3 sm:gap-5"><div className="hidden items-center gap-2 sm:flex"><span className="pulse-dot pulse-dot-green" /><span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#71806e]">Live fabric connected</span></div><button className="icon-button" onClick={() => toast("No new alerts", { description: "Your workspace is clear." })} aria-label="Notifications"><Bell size={17} /><span className="notification-dot" /></button><button className="avatar avatar-light" onClick={() => toast("Operator profile", { description: "Elena Rodriguez · Risk operator" })} aria-label="Open operator profile">ER</button></div></header>
          <div className="workspace px-4 pb-10 sm:px-6 lg:px-8"><div className="page-intro"><div className="eyebrow"><Activity size={11} /> {eyebrow}</div><p className="mt-2 max-w-2xl text-[12px] leading-5 text-[#8e7970]">{description}</p></div>{children}</div>
        </main>
      </div>
    </div>
  );
}
