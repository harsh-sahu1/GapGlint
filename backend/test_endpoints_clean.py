import os
import sys
import asyncio
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

from routes.analyze import format_analysis_response, calculate_readiness_score, AnalyzeJsonPayload, analyze_sources_json
from models import ExtractedSource, Contradiction, ConflictSourceRef, InformationGap

def test_readiness_and_traceability():
    print("--- TESTING READINESS SCORE & PROVENANCE MAPPING ---")
    
    src1 = ExtractedSource(
        source_id="src-001",
        type="pdf",
        title="Official Handbook 2026",
        url_or_filename="https://fellowships.gov/handbook-2026.pdf",
        extracted_text="Minimum eligibility is 80%.",
        publication_date="2026-01-10",
        status="success",
        character_count=200
    )
    src2 = ExtractedSource(
        source_id="src-002",
        type="url",
        title="EduPortal Guide",
        url_or_filename="https://eduportal.org/guide",
        extracted_text="Minimum eligibility is 75%.",
        publication_date="2022-06-15",
        status="success",
        character_count=180
    )

    mock_raw_ai = {
        "claims": [
            {
                "claim_id": "c-1",
                "claim_text": "Minimum eligibility is 80%.",
                "topic": "Eligibility",
                "source_id": "src-001",
                "source_title": "Official Handbook 2026",
                "evidence_excerpt": "Minimum eligibility is 80%.",
                "publication_date": "2026-01-10",
                "confidence": 0.95
            }
        ],
        "conflicts": [
            {
                "conflict_id": "conf-1",
                "topic": "Eligibility",
                "severity": "high",
                "source_a": {
                    "claim_text": "Minimum eligibility is 80%.",
                    "source_id": "src-001",
                    "source_title": "Official Handbook 2026",
                    "evidence_excerpt": "Minimum eligibility is 80%.",
                    "publication_date": "2026-01-10"
                },
                "source_b": {
                    "claim_text": "Minimum eligibility is 75%.",
                    "source_id": "src-002",
                    "source_title": "EduPortal Guide",
                    "evidence_excerpt": "Minimum eligibility is 75%.",
                    "publication_date": "2022-06-15"
                },
                "conflict_reason": "Incompatible eligibility thresholds",
                "resolution_hint": "Check 2026 date",
                "can_resolve_by_date": True,
                "can_resolve_by_authority": True
            }
        ],
        "gaps": [
            {
                "gap_id": "gap-1",
                "title": "Renewal Terms",
                "category": "prerequisites",
                "unanswered_question": "What is the renewal GPA?",
                "importance": "critical",
                "why_it_matters": "Determines funding continuation",
                "suggested_verification": "Contact program officer",
                "flag_reason": "Not stated in texts"
            }
        ],
        "outdated_warnings": [
            {
                "detail_id": "out-1",
                "source_id": "src-002",
                "source_title": "EduPortal Guide",
                "dated_reference": "2022-06-15",
                "potential_concern": "Old cycle",
                "recommendation": "Confirm current rules"
            }
        ],
        "checklist": [
            {
                "item_id": "chk-1",
                "action_required": "Confirm 2026 eligibility cutoff",
                "why_it_matters": "Prevents disqualified submission",
                "recommended_authority": "Fellowship Office",
                "priority": "high",
                "rationale": "Direct contradiction between 75% and 80%",
                "supporting_sources": ["Official Handbook 2026"],
                "completed": False
            }
        ],
        "synthesis_summary": "Analysis reveals a conflict on minimum criteria."
    }

    resp = format_analysis_response("Fellowships", "Eligibility details", [src1, src2], mock_raw_ai)

    # 1. Traceability: verify URL mapping in claim and conflict
    assert resp.claims[0].source_url == "https://fellowships.gov/handbook-2026.pdf"
    assert resp.conflicts[0].source_a.source_url == "https://fellowships.gov/handbook-2026.pdf"
    assert resp.conflicts[0].source_b.source_url == "https://eduportal.org/guide"
    assert resp.outdated_warnings[0].source_url == "https://eduportal.org/guide"
    print("[PASS] Full evidence provenance and URL linking confirmed!")

    # 2. Decision readiness score
    readiness = resp.decision_readiness
    print(f"Readiness Score: {readiness.score}/100, Level: {readiness.level}")
    print(f"Explanation: {readiness.explanation}")
    assert readiness.score > 0 and readiness.score <= 100
    print("[PASS] Decision readiness score accurately computed!")

    # 3. Metrics
    assert resp.metrics.sources_analysed == 2
    assert resp.metrics.claims_extracted == 1
    assert resp.metrics.potential_conflicts == 1
    assert resp.metrics.information_gaps == 1
    print("[PASS] Analysis metrics properly synthesized!")

if __name__ == "__main__":
    test_readiness_and_traceability()

