import React, { useState } from 'react';
import { 
  BarChart3, 
  FileCheck2, 
  AlertTriangle, 
  HelpCircle, 
  CheckSquare, 
  Sparkles,
  Calendar,
  CheckCircle2,
  FileText,
  Filter,
  Info,
  ExternalLink,
  Search,
  Download,
  FileDown,
  ShieldAlert,
  Clock,
  AlertOctagon,
  Eye,
  Mic
} from 'lucide-react';
import { 
  AnalysisTab, 
  AnalysisResponse, 
  EvidenceTraceModalData,
  ExtractedClaim,
  Contradiction,
  InformationGap,
  ExtractedSourceItem
} from '../types';
import { EmptyState } from './EmptyState';
import { DecisionReadinessCard } from './DecisionReadinessCard';
import { EvidenceDrawer } from './EvidenceDrawer';
import { downloadJsonReport, downloadMarkdownReport } from '../lib/exportUtils';

interface AnalysisTabsProps {
  sourceCount: number;
  analysisResult: AnalysisResponse | null;
  onNavigateToWorkspace?: () => void;
  onToggleChecklistItem?: (itemId: string) => void;
}

export const AnalysisTabs: React.FC<AnalysisTabsProps> = ({
  sourceCount,
  analysisResult,
  onNavigateToWorkspace,
  onToggleChecklistItem
}) => {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('overview');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [traceModalData, setTraceModalData] = useState<EvidenceTraceModalData | null>(null);

  const claims = analysisResult?.claims || [];
  const conflicts = analysisResult?.conflicts || [];
  const gaps = analysisResult?.gaps || [];
  const outdatedWarnings = analysisResult?.outdated_warnings || [];
  const undatedSources = analysisResult?.undated_sources || [];
  const extractionFailures = analysisResult?.extraction_failures || [];
  const checklist = analysisResult?.checklist || [];

  // Source lookup map for full context inspection
  const sourceContextMap = React.useMemo(() => {
    const map = new Map<string, ExtractedSourceItem>();
    if (analysisResult?.sources) {
      analysisResult.sources.forEach(s => map.set(s.source_id, s));
    }
    return map;
  }, [analysisResult]);

  const topics = ['all', ...Array.from(new Set(claims.map(c => c.topic)))];

  const filteredClaims = claims.filter(c => {
    const matchesTopic = selectedTopicFilter === 'all' || c.topic === selectedTopicFilter;
    const matchesSearch = !searchQuery.trim() || 
      c.claim_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.source_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.evidence_excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTopic && matchesSearch;
  });

  const completedChecklistCount = checklist.filter(item => item.completed).length;

  const handleOpenTraceForClaim = (claim: ExtractedClaim) => {
    const src = sourceContextMap.get(claim.source_id);
    const isAudio = src?.type === 'audio' || claim.source_title.toLowerCase().startsWith('audio') || claim.source_id.startsWith('audio-');
    setTraceModalData({
      title: isAudio ? `Audio Claim Evidence: ${claim.topic}` : `Claim Evidence: ${claim.topic}`,
      sourceTitle: claim.source_title,
      sourceType: isAudio ? 'audio' : ((src?.type as any) || (claim.source_url?.startsWith('http') ? 'url' : 'text')),
      sourceUrlOrPath: claim.source_url || src?.url_or_filename,
      verbatimExcerpt: claim.evidence_excerpt,
      fullSourceContext: src?.extracted_text,
      findingClaim: claim.claim_text,
      publicationDate: claim.publication_date || src?.publication_date,
      status: src?.status
    });
  };

  const handleOpenTraceForConflict = (conf: Contradiction) => {
    const srcA = sourceContextMap.get(conf.source_a.source_id);
    setTraceModalData({
      title: `Contradiction Audit: ${conf.topic}`,
      sourceTitle: `${conf.source_a.source_title} vs. ${conf.source_b.source_title}`,
      sourceType: 'url',
      sourceUrlOrPath: conf.source_a.source_url || conf.source_b.source_url,
      verbatimExcerpt: `[Source A]: "${conf.source_a.evidence_excerpt}"\n\n[Source B]: "${conf.source_b.evidence_excerpt}"`,
      fullSourceContext: srcA ? `Full Context from Source A (${conf.source_a.source_title}):\n\n${srcA.extracted_text}` : undefined,
      findingClaim: `Discrepancy: ${conf.source_a.claim_text} vs. ${conf.source_b.claim_text}`,
      warningReason: conf.conflict_reason + `\n\nResolution Hint: ${conf.resolution_hint}`
    });
  };

  const handleOpenTraceForGap = (gap: InformationGap) => {
    setTraceModalData({
      title: `Information Gap Analysis: ${gap.title}`,
      sourceTitle: `Unaddressed Decision Requirement`,
      sourceType: 'text',
      verbatimExcerpt: `No confirming statements found in ingested corpus.`,
      findingClaim: gap.unanswered_question,
      warningReason: `Why It Matters: ${gap.why_it_matters}\n\nSuggested Verification Action: ${gap.suggested_verification}`
    });
  };

  const handleOpenTraceForSource = (src: ExtractedSourceItem) => {
    setTraceModalData({
      title: `Document Ledger: ${src.title}`,
      sourceTitle: src.title,
      sourceType: src.type,
      sourceUrlOrPath: src.url_or_filename,
      verbatimExcerpt: src.extracted_text ? src.extracted_text.slice(0, 300) + '...' : '(No text extracted)',
      fullSourceContext: src.extracted_text,
      publicationDate: src.publication_date,
      status: src.status
    });
  };

  const tabs = [
    {
      id: 'overview' as AnalysisTab,
      label: 'Overview & Readiness',
      icon: BarChart3,
      badge: analysisResult ? `${analysisResult.decision_readiness.score}/100` : '0 Insights'
    },
    {
      id: 'claims' as AnalysisTab,
      label: 'Extracted Claims',
      icon: FileCheck2,
      badge: `${claims.length} Claims`
    },
    {
      id: 'conflicts' as AnalysisTab,
      label: 'Conflicts',
      icon: AlertTriangle,
      badge: `${conflicts.length} Detected`
    },
    {
      id: 'gaps' as AnalysisTab,
      label: 'Information Gaps',
      icon: HelpCircle,
      badge: `${gaps.length} Gaps`
    },
    {
      id: 'checklist' as AnalysisTab,
      label: 'Verification Checklist',
      icon: CheckSquare,
      badge: `${completedChecklistCount}/${checklist.length} Done`
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
      {/* Evidence Provenance Inspector Modal */}
      <EvidenceDrawer 
        data={traceModalData} 
        onClose={() => setTraceModalData(null)} 
      />

      {/* Tab Navigation Bar with Export Actions */}
      <div className="border-b border-slate-200 bg-slate-50/50 px-4 pt-3 flex items-center justify-between overflow-x-auto scrollbar-none gap-4">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-electric-600 text-electric-600 bg-white shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-electric-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  isActive ? 'bg-electric-50 text-electric-700 font-bold' : 'bg-slate-200/70 text-slate-600'
                }`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Export Buttons */}
        {analysisResult && (
          <div className="flex items-center gap-2 pb-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => downloadJsonReport(analysisResult)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Download structured JSON report"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export JSON</span>
            </button>
            <button
              type="button"
              onClick={() => downloadMarkdownReport(analysisResult)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Download professional Markdown dossier"
            >
              <FileDown className="w-3.5 h-3.5 text-electric-400" />
              <span>Export Report</span>
            </button>
          </div>
        )}
      </div>

      {/* Tab Contents */}
      <div className="p-6 md:p-8">
        {/* ================= TAB 1: OVERVIEW & READINESS ================= */}
        {activeTab === 'overview' && (
          analysisResult ? (
            <div className="space-y-6">
              {/* Decision Readiness Indicator Component */}
              <DecisionReadinessCard
                readiness={analysisResult.decision_readiness}
                completedTasksCount={completedChecklistCount}
                totalTasksCount={checklist.length}
              />

              {/* Executive Summary */}
              <div className="bg-gradient-to-br from-slate-900 to-navy-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md">
                <div className="flex items-center gap-2 text-xs font-semibold text-electric-400 mb-2 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Executive Evidence Synthesis</span>
                </div>
                <h3 className="text-xl font-bold tracking-tight text-white mb-2">
                  {analysisResult.topic}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                  {analysisResult.synthesis_summary}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {claims.length} Verifiable Claims Grounded
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {conflicts.length} Contradictions Detected
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <HelpCircle className="w-3.5 h-3.5" />
                    {gaps.length} Information Gaps Uncovered
                  </span>
                </div>
              </div>

              {/* Source Freshness Analysis (Module 5) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-electric-600" />
                    <span>Source Freshness & Temporal Integrity Analysis</span>
                  </h4>
                  <span className="text-xs text-slate-400">Dates strictly verified from source metadata</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Potentially Outdated Details */}
                  {outdatedWarnings.length > 0 ? (
                    <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 space-y-3">
                      <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                        <Calendar className="w-4 h-4 text-amber-600" />
                        <span>Potentially Expired / Superseded Details ({outdatedWarnings.length})</span>
                      </div>
                      <div className="space-y-2">
                        {outdatedWarnings.map((w, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-lg border border-amber-200/60 text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-slate-800 truncate">{w.source_title}</span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                Cycle: {w.dated_reference}
                              </span>
                            </div>
                            <p className="text-slate-600 mt-1">{w.potential_concern}</p>
                            <p className="text-amber-700 font-medium mt-1">Next Step: {w.recommendation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>No explicit references to expired academic or application cycles found.</span>
                    </div>
                  )}

                  {/* Undated Sources Warning */}
                  {undatedSources.length > 0 ? (
                    <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200/90 space-y-3">
                      <div className="flex items-center gap-2 text-blue-800 font-bold text-xs uppercase tracking-wider">
                        <Info className="w-4 h-4 text-blue-600" />
                        <span>Undated Sources Advisory ({undatedSources.length})</span>
                      </div>
                      <p className="text-[11px] text-blue-700">
                        * Note: Undated sources are not automatically considered outdated; verify policy validity before final decisions.
                      </p>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {undatedSources.map((u) => (
                          <div key={u.warning_id} className="bg-white p-2.5 rounded-lg border border-blue-200/60 text-xs flex items-center justify-between">
                            <span className="font-medium text-slate-800 truncate">{u.source_title}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                              No Timestamp
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>All reviewed sources declare timestamped metadata.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Ingested Sources Ledger Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Source Audit Ledger ({analysisResult.sources.length})
                  </h4>
                  <span className="text-xs text-slate-400">Click any row to trace provenance</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                        <th className="pb-2.5">Source & Document</th>
                        <th className="pb-2.5">Type</th>
                        <th className="pb-2.5">Extracted Characters</th>
                        <th className="pb-2.5">Publication Date</th>
                        <th className="pb-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {analysisResult.sources.map((src) => (
                        <tr key={src.source_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 font-medium text-slate-800">
                            <div className="flex items-center gap-2">
                              <span className="truncate max-w-xs md:max-w-md font-semibold text-slate-900" title={src.title}>
                                {src.title}
                              </span>
                              {src.type === 'url' && src.url_or_filename.startsWith('http') && (
                                <a 
                                  href={src.url_or_filename} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-electric-600 hover:text-electric-800"
                                  title="Open in new tab"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-xs">
                              {src.url_or_filename}
                            </div>
                          </td>
                          <td className="py-3">
                            <span className={`uppercase text-[10px] font-bold px-2 py-0.5 rounded ${
                              src.type === 'audio'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : src.type === 'pdf'
                                ? 'bg-rose-100 text-rose-800'
                                : src.type === 'url'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {src.type === 'audio' ? 'Voice / Audio' : src.type}
                            </span>
                          </td>
                          <td className="py-3 text-slate-600 font-mono">
                            {src.character_count.toLocaleString()} chars
                          </td>
                          <td className="py-3 text-slate-600">
                            {src.publication_date || "Undated"}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenTraceForSource(src)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3 text-slate-500" />
                              <span>Inspect</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="Evidence Synthesis Overview"
              description="Run research on your added sources to see comparative topic analysis, claim consistency ratings, and multi-source confidence scores."
              accent="blue"
              features={[
                "Side-by-side claim alignment across all submitted URLs & PDFs",
                "Visual confidence scores separating factual citations from uncertainty",
                "Temporal timeline highlighting publication & revision dates",
                "Summary matrix identifying missing governance & policy criteria"
              ]}
              actionText={sourceCount === 0 ? "Add First Source in Workspace" : "Ready to Ingest"}
              onAction={onNavigateToWorkspace}
            />
          )
        )}

        {/* ================= TAB 2: EXTRACTED CLAIMS ================= */}
        {activeTab === 'claims' && (
          claims.length > 0 ? (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                <div className="relative flex-1 max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search propositions, statements, or source names..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-electric-500 transition-all"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3" />
                    Categories:
                  </span>
                  {topics.map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedTopicFilter(t)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        selectedTopicFilter === t
                          ? 'bg-electric-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Claims Count Banner */}
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>Showing {filteredClaims.length} of {claims.length} grounded claims</span>
                <span className="text-[11px] text-slate-400">Every claim links to original excerpt</span>
              </div>

              {/* Claims Cards */}
              <div className="grid grid-cols-1 gap-3.5">
                {filteredClaims.map((claim) => (
                  <div
                    key={claim.claim_id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {claim.topic}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          ID: {claim.claim_id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                          Confidence: {Math.round(claim.confidence * 100)}%
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenTraceForClaim(claim)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-electric-50 hover:text-electric-600 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Inspect verbatim evidence in context"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Evidence</span>
                        </button>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {claim.claim_text}
                    </h4>

                    {/* Verbatim Excerpt */}
                    <div className="p-3 rounded-lg bg-slate-50 border-l-2 border-electric-500 text-xs text-slate-600 italic">
                      "{claim.evidence_excerpt}"
                    </div>

                    {/* Source Attribution & Direct URL Link */}
                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 font-medium text-slate-600 truncate max-w-md">
                        {sourceContextMap.get(claim.source_id)?.type === 'audio' || claim.source_title.toLowerCase().startsWith('audio') ? (
                          <>
                            <Mic className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                            <span className="truncate">Source: {claim.source_title}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                              Voice Audio
                            </span>
                          </>
                        ) : (
                          <>
                            <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">Source: {claim.source_title}</span>
                          </>
                        )}
                        {claim.source_url && claim.source_url.startsWith('http') && (
                          <a
                            href={claim.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-electric-600 hover:text-electric-800 underline inline-flex items-center gap-0.5"
                          >
                            <span>Open URL</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      {claim.publication_date && (
                        <span>Published: {claim.publication_date}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={FileCheck2}
              title="No Extracted Claims Yet"
              description="Once sources are ingested and processed, atomic verifiable propositions extracted from each document will be indexed here with exact source references."
              accent="indigo"
              features={[
                "Atomic claim decomposition with sentence-level citations",
                "Provenance tracking linking claims directly back to page numbers & URLs",
                "Contextual excerpt previews highlighting surrounding caveats",
                "Exportable structured claims log for peer auditing"
              ]}
              actionText="Configure Sources"
              onAction={onNavigateToWorkspace}
            />
          )
        )}

        {/* ================= TAB 3: CONFLICTS ================= */}
        {activeTab === 'conflicts' && (
          conflicts.length > 0 ? (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2 text-xs text-amber-800">
                <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Contradiction Audit Protocol:</strong> Discrepancies are flagged for side-by-side comparison. Neither statement is assumed false; both are displayed with supporting citations, dates, and uncertainty ratings.
                </span>
              </div>

              <div className="space-y-4">
                {conflicts.map((conflict) => {
                  const severityStyle = {
                    high: 'bg-rose-50 text-rose-700 border-rose-200',
                    medium: 'bg-amber-50 text-amber-700 border-amber-200',
                    low: 'bg-blue-50 text-blue-700 border-blue-200'
                  }[conflict.severity];

                  return (
                    <div
                      key={conflict.conflict_id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card space-y-4"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <h4 className="text-sm font-bold text-slate-900">{conflict.topic}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${severityStyle}`}>
                            {conflict.severity} Severity Discrepancy
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenTraceForConflict(conflict)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Trace Both</span>
                          </button>
                        </div>
                      </div>

                      {/* Side by side comparison cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Source A */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="font-bold text-slate-800 truncate">Source A: {conflict.source_a.source_title}</span>
                            {conflict.source_a.publication_date && (
                              <span className="text-[10px] font-medium bg-slate-200 px-1.5 py-0.5 rounded">
                                {conflict.source_a.publication_date}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-slate-900">
                            {conflict.source_a.claim_text}
                          </p>
                          <p className="text-[11px] text-slate-500 italic bg-white p-2.5 rounded border border-slate-100">
                            "{conflict.source_a.evidence_excerpt}"
                          </p>
                          {conflict.source_a.source_url && conflict.source_a.source_url.startsWith('http') && (
                            <a
                              href={conflict.source_a.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-electric-600 hover:underline inline-flex items-center gap-1 pt-1"
                            >
                              <span>View Source A</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        {/* Source B */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="font-bold text-slate-800 truncate">Source B: {conflict.source_b.source_title}</span>
                            {conflict.source_b.publication_date && (
                              <span className="text-[10px] font-medium bg-slate-200 px-1.5 py-0.5 rounded">
                                {conflict.source_b.publication_date}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-slate-900">
                            {conflict.source_b.claim_text}
                          </p>
                          <p className="text-[11px] text-slate-500 italic bg-white p-2.5 rounded border border-slate-100">
                            "{conflict.source_b.evidence_excerpt}"
                          </p>
                          {conflict.source_b.source_url && conflict.source_b.source_url.startsWith('http') && (
                            <a
                              href={conflict.source_b.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-electric-600 hover:underline inline-flex items-center gap-1 pt-1"
                            >
                              <span>View Source B</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Conflict Reason & Resolution Guidance */}
                      <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                        <div className="text-slate-700">
                          <strong className="text-slate-900">Nature of Discrepancy:</strong> {conflict.conflict_reason}
                        </div>
                        <div className="text-electric-700 bg-electric-50/70 p-3 rounded-xl border border-electric-100 flex items-start gap-2">
                          <ShieldAlert className="w-4 h-4 text-electric-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <strong>Resolution Pathway:</strong> {conflict.resolution_hint}
                            {conflict.confidence_level && (
                              <span className="block text-[11px] text-electric-800 mt-1 font-medium">
                                Uncertainty Status: {conflict.confidence_level}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={AlertTriangle}
              title="No Contradictions Flagged"
              description="GapGlint flags direct contradictions, mutually exclusive deadlines, conflicting prerequisite criteria, and warnings for outdated information."
              accent="rose"
              features={[
                "Cross-document numerical and deadline discrepancy detection",
                "Temporal warnings identifying superseded or outdated guidelines",
                "Severity tagging (High: Incompatible conditions, Medium: Differing phrasing)",
                "Source authority contrast (Official policy vs. third-party summaries)"
              ]}
              actionText="Add Competing Sources"
              onAction={onNavigateToWorkspace}
            />
          )
        )}

        {/* ================= TAB 4: INFORMATION GAPS ================= */}
        {activeTab === 'gaps' && (
          gaps.length > 0 || extractionFailures.length > 0 ? (
            <div className="space-y-6">
              {/* Separate Extraction Failures Section (Module 4 Requirement) */}
              {extractionFailures.length > 0 && (
                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                  <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                    <AlertOctagon className="w-4 h-4 text-rose-600" />
                    <span>Inaccessible Sources / Extraction Failures ({extractionFailures.length})</span>
                  </div>
                  <p className="text-xs text-rose-700">
                    The following sources could not be processed due to access blocks or unsupported formats. They are cataloged separately from substantive content gaps:
                  </p>
                  <div className="space-y-2">
                    {extractionFailures.map((fail) => (
                      <div key={fail.source_id} className="p-3 bg-white rounded-xl border border-rose-200 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800">{fail.title}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{fail.url_or_filename}</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                          {fail.error_message || 'Extraction Failed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Substantive Gaps Advisory */}
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-2 text-xs text-blue-800">
                <HelpCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Negative Space Discovery:</strong> The items below represent vital questions and decision criteria that could NOT be found anywhere in the reviewed documentation.
                </span>
              </div>

              {/* Gaps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gaps.map((gap) => {
                  const importanceStyle = {
                    critical: 'bg-rose-50 text-rose-700 border-rose-200',
                    moderate: 'bg-amber-50 text-amber-700 border-amber-200',
                    exploratory: 'bg-blue-50 text-blue-700 border-blue-200'
                  }[gap.importance];

                  return (
                    <div
                      key={gap.gap_id}
                      className="p-5 rounded-2xl border border-slate-200 bg-white shadow-card space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {gap.category}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${importanceStyle}`}>
                              {gap.importance} Gap
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenTraceForGap(gap)}
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
                              title="Inspect gap details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {gap.title}
                        </h4>

                        <p className="text-xs text-electric-700 font-medium mt-1">
                          Unanswered Question: {gap.unanswered_question}
                        </p>

                        <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                          <strong className="text-slate-800 block mb-0.5">Why It Matters:</strong>
                          {gap.why_it_matters}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                        <div>
                          <span className="font-semibold text-slate-700">Flag Rationale:</span> {gap.flag_reason || 'Unaddressed in reviewed sources'}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700">Recommended Action:</span> {gap.suggested_verification}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={HelpCircle}
              title="No Information Gaps Identified"
              description="GapGlint looks beyond what is stated to uncover what is critically missing — like unstated fees, hidden renewal requirements, or missing procedural steps."
              accent="amber"
              features={[
                "Omission detection based on decision category ontologies",
                "Unanswered questions critical for complete evaluation",
                "Prerequisite blind-spot warnings (e.g. visa processing lead times)",
                "Contextual recommendations for queries to submit to authorities"
              ]}
              actionText="Formulate Research Query"
              onAction={onNavigateToWorkspace}
            />
          )
        )}

        {/* ================= TAB 5: VERIFICATION CHECKLIST ================= */}
        {activeTab === 'checklist' && (
          checklist.length > 0 ? (
            <div className="space-y-5">
              {/* Progress Summary Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-200 gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Prioritized Verification Checklist ({completedChecklistCount}/{checklist.length} Complete)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Items are ranked by decision impact. Completing these with primary authorities closes identified blind spots.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-electric-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${checklist.length > 0 ? (completedChecklistCount / checklist.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    {checklist.length > 0 ? Math.round((completedChecklistCount / checklist.length) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Checklist Tasks */}
              <div className="space-y-3">
                {checklist.map((item) => {
                  const priorityStyle = {
                    high: 'bg-rose-50 text-rose-700 border-rose-200',
                    medium: 'bg-amber-50 text-amber-700 border-amber-200',
                    low: 'bg-blue-50 text-blue-700 border-blue-200'
                  }[item.priority];

                  return (
                    <div
                      key={item.item_id}
                      onClick={() => onToggleChecklistItem && onToggleChecklistItem(item.item_id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                        item.completed
                          ? 'bg-emerald-50/40 border-emerald-200 text-slate-500'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => onToggleChecklistItem && onToggleChecklistItem(item.item_id)}
                        className="mt-1 w-4 h-4 rounded text-electric-600 border-slate-300 focus:ring-electric-500 cursor-pointer"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${priorityStyle}`}>
                            {item.priority} Priority
                          </span>
                          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            Consult Authority: {item.recommended_authority}
                          </span>
                        </div>

                        <p className={`text-xs md:text-sm font-bold ${item.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {item.action_required}
                        </p>

                        <p className="text-xs text-slate-600 mt-1">
                          <strong>Why It Matters:</strong> {item.why_it_matters || item.rationale}
                        </p>

                        {item.supporting_sources && item.supporting_sources.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-400 flex-wrap">
                            <span className="font-semibold text-slate-500">Supporting References:</span>
                            {item.supporting_sources.map((sTitle, idx) => (
                              <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                {sTitle}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={CheckSquare}
              title="Verification Checklist Empty"
              description="A prioritized, actionable checklist will guide you on exactly which primary authorities to contact and which documents to verify before finalizing your decision."
              accent="emerald"
              features={[
                "Ranked by decision risk and consequence severity",
                "Actionable queries tailored for registrars, coordinators, and portals",
                "Interactive checkbox tracking for diligence workflows",
                "Suggested primary sources to close each identified gap"
              ]}
              actionText="Start Investigation"
              onAction={onNavigateToWorkspace}
            />
          )
        )}
      </div>
    </div>
  );
};
