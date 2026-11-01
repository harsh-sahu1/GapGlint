import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  SearchCode, 
  History, 
  Info, 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  FileCheck
} from 'lucide-react';
import { NavSection } from '../types';
import { cn } from '../lib/utils';
import { apiUrl } from '../lib/api';

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  collapsed,
  onToggleCollapse
}) => {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const checkHealth = () => {
      fetch(apiUrl('/api/health'))
        .then(res => res.json())
        .then(data => {
          if (data && data.status === 'healthy') {
            setApiOnline(true);
          } else {
            setApiOnline(false);
          }
          
        })
        .catch(() => {
          setApiOnline(false);
        });
    };

    // Check immediately on mount
    checkHealth();

    // Poll every 4 seconds to dynamically detect when backend is launched
    const interval = setInterval(checkHealth, 4000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      id: 'overview' as NavSection,
      label: 'Overview',
      icon: LayoutDashboard,
      description: 'Metric summaries & workspace'
    },
    {
      id: 'new-research' as NavSection,
      label: 'New Research',
      icon: SearchCode,
      description: 'Start fresh source exploration'
    },
    {
      id: 'history' as NavSection,
      label: 'Research History',
      icon: History,
      description: 'Previous investigations'
    },
    {
      id: 'about' as NavSection,
      label: 'About GapGlint',
      icon: Info,
      description: 'Mission & intelligence engine'
    }
  ];

  return (
    <aside 
      className={cn(
        "relative flex flex-col h-screen bg-navy-950 text-slate-300 transition-all duration-300 ease-in-out border-r border-navy-800/60 z-30 select-none shadow-xl",
        collapsed ? "w-20" : "w-64 md:w-72"
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-navy-800/80">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-navy-800 to-navy-900 border border-electric-500/30 flex items-center justify-center p-1 shadow-glow overflow-hidden">
            <img src="/logo.png" alt="GapGlint Logo" className="w-full h-full object-contain filter drop-shadow-sm" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-lg tracking-tight">GapGlint</span>
                <span className="text-[10px] font-semibold bg-electric-600/30 text-electric-400 border border-electric-500/30 rounded px-1.5 py-0.5">
                  v0.1
                </span>
              </div>
              <span className="text-[11px] text-slate-400 truncate tracking-tight font-medium">
                Evidence Intelligence
              </span>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors focus:outline-none focus:ring-2 focus:ring-electric-500"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Tagline Banner (when expanded) */}
      {!collapsed && (
        <div className="mx-3 my-3 p-2.5 rounded-lg bg-navy-900/80 border border-navy-800/80 text-[11px] leading-relaxed text-slate-400">
          <span className="text-electric-400 font-semibold">See the Gaps.</span> Trace the Claims. <span className="text-slate-300 font-medium">Decide with Evidence.</span>
        </div>
      )}

      {/* Nav items */}
      <div className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto">
        <div className={cn("px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500", collapsed && "text-center")}>
          {collapsed ? "•••" : "Workspace Navigation"}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200",
                isActive 
                  ? "bg-electric-600 text-white shadow-card font-semibold" 
                  : "text-slate-400 hover:text-slate-100 hover:bg-navy-900/70",
                collapsed && "justify-center px-0 py-3"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105",
                isActive ? "text-white" : "text-slate-400 group-hover:text-electric-400"
              )} />
              
              {!collapsed && (
                <div className="flex flex-col text-left truncate">
                  <span className="truncate">{item.label}</span>
                </div>
              )}

              {/* Active Indicator dot */}
              {isActive && collapsed && (
                <span className="absolute right-1 top-1 w-2 h-2 rounded-full bg-electric-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Problem Statement Quick Anchor */}
      {!collapsed && (
        <div className="mx-3 mb-3 p-3 rounded-xl bg-navy-900/60 border border-navy-800/60 flex items-start gap-2.5">
          <FileCheck className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
          <div className="text-[11px] text-slate-400 leading-tight">
            <span className="font-semibold text-slate-200 block mb-0.5">Decision Assurance</span>
            Uncovering contradictions, outdated claims & unanswered questions.
          </div>
        </div>
      )}

      {/* Footer / System Status */}
      <div className="p-3 border-t border-navy-800/80 bg-navy-950/70">
        <div className={cn("flex items-center gap-2", collapsed ? "justify-center" : "justify-between")}>
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-2.5 h-2.5 rounded-full flex-shrink-0",
              apiOnline === true ? "bg-emerald-500 animate-pulse" : apiOnline === false ? "bg-amber-500" : "bg-slate-500"
            )} />
            {!collapsed && (
              <span className="text-xs text-slate-400">
                {apiOnline === true ? "FastAPI: Connected" : apiOnline === false ? "FastAPI: Offline" : "Checking API..."}
              </span>
            )}
          </div>
          {!collapsed && (
            <Activity className="w-3.5 h-3.5 text-slate-500" />
          )}
        </div>
      </div>
    </aside>
  );
};

