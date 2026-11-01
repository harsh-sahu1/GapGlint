import React, { useRef } from 'react';
import { 
  FileSearch, 
  Layers, 
  AlertOctagon, 
  HelpCircle, 
  Sparkles,
  ShieldCheck,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { ResearchWorkspace } from '../components/ResearchWorkspace';
import { AnalysisTabs } from '../components/AnalysisTabs';
import { Source, AnalysisResponse } from '../types';

interface OverviewPageProps {
  topic: string;
  setTopic: (v: string) => void;
  question: string;
  setQuestion: (v: string) => void;
  currentUrl: string;
  setCurrentUrl: (v: string) => void;
  manualText: string;
  setManualText: (v: string) => void;
  sources: Source[];
  onAddUrl: (url?: string) => boolean;
  onAddPdf: (file: File) => boolean;
  onAddManualText: () => boolean;
  onRemoveSource: (id: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  notification: string | null;
  errorMessage: string | null;
  onDismissError?: () => void;
  analysisResult: AnalysisResponse | null;
  onToggleChecklistItem: (itemId: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  topic,
  setTopic,
  question,
  setQuestion,
  currentUrl,
  setCurrentUrl,
  manualText,
  setManualText,
  sources,
  onAddUrl,
  onAddPdf,
  onAddManualText,
  onRemoveSource,
  onAnalyze,
  isAnalyzing,
  notification,
  errorMessage,
  onDismissError,
  analysisResult,
  onToggleChecklistItem
}) => {
  const workspaceRef = useRef<HTMLDivElement>(null);

  const scrollToWorkspace = () => {
    workspaceRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sourcesCount = analysisResult ? analysisResult.metrics.sources_analysed : 0;
  const claimsCount = analysisResult ? analysisResult.metrics.claims_extracted : 0;
  const conflictsCount = analysisResult ? analysisResult.metrics.potential_conflicts : 0;
  const gapsCount = analysisResult ? analysisResult.metrics.information_gaps : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-950 via-navy-900 to-navy-850 p-8 md:p-10 text-white shadow-xl border border-navy-800">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/20 border border-electric-400/30 text-electric-300 text-xs font-semibold mb-4 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-electric-400" />
            <span>AI Evidence Intelligence Platform</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Discover what information is missing.
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Analyse multiple sources, uncover contradictions and make evidence-backed decisions.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-electric-400" />
              <span>Multi-source provenance</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Contradiction flagging</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Verification action checklist</span>
            </div>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 rounded-full bg-electric-600/10 blur-3xl pointer-events-none" />
        <div className="absolute right-20 bottom-0 w-64 h-64 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
      </div>

      {/* Error Message Alert Banner */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex items-start justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-rose-900">Analysis Ingestion Notice</h4>
              <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
              {errorMessage.includes("GEMINI_API_KEY") && (
                <p className="text-[11px] text-rose-600 mt-1 font-mono bg-white/70 p-2 rounded border border-rose-200">
                  Tip: Add GEMINI_API_KEY=your_key to backend/.env and restart the FastAPI server.
                </p>
              )}
            </div>
          </div>
          {onDismissError && (
            <button
              onClick={onDismissError}
              className="text-rose-500 hover:text-rose-700 p-1 rounded-lg"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Four Metric Cards (initially show zero, populated on analysis) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <MetricCard
          title="Sources Analysed"
          value={sourcesCount}
          subtitle="Indexed web URLs, PDFs & notes"
          icon={FileSearch}
          accentColor="blue"
          badge={analysisResult ? "Synthesized" : sources.length > 0 ? "Staged" : "Empty"}
        />

        <MetricCard
          title="Claims Extracted"
          value={claimsCount}
          subtitle="Atomic verifiable claims"
          icon={Layers}
          accentColor="purple"
          badge={claimsCount > 0 ? "Grounded" : "Awaiting Run"}
        />

        <MetricCard
          title="Potential Conflicts"
          value={conflictsCount}
          subtitle="Discrepancies & outdated details"
          icon={AlertOctagon}
          accentColor="rose"
          badge={conflictsCount > 0 ? `${conflictsCount} Flagged` : "No Conflicts"}
        />

        <MetricCard
          title="Information Gaps"
          value={gapsCount}
          subtitle="Unanswered decision questions"
          icon={HelpCircle}
          accentColor="amber"
          badge={gapsCount > 0 ? `${gapsCount} Critical Gaps` : "Ready"}
        />
      </div>

      {/* Research Workspace Section */}
      <div ref={workspaceRef}>
        <ResearchWorkspace
          topic={topic}
          setTopic={setTopic}
          question={question}
          setQuestion={setQuestion}
          currentUrl={currentUrl}
          setCurrentUrl={setCurrentUrl}
          manualText={manualText}
          setManualText={setManualText}
          sources={sources}
          onAddUrl={onAddUrl}
          onAddPdf={onAddPdf}
          onAddManualText={onAddManualText}
          onRemoveSource={onRemoveSource}
          onAnalyze={onAnalyze}
          isAnalyzing={isAnalyzing}
          notification={notification}
        />
      </div>

      {/* Analysis Tabs Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Evidence Synthesis & Gap Matrix
            </h2>
            <p className="text-xs text-slate-500">
              Inspect extracted propositions, discrepancies, detected blind spots, and verification tasks.
            </p>
          </div>
        </div>

        <AnalysisTabs 
          sourceCount={sources.length} 
          analysisResult={analysisResult}
          onNavigateToWorkspace={scrollToWorkspace} 
          onToggleChecklistItem={onToggleChecklistItem}
        />
      </div>
    </div>
  );
};
