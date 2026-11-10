export type NavSection = 'overview' | 'new-research' | 'history' | 'about';

export type AnalysisTab = 'overview' | 'claims' | 'conflicts' | 'gaps' | 'checklist';

export interface Source {
  id: string;
  type: 'url' | 'pdf' | 'text' | 'audio';
  title: string;
  url?: string;
  fileName?: string;
  fileSize?: number;
  file?: File;
  textContent?: string;
  createdAt: string;
  status: 'ready' | 'processing' | 'error';
  audioMetadata?: {
    requestId?: string;
    model?: string;
    detectedLanguageCode?: string;
    processingTime?: number;
    endToEndLatency?: number;
    originalFileName?: string;
  };
}

export interface MetricCardData {
  id: string;
  title: string;
  value: number;
  label: string;
  description: string;
  icon: string;
  badge?: string;
}

export interface ExtractedClaim {
  claim_id: string;
  claim_text: string;
  topic: string;
  source_id: string;
  source_title: string;
  source_url?: string | null;
  evidence_excerpt: string;
  publication_date?: string | null;
  page_or_section?: string | null;
  confidence: number;
}

export interface ConflictSourceRef {
  claim_text: string;
  source_id: string;
  source_title: string;
  source_url?: string | null;
  evidence_excerpt: string;
  publication_date?: string | null;
  page_or_section?: string | null;
}

export interface Contradiction {
  conflict_id: string;
  topic: string;
  severity: 'high' | 'medium' | 'low';
  source_a: ConflictSourceRef;
  source_b: ConflictSourceRef;
  conflict_reason: string;
  resolution_hint: string;
  can_resolve_by_date: boolean;
  can_resolve_by_authority: boolean;
  confidence_level?: string;
}

export interface InformationGap {
  gap_id: string;
  title: string;
  category: 'timeline' | 'prerequisites' | 'official_policy' | 'fees' | 'documentation' | 'other';
  unanswered_question: string;
  importance: 'critical' | 'moderate' | 'exploratory';
  why_it_matters: string;
  suggested_verification: string;
  flag_reason?: string;
}

export interface OutdatedDetail {
  detail_id: string;
  source_id: string;
  source_title: string;
  source_url?: string | null;
  dated_reference: string;
  potential_concern: string;
  recommendation: string;
}

export interface UndatedSourceWarning {
  warning_id: string;
  source_id: string;
  source_title: string;
  url_or_filename: string;
  message: string;
}

export interface VerificationChecklistItem {
  item_id: string;
  action_required: string;
  why_it_matters: string;
  recommended_authority: string;
  priority: 'high' | 'medium' | 'low';
  rationale: string;
  supporting_sources?: string[];
  completed: boolean;
}

export interface DecisionReadiness {
  score: number;
  level: 'High' | 'Moderate' | 'Preliminary / Incomplete';
  available_info_count: number;
  missing_info_count: number;
  unresolved_conflicts_count: number;
  completed_verifications_count: number;
  explanation: string;
  disclaimer: string;
}

export interface ExtractedSourceItem {
  source_id: string;
  type: 'url' | 'pdf' | 'text' | 'audio';
  title: string;
  url_or_filename: string;
  extracted_text: string;
  publication_date?: string | null;
  validity_period?: string | null;
  status: 'success' | 'failed' | 'partial';
  error_message?: string | null;
  character_count: number;
}

export interface AnalysisMetrics {
  sources_analysed: number;
  claims_extracted: number;
  potential_conflicts: number;
  information_gaps: number;
  verification_actions: number;
  readiness_score: number;
  readiness_level: string;
}

export interface AnalysisResponse {
  session_id: string;
  topic: string;
  question?: string | null;
  metrics: AnalysisMetrics;
  decision_readiness: DecisionReadiness;
  sources: ExtractedSourceItem[];
  extraction_failures: ExtractedSourceItem[];
  claims: ExtractedClaim[];
  conflicts: Contradiction[];
  gaps: InformationGap[];
  outdated_warnings: OutdatedDetail[];
  undated_sources: UndatedSourceWarning[];
  checklist: VerificationChecklistItem[];
  synthesis_summary: string;
}

export interface EvidenceTraceModalData {
  title: string;
  sourceTitle: string;
  sourceType: 'url' | 'pdf' | 'text' | 'audio';
  sourceUrlOrPath?: string | null;
  verbatimExcerpt: string;
  fullSourceContext?: string;
  findingClaim?: string;
  warningReason?: string;
  publicationDate?: string | null;
  status?: string;
}

export interface AudioTranscriptionResult {
  success: boolean;
  transcript: string;
  request_id?: string;
  model: string;
  detected_language_code?: string;
  processing_time?: number;
  end_to_end_latency?: number;
  filename?: string;
  file_size_bytes?: number;
}

