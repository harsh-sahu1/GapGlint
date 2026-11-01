import React, { useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  FileText, 
  Globe, 
  AlignLeft, 
  ShieldCheck, 
  Clock, 
  AlertTriangle,
  Copy,
  Check
} from 'lucide-react';
import { EvidenceTraceModalData } from '../types';

interface EvidenceDrawerProps {
  data: EvidenceTraceModalData | null;
  onClose: () => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ data, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (data) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [data, onClose]);

  if (!data) return null;

  const handleCopyExcerpt = () => {
    navigator.clipboard.writeText(data.verbatimExcerpt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getSourceIcon = () => {
    if (data.sourceType === 'url') return <Globe className="w-4 h-4 text-blue-600" />;
    if (data.sourceType === 'pdf') return <FileText className="w-4 h-4 text-rose-600" />;
    return <AlignLeft className="w-4 h-4 text-amber-600" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-xs flex items-center justify-center">
                {getSourceIcon()}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Evidence Provenance Inspector
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight line-clamp-1">
              {data.title || data.sourceTitle}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
            title="Close Inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Finding Claim */}
          {data.findingClaim && (
            <div className="p-4 rounded-2xl bg-electric-50/60 border border-electric-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-electric-700 block mb-1">
                Extracted Finding / Claim
              </span>
              <p className="text-sm font-bold text-slate-900 leading-snug">
                {data.findingClaim}
              </p>
            </div>
          )}

          {/* Warning / Discrepancy Reason */}
          {data.warningReason && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-amber-900 block mb-0.5">
                  Audit Concern / Discrepancy Reason
                </span>
                <p className="text-xs text-amber-800 leading-relaxed">
                  {data.warningReason}
                </p>
              </div>
            </div>
          )}

          {/* Verbatim Supporting Excerpt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verbatim Source Excerpt</span>
              </span>
              <button
                type="button"
                onClick={handleCopyExcerpt}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 font-medium px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Excerpt'}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs sm:text-sm font-mono leading-relaxed border border-slate-800 shadow-inner">
              "{data.verbatimExcerpt}"
            </div>
          </div>

          {/* Context / Full Text Preview */}
          {data.fullSourceContext && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Ingested Document Context Preview
              </span>
              <div className="max-h-56 overflow-y-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed font-sans whitespace-pre-wrap select-text">
                {data.fullSourceContext}
              </div>
            </div>
          )}

          {/* Source Metadata & Traceability Table */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Original Source</span>
              <span className="font-semibold text-slate-800 break-words">{data.sourceTitle}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Publication / Effective Date</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {data.publicationDate || 'Undated (Verification recommended)'}
              </span>
            </div>

            {data.sourceUrlOrPath && (
              <div className="sm:col-span-2 pt-2 border-t border-slate-200/60 flex items-center justify-between flex-wrap gap-2">
                <div className="min-w-0">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Reference Link / File</span>
                  <span className="font-mono text-[11px] text-slate-600 truncate block max-w-md">
                    {data.sourceUrlOrPath}
                  </span>
                </div>

                {data.sourceType === 'url' && data.sourceUrlOrPath.startsWith('http') && (
                  <a
                    href={data.sourceUrlOrPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-electric-600 hover:bg-electric-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <span>Open Original Source</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
          <span>GapGlint Traceability Matrix • Strictly Sourced Evidence</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition-all cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

