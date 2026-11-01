import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  accent?: 'blue' | 'amber' | 'rose' | 'indigo' | 'emerald';
  features?: string[];
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  accent = 'blue',
  features
}) => {
  const accentStyles = {
    blue: {
      bg: 'bg-blue-50/70',
      iconText: 'text-blue-600',
      border: 'border-blue-100',
    },
    amber: {
      bg: 'bg-amber-50/70',
      iconText: 'text-amber-600',
      border: 'border-amber-100',
    },
    rose: {
      bg: 'bg-rose-50/70',
      iconText: 'text-rose-600',
      border: 'border-rose-100',
    },
    indigo: {
      bg: 'bg-indigo-50/70',
      iconText: 'text-indigo-600',
      border: 'border-indigo-100',
    },
    emerald: {
      bg: 'bg-emerald-50/70',
      iconText: 'text-emerald-600',
      border: 'border-emerald-100',
    }
  }[accent];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-8 md:p-12 text-center max-w-2xl mx-auto my-4">
      <div className={`mx-auto w-14 h-14 rounded-2xl ${accentStyles.bg} ${accentStyles.border} border flex items-center justify-center mb-4 transition-transform hover:scale-105`}>
        <Icon className={`w-7 h-7 ${accentStyles.iconText}`} />
      </div>

      <h3 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">
        {title}
      </h3>

      <p className="text-xs md:text-sm text-slate-500 mt-2 max-w-lg mx-auto leading-relaxed">
        {description}
      </p>

      {features && features.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {features.map((feat, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
              <span className="w-1.5 h-1.5 rounded-full bg-electric-600 mt-1.5 flex-shrink-0" />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      )}

      {actionText && onAction && (
        <div className="mt-6">
          <button
            type="button"
            onClick={onAction}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            {actionText}
          </button>
        </div>
      )}
    </div>
  );
};

