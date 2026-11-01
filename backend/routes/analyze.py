import uuid
import json
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from models import (
    AnalysisResponse,
    AnalysisMetrics,
    DecisionReadiness,
    ExtractedSource,
    ExtractedClaim,
    Contradiction,
    ConflictSourceRef,
    InformationGap,
    OutdatedDetail,
    UndatedSourceWarning,
    VerificationChecklistItem
)
from services.source_extractor import (
    extract_from_url,
    extract_from_pdf_bytes,
    extract_from_manual_text
)
from services.gemini_service import analyze_sources_with_gemini

logger = logging.getLogger("gapglint.routes.analyze")
router = APIRouter(prefix="/api", tags=["analysis"])

class AnalyzeJsonPayload(BaseModel):
    topic: str
    question: Optional[str] = None
    urls: List[str] = []
    manual_texts: List[dict] = [] # list of {"id": str, "title": str, "content": str}

@router.post("/analyze/json", response_model=AnalysisResponse)
async def analyze_sources_json(payload: AnalyzeJsonPayload):
    """Analyze sources provided via JSON payload (URLs and manual text)."""
    if not payload.topic.strip():
        raise HTTPException(status_code=400, detail="Research topic is required.")

    if not payload.urls and not payload.manual_texts:
        raise HTTPException(status_code=400, detail="At least one source (URL or text) must be provided.")

    extracted_sources: List[ExtractedSource] = []

    # Process URLs
    for url in payload.urls:
        if url.strip():
            src_id = f"url-{uuid.uuid4().hex[:8]}"
            res = await extract_from_url(url.strip(), src_id)
            extracted_sources.append(res)

    # Process manual texts
    for item in payload.manual_texts:
        content = item.get("content", "").strip()
        if content:
            src_id = item.get("id") or f"text-{uuid.uuid4().hex[:8]}"
            title = item.get("title") or "Manual Note"
            res = extract_from_manual_text(content, src_id, title)
            extracted_sources.append(res)

    # Run AI pipeline
    try:
        raw_result = await analyze_sources_with_gemini(
            topic=payload.topic,
            question=payload.question,
            sources=extracted_sources
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Analysis failure: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to execute analysis: {str(e)}")

    return format_analysis_response(payload.topic, payload.question, extracted_sources, raw_result)

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_sources_multipart(
    topic: str = Form(...),
    question: Optional[str] = Form(None),
    urls_json: Optional[str] = Form(None), # JSON array string: ["https://..."]
    manual_text: Optional[str] = Form(None),
    pdf_files: List[UploadFile] = File(default=[])
):
    """Multipart endpoint supporting file uploads alongside URLs and text."""
    if not topic.strip():
        raise HTTPException(status_code=400, detail="Research topic is required.")

    extracted_sources: List[ExtractedSource] = []

    # Parse URLs
    urls: List[str] = []
    if urls_json:
        try:
            urls = json.loads(urls_json)
        except Exception:
            urls = [u.strip() for u in urls_json.split("\n") if u.strip()]

    for url in urls:
        if url.strip():
            src_id = f"url-{uuid.uuid4().hex[:8]}"
            res = await extract_from_url(url.strip(), src_id)
            extracted_sources.append(res)

    # Process PDF file uploads
    for pdf in pdf_files:
        if pdf.filename:
            src_id = f"pdf-{uuid.uuid4().hex[:8]}"
            content = await pdf.read()
            res = extract_from_pdf_bytes(content, pdf.filename, src_id)
            extracted_sources.append(res)

    # Process Manual Text
    if manual_text and manual_text.strip():
        src_id = f"text-{uuid.uuid4().hex[:8]}"
        res = extract_from_manual_text(manual_text.strip(), src_id)
        extracted_sources.append(res)

    if not extracted_sources:
        raise HTTPException(
            status_code=400,
            detail="No valid sources were submitted. Please provide at least one URL, PDF document, or text excerpt."
        )

    # Run AI analysis
    try:
        raw_result = await analyze_sources_with_gemini(
            topic=topic,
            question=question,
            sources=extracted_sources
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Analysis failure: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to execute analysis: {str(e)}")

    return format_analysis_response(topic, question, extracted_sources, raw_result)

def calculate_readiness_score(
    claims_count: int,
    conflicts: List[Contradiction],
    gaps: List[InformationGap],
    failed_sources_count: int
) -> DecisionReadiness:
    """Compute transparent decision readiness score (0-100)."""
    score = 100
    crit_gaps = len([g for g in gaps if g.importance == "critical"])
    mod_gaps = len([g for g in gaps if g.importance == "moderate"])
    high_conflicts = len([c for c in conflicts if c.severity == "high"])
    med_conflicts = len([c for c in conflicts if c.severity == "medium"])

    # Deductions
    score -= (crit_gaps * 15)
    score -= (mod_gaps * 8)
    score -= (high_conflicts * 12)
    score -= (med_conflicts * 6)
    score -= (failed_sources_count * 10)

    # Grounding bonus
    score += min(claims_count * 2, 16)

    # Clamp bounds: minimum 15, maximum 96 (never 100% without primary confirmation)
    final_score = max(15, min(96, score))

    if final_score >= 80:
        level = "High"
    elif final_score >= 50:
        level = "Moderate"
    else:
        level = "Preliminary / Incomplete"

    explanation = (
        f"Score calculated from {claims_count} grounded claim(s), deducting for {crit_gaps} critical gap(s), "
        f"{high_conflicts} high-severity conflict(s), and {failed_sources_count} extraction failure(s). "
        f"Completing items on the verification checklist will elevate decision certainty."
    )

    return DecisionReadiness(
        score=final_score,
        level=level,
        available_info_count=claims_count,
        missing_info_count=len(gaps),
        unresolved_conflicts_count=len(conflicts),
        completed_verifications_count=0,
        explanation=explanation
    )

def format_analysis_response(
    topic: str,
    question: Optional[str],
    sources: List[ExtractedSource],
    raw_result: dict
) -> AnalysisResponse:
    """Format, enrich with provenance links, and validate the final response object."""
    # Build URL lookup map for evidence traceability
    url_map = {s.source_id: s.url_or_filename for s in sources}

    # Format claims with direct source URL linking
    claims: List[ExtractedClaim] = []
    for c in raw_result.get("claims", []):
        s_id = c.get("source_id", "")
        claims.append(ExtractedClaim(
            claim_id=c.get("claim_id", f"c-{uuid.uuid4().hex[:6]}"),
            claim_text=c.get("claim_text", ""),
            topic=c.get("topic", "General"),
            source_id=s_id,
            source_title=c.get("source_title", "Source"),
            source_url=url_map.get(s_id),
            evidence_excerpt=c.get("evidence_excerpt", ""),
            publication_date=c.get("publication_date"),
            confidence=float(c.get("confidence", 0.9))
        ))

    # Format conflicts with source references
    conflicts: List[Contradiction] = []
    for c in raw_result.get("conflicts", []):
        src_a_raw = c.get("source_a", {})
        src_b_raw = c.get("source_b", {})
        s_a_id = src_a_raw.get("source_id", "")
        s_b_id = src_b_raw.get("source_id", "")

        conflicts.append(Contradiction(
            conflict_id=c.get("conflict_id", f"conf-{uuid.uuid4().hex[:6]}"),
            topic=c.get("topic", "Stipulation Discrepancy"),
            severity=c.get("severity", "medium"),
            source_a=ConflictSourceRef(
                claim_text=src_a_raw.get("claim_text", ""),
                source_id=s_a_id,
                source_title=src_a_raw.get("source_title", "Source A"),
                source_url=url_map.get(s_a_id),
                evidence_excerpt=src_a_raw.get("evidence_excerpt", ""),
                publication_date=src_a_raw.get("publication_date")
            ),
            source_b=ConflictSourceRef(
                claim_text=src_b_raw.get("claim_text", ""),
                source_id=s_b_id,
                source_title=src_b_raw.get("source_title", "Source B"),
                source_url=url_map.get(s_b_id),
                evidence_excerpt=src_b_raw.get("evidence_excerpt", ""),
                publication_date=src_b_raw.get("publication_date")
            ),
            conflict_reason=c.get("conflict_reason", ""),
            resolution_hint=c.get("resolution_hint", ""),
            can_resolve_by_date=c.get("can_resolve_by_date", False),
            can_resolve_by_authority=c.get("can_resolve_by_authority", False),
            confidence_level=c.get("confidence_level", "High uncertainty between disparate sources")
        ))

    # Format information gaps
    gaps: List[InformationGap] = []
    for g in raw_result.get("gaps", []):
        gaps.append(InformationGap(
            gap_id=g.get("gap_id", f"gap-{uuid.uuid4().hex[:6]}"),
            title=g.get("title", "Missing Criterion"),
            category=g.get("category", "other"),
            unanswered_question=g.get("unanswered_question", ""),
            importance=g.get("importance", "moderate"),
            why_it_matters=g.get("why_it_matters", ""),
            suggested_verification=g.get("suggested_verification", ""),
            flag_reason=g.get("flag_reason", "Requirement unaddressed in reviewed sources")
        ))

    # Format outdated warnings
    outdated: List[OutdatedDetail] = []
    for o in raw_result.get("outdated_warnings", []):
        s_id = o.get("source_id", "")
        outdated.append(OutdatedDetail(
            detail_id=o.get("detail_id", f"out-{uuid.uuid4().hex[:6]}"),
            source_id=s_id,
            source_title=o.get("source_title", "Source"),
            source_url=url_map.get(s_id),
            dated_reference=o.get("dated_reference", ""),
            potential_concern=o.get("potential_concern", ""),
            recommendation=o.get("recommendation", "")
        ))

    # Identify undated sources (Module 5 requirement)
    undated_sources: List[UndatedSourceWarning] = []
    for s in sources:
        if s.status == "success" and (not s.publication_date or s.publication_date.lower() in ["unknown", "undated", "none"]):
            undated_sources.append(UndatedSourceWarning(
                warning_id=f"undated-{s.source_id}",
                source_id=s.source_id,
                source_title=s.title,
                url_or_filename=s.url_or_filename,
                message=f"'{s.title}' contains no explicit publication timestamp. Do not assume outdated; verify current policy validity."
            ))

    # Separate extraction failures (Module 4 requirement)
    successful_sources = [s for s in sources if s.status == "success"]
    failed_sources = [s for s in sources if s.status == "failed"]

    # Format checklist items
    checklist: List[VerificationChecklistItem] = []
    for item in raw_result.get("checklist", []):
        supp_sources = item.get("supporting_sources", [])
        if not supp_sources:
            # Fallback to source titles
            supp_sources = [s.title for s in successful_sources[:2]]

        checklist.append(VerificationChecklistItem(
            item_id=item.get("item_id", f"chk-{uuid.uuid4().hex[:6]}"),
            action_required=item.get("action_required", ""),
            why_it_matters=item.get("why_it_matters", item.get("rationale", "")),
            recommended_authority=item.get("recommended_authority", "Primary Authority"),
            priority=item.get("priority", "medium"),
            rationale=item.get("rationale", ""),
            supporting_sources=supp_sources,
            completed=bool(item.get("completed", False))
        ))

    # Calculate Decision Readiness Score (Module 7 requirement)
    readiness = calculate_readiness_score(len(claims), conflicts, gaps, len(failed_sources))

    metrics = AnalysisMetrics(
        sources_analysed=len(successful_sources),
        claims_extracted=len(claims),
        potential_conflicts=len(conflicts),
        information_gaps=len(gaps),
        verification_actions=len(checklist),
        readiness_score=readiness.score,
        readiness_level=readiness.level
    )

    return AnalysisResponse(
        session_id=f"sess-{uuid.uuid4().hex[:10]}",
        topic=topic,
        question=question,
        metrics=metrics,
        decision_readiness=readiness,
        sources=sources,
        extraction_failures=failed_sources,
        claims=claims,
        conflicts=conflicts,
        gaps=gaps,
        outdated_warnings=outdated,
        undated_sources=undated_sources,
        checklist=checklist,
        synthesis_summary=raw_result.get("synthesis_summary", "Synthesis complete.")
    )
