import React, { useState } from 'react';
import { 
  Gauge, 
  CheckCircle2, 
  HelpCircle, 
  AlertTriangle, 
  Info, 
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { DecisionReadiness } from '../types';

interface DecisionReadinessCardProps {
  readiness: DecisionReadiness;
  completedTasksCount: number;
  totalTasksCount: number;
}

export const DecisionReadinessCard: React.FC<DecisionReadinessCardProps> = ({
  readiness,
  completedTasksCount,
  totalTasksCount
}) => {
  const [showExplanation, setShowExplanation] = useState(false);

  // Dynamic adjusted score based on client-side completed tasks
  // Each completed task gives +2 points (up to +10 bonus points)
  const taskBonus = completedTasksCount * 2;
  const dynamicScore = Math.min(98, Math.max(15, readiness.score + taskBonus));

  const levelColor = {
    High: {
      text: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      bar: 'bg-emerald-500'
    },
    Moderate: {
      text: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      bar: 'bg-amber-500'
    },
    'Preliminary / Incomplete': {
      text: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      bar: 'bg-rose-500'
    }
  }[readiness.level] || {
    text: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    bar: 'bg-blue-500'
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-card space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-electric-50 text-electric-600 border border-electric-100 flex items-center justify-center">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Decision Readiness Indicator
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${levelColor.bg} ${levelColor.text} ${levelColor.border}`}>
                {readiness.level}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Information completeness score based on grounded claims, gaps & unresolved conflicts.
            </p>
          </div>
        </div>

        {/* Score Pill */}
        <div className="flex items-baseline gap-1.5 self-start sm:self-auto">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {dynamicScore}
          </span>
          <span className="text-xs font-semibold text-slate-400">/ 100</span>
        </div>
      </div>

      {/* Progress Bar Gauge */}
      <div className="space-y-1.5">
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${levelColor.bar}`}
            style={{ width: `${dynamicScore}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-semibold text-slate-400 px-1">
          <span>0 (Incomplete)</span>
          <span>50 (Moderate)</span>
          <span>100 (Fully Grounded)</span>
        </div>
      </div>

      {/* 4 Assessment Pillar Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold text-[11px]">Available Info</span>
          </div>
          <span className="text-lg font-bold text-slate-900">
            {readiness.available_info_count}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Claims grounded</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-semibold text-[11px]">Missing Info</span>
          </div>
          <span className="text-lg font-bold text-slate-900">
            {readiness.missing_info_count}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Unaddressed gaps</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span className="font-semibold text-[11px]">Conflicts</span>
          </div>
          <span className="text-lg font-bold text-slate-900">
            {readiness.unresolved_conflicts_count}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Contradictions</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-semibold text-[11px]">Checklist</span>
          </div>
          <span className="text-lg font-bold text-slate-900">
            {completedTasksCount} / {totalTasksCount}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Actions completed</span>
        </div>
      </div>

      {/* Transparent Calculation Toggle */}
      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setShowExplanation(prev => !prev)}
          className="flex items-center justify-between w-full text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors py-1 cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-electric-600" />
            How is the Decision Readiness Score calculated?
          </span>
          {showExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showExplanation && (
          <div className="mt-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2 animate-fadeIn">
            <p className="leading-relaxed">
              <strong>Calculation Logic:</strong> The score begins at a baseline of 100 and applies risk deductions:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
              <li><strong>-15 points</strong> per Critical Information Gap (missing mandatory criteria).</li>
              <li><strong>-12 points</strong> per High-Severity Contradiction (incompatible numbers or terms).</li>
              <li><strong>-8 points</strong> per Moderate Information Gap.</li>
              <li><strong>-10 points</strong> per Inaccessible / Failed Extraction Source.</li>
              <li><strong>+2 bonus points</strong> per grounded factual claim and per completed verification checklist task.</li>
            </ul>
            <p className="text-[11px] text-slate-500 italic mt-2 pt-2 border-t border-slate-200/60">
              {readiness.explanation}
            </p>
          </div>
        )}

        {/* Mandatory Explicit Disclaimer */}
        <p className="mt-3 text-[11px] text-slate-400 italic">
          * {readiness.disclaimer}
        </p>
      </div>
    </div>
  );
};

