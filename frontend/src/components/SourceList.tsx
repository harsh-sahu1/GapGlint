import React from 'react';
import { Source } from '../types';
import { Globe, FileText, AlignLeft, Trash2, CheckCircle2 } from 'lucide-react';
import { formatBytes } from '../lib/utils';

interface SourceListProps {
  sources: Source[];
  onRemoveSource: (id: string) => void;
}

export const SourceList: React.FC<SourceListProps> = ({ sources, onRemoveSource }) => {
  if (sources.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mt-4">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
        <span>Staged Sources ({sources.length})</span>
        <span className="text-[11px] text-slate-400 font-normal">Ready for synthesis</span>
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {sources.map((source) => {
          let Icon = Globe;
          let badgeText = 'URL';
          let badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';

          if (source.type === 'pdf') {
            Icon = FileText;
            badgeText = 'PDF';
            badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
          } else if (source.type === 'text') {
            Icon = AlignLeft;
            badgeText = 'Text Note';
            badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
          }

          return (
            <div
              key={source.id}
              className="flex items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all shadow-xs group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex-shrink-0 group-hover:bg-slate-100 transition-colors">
                  <Icon className="w-4 h-4 text-slate-600" />
                </div>
                
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800 truncate">
                      {source.title}
                    </span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${badgeClass}`}>
                      {badgeText}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    {source.url && (
                      <span className="truncate max-w-xs">{source.url}</span>
                    )}
                    {source.fileSize !== undefined && (
                      <span>{formatBytes(source.fileSize)}</span>
                    )}
                    {source.textContent && (
                      <span>{source.textContent.length} characters</span>
                    )}
                    <span>• {source.createdAt}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1" />
                <button
                  type="button"
                  onClick={() => onRemoveSource(source.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Remove source"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

