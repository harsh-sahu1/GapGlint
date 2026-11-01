import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface MetricCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: LucideIcon;
  accentColor?: 'blue' | 'purple' | 'amber' | 'rose' | 'emerald';
  badge?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  accentColor = 'blue',
  badge
}) => {
  const colorStyles = {
    blue: {
      bg: 'bg-blue-50/70',
      text: 'text-blue-600',
      border: 'border-blue-100',
      ring: 'group-hover:border-blue-300',
      badge: 'bg-blue-100/70 text-blue-700'
    },
    purple: {
      bg: 'bg-indigo-50/70',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
      ring: 'group-hover:border-indigo-300',
      badge: 'bg-indigo-100/70 text-indigo-700'
    },
    amber: {
      bg: 'bg-amber-50/70',
      text: 'text-amber-600',
      border: 'border-amber-100',
      ring: 'group-hover:border-amber-300',
      badge: 'bg-amber-100/70 text-amber-700'
    },
    rose: {
      bg: 'bg-rose-50/70',
      text: 'text-rose-600',
      border: 'border-rose-100',
      ring: 'group-hover:border-rose-300',
      badge: 'bg-rose-100/70 text-rose-700'
    },
    emerald: {
      bg: 'bg-emerald-50/70',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      ring: 'group-hover:border-emerald-300',
      badge: 'bg-emerald-100/70 text-emerald-700'
    }
  }[accentColor];

  return (
    <div className={cn(
      "group relative bg-white rounded-2xl p-5 border border-slate-200/90 shadow-card hover:shadow-md transition-all duration-200 flex flex-col justify-between",
      colorStyles.ring
    )}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {title}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {value}
            </span>
            {badge && (
              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", colorStyles.badge)}>
                {badge}
              </span>
            )}
          </div>
        </div>

        <div className={cn("p-2.5 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105", colorStyles.bg, colorStyles.text, colorStyles.border)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="truncate">{subtitle}</span>
        <span className="text-[11px] text-slate-400 font-mono">Live</span>
      </div>
    </div>
  );
};

