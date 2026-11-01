import React from 'react';
import { History, ArrowRight } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

interface HistoryPageProps {
  onStartNew: () => void;
  activeTopic?: string;
  sourceCount: number;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onStartNew, activeTopic, sourceCount }) => {
  const mockHistory = activeTopic ? [
    {
      id: 'sess-current',
      topic: activeTopic,
      date: 'Just now',
      sourcesCount: sourceCount,
      status: 'Active Session',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
  ] : [];

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-card">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-electric-600 mb-2">
          <History className="w-4 h-4" />
          <span>Audit Log & Previous Queries</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Research History
        </h2>
        <p className="text-slate-500 text-sm mt-2 max-w-2xl">
          Track, reload, and compare past evidence analyses, contradiction flags, and verification checklists.
        </p>
      </div>

      {mockHistory.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Current Investigation
          </div>
          {mockHistory.map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-800 text-sm">{item.topic}</h4>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${item.statusColor}`}>
                    {item.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span>{item.sourcesCount} sources attached</span>
                  <span>• {item.date}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onStartNew}
                className="px-3.5 py-1.5 bg-electric-600 hover:bg-electric-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>View Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={History}
          title="No Research History Saved Yet"
          description="Your completed and in-progress research investigations will be logged here with source archives, identified discrepancies, and action checklists."
          accent="indigo"
          features={[
            "Session snapshotting with timestamped web source archives",
            "Comparative regression tracking across evolving policy updates",
            "Exportable audit packages (JSON, PDF, Markdown reports)",
            "One-click reload into the active Evidence Synthesis workspace"
          ]}
          actionText="Create New Research Investigation"
          onAction={onStartNew}
        />
      )}
    </div>
  );
};
