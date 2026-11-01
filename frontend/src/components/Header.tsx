import React from 'react';
import { NavSection } from '../types';
import { Sparkles, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  currentSection: NavSection;
  sourceCount: number;
}

export const Header: React.FC<HeaderProps> = ({ currentSection, sourceCount }) => {
  const getSectionTitle = (section: NavSection) => {
    switch (section) {
      case 'overview':
        return {
          title: 'Intelligence Overview',
          subtitle: 'Active research workspace and synthesis matrix'
        };
      case 'new-research':
        return {
          title: 'New Research Investigation',
          subtitle: 'Ingest multi-modal sources for gap discovery'
        };
      case 'history':
        return {
          title: 'Research History & Sessions',
          subtitle: 'Review and audit past claim verification runs'
        };
      case 'about':
        return {
          title: 'About GapGlint',
          subtitle: 'Architectural objectives and problem statement alignment'
        };
    }
  };

  const info = getSectionTitle(currentSection);

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex items-center justify-between shadow-xs">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{info.title}</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
            Evidence Intelligence Platform
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{info.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Source counter pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-electric-600" />
          <span>Active Sources:</span>
          <span className="font-bold text-slate-900">{sourceCount}</span>
        </div>

        {/* AI Readiness Status */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-electric-50 text-electric-700 border border-electric-200/80 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-electric-600 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Evidence Engine: Armed</span>
        </div>
      </div>
    </header>
  );
};

