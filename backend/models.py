from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class SourceInput(BaseModel):
    id: str
    type: Literal["url", "pdf", "text"]
    title: str
    url: Optional[str] = None
    textContent: Optional[str] = None
    fileName: Optional[str] = None
    fileSize: Optional[int] = None

class ExtractedSource(BaseModel):
    source_id: str
    type: Literal["url", "pdf", "text"]
    title: str
    url_or_filename: str
    extracted_text: str
    publication_date: Optional[str] = None
    validity_period: Optional[str] = None
    status: Literal["success", "failed", "partial"]
    error_message: Optional[str] = None
    character_count: int = 0

class ExtractedClaim(BaseModel):
    claim_id: str
    claim_text: str
    topic: str
    source_id: str
    source_title: str
    source_url: Optional[str] = None
    evidence_excerpt: str
    publication_date: Optional[str] = None
    page_or_section: Optional[str] = None
    confidence: float = Field(default=0.9, ge=0.0, le=1.0)

class ConflictSourceRef(BaseModel):
    claim_text: str
    source_id: str
    source_title: str
    source_url: Optional[str] = None
    evidence_excerpt: str
    publication_date: Optional[str] = None
    page_or_section: Optional[str] = None

class Contradiction(BaseModel):
    conflict_id: str
    topic: str
    severity: Literal["high", "medium", "low"]
    source_a: ConflictSourceRef
    source_b: ConflictSourceRef
    conflict_reason: str
    resolution_hint: str
    can_resolve_by_date: bool = False
    can_resolve_by_authority: bool = False
    confidence_level: Optional[str] = "High uncertainty between disparate sources"

class InformationGap(BaseModel):
    gap_id: str
    title: str
    category: Literal["timeline", "prerequisites", "official_policy", "fees", "documentation", "other"]
    unanswered_question: str
    importance: Literal["critical", "moderate", "exploratory"]
    why_it_matters: str
    suggested_verification: str
    flag_reason: str = "Requirement unaddressed in ingested documents"

class OutdatedDetail(BaseModel):
    detail_id: str
    source_id: str
    source_title: str
    source_url: Optional[str] = None
    dated_reference: str
    potential_concern: str
    recommendation: str

class UndatedSourceWarning(BaseModel):
    warning_id: str
    source_id: str
    source_title: str
    url_or_filename: str
    message: str = "Source contains no declared publication date or version timestamp. Recommend checking primary portal for recent revisions."

class VerificationChecklistItem(BaseModel):
    item_id: str
    action_required: str
    why_it_matters: str
    recommended_authority: str
    priority: Literal["high", "medium", "low"]
    rationale: str
    supporting_sources: List[str] = []
    completed: bool = False

class DecisionReadiness(BaseModel):
    score: int = Field(ge=0, le=100)
    level: Literal["High", "Moderate", "Preliminary / Incomplete"]
    available_info_count: int
    missing_info_count: int
    unresolved_conflicts_count: int
    completed_verifications_count: int
    explanation: str
    disclaimer: str = "This decision readiness score reflects informational completeness and consistency across submitted evidence. It is not an algorithmic guarantee of decision accuracy or legal validity."

class AnalysisMetrics(BaseModel):
    sources_analysed: int
    claims_extracted: int
    potential_conflicts: int
    information_gaps: int
    verification_actions: int
    readiness_score: int = 50
    readiness_level: str = "Moderate"

class AnalysisResponse(BaseModel):
    session_id: str
    topic: str
    question: Optional[str] = None
    metrics: AnalysisMetrics
    decision_readiness: DecisionReadiness
    sources: List[ExtractedSource]
    extraction_failures: List[ExtractedSource] = []
    claims: List[ExtractedClaim]
    conflicts: List[Contradiction]
    gaps: List[InformationGap]
    outdated_warnings: List[OutdatedDetail]
    undated_sources: List[UndatedSourceWarning] = []
    checklist: List[VerificationChecklistItem]
    synthesis_summary: str
