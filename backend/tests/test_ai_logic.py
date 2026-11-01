import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from models import (
    ExtractedClaim,
    Contradiction,
    ConflictSourceRef,
    InformationGap,
    OutdatedDetail,
    VerificationChecklistItem,
    AnalysisResponse,
    ExtractedSource
)
from routes.analyze import format_analysis_response

class TestAILogicAndValidation(unittest.TestCase):

    def test_claim_validation(self):
        """Test claim structure with mandatory evidence excerpt and source ID."""
        claim = ExtractedClaim(
            claim_id="c-01",
            claim_text="Applicants must have a minimum aggregate GPA of 3.5.",
            topic="Eligibility Criteria",
            source_id="src-01",
            source_title="Official Fellowship Guidelines 2025",
            evidence_excerpt="Candidates are required to have achieved at least a 3.5 GPA upon graduation.",
            publication_date="2024-11-01",
            confidence=0.95
        )
        self.assertEqual(claim.source_id, "src-01")
        self.assertIn("3.5", claim.claim_text)
        print("[PASS] Claim Validation Passed")

    def test_contradiction_validation(self):
        """Test contradiction structure comparing two conflicting claims without false-labeling."""
        conflict = Contradiction(
            conflict_id="conf-01",
            topic="Minimum Eligibility Percentage",
            severity="high",
            source_a=ConflictSourceRef(
                claim_text="Minimum eligibility is 75%.",
                source_id="src-01",
                source_title="Department Official Notice",
                evidence_excerpt="Aggregate undergraduate marks must be 75% or above.",
                publication_date="2024-09-10"
            ),
            source_b=ConflictSourceRef(
                claim_text="Minimum eligibility is 80%.",
                source_id="src-02",
                source_title="Admissions Brochure 2023",
                evidence_excerpt="Eligibility threshold stands at 80% marks.",
                publication_date="2023-01-15"
            ),
            conflict_reason="Direct discrepancy in minimum required academic threshold (75% vs 80%).",
            resolution_hint="Source A is more recent (September 2024 vs January 2023) and is an official departmental update.",
            can_resolve_by_date=True,
            can_resolve_by_authority=True
        )
        self.assertEqual(conflict.severity, "high")
        self.assertTrue(conflict.can_resolve_by_date)
        self.assertIn("75%", conflict.source_a.claim_text)
        self.assertIn("80%", conflict.source_b.claim_text)
        print("[PASS] Contradiction Detection Schema Validation Passed")

    def test_information_gap_validation(self):
        """Test information gap model verifying unanswered questions and importance."""
        gap = InformationGap(
            gap_id="gap-01",
            title="Renewal Conditions & Academic Standing",
            category="prerequisites",
            unanswered_question="What are the annual renewal conditions and credit thresholds for continuing the scholarship?",
            importance="critical",
            why_it_matters="If renewal requires an unachievable benchmark, students risk losing tuition coverage midway through degree.",
            suggested_verification="Consult the scholarship administrative office for the formal continuing eligibility policy."
        )
        self.assertEqual(gap.importance, "critical")
        self.assertEqual(gap.category, "prerequisites")
        print("[PASS] Information Gap Schema Validation Passed")

    def test_format_analysis_response_pipeline(self):
        """Test pipeline assembling mock AI payload into full AnalysisResponse."""
        sources = [
            ExtractedSource(
                source_id="src-01",
                type="url",
                title="Scholarship Main Page",
                url_or_filename="https://example.org/scholarship",
                extracted_text="Minimum GPA 3.5. Application closes March 15.",
                publication_date="2024-10-01",
                status="success",
                character_count=50
            )
        ]

        raw_ai_fixture = {
            "claims": [
                {
                    "claim_id": "c-101",
                    "claim_text": "Application closes March 15.",
                    "topic": "Deadlines",
                    "source_id": "src-01",
                    "source_title": "Scholarship Main Page",
                    "evidence_excerpt": "Application closes March 15.",
                    "publication_date": "2024-10-01",
                    "confidence": 0.98
                }
            ],
            "conflicts": [],
            "gaps": [
                {
                    "gap_id": "gap-101",
                    "title": "Health Insurance Coverage",
                    "category": "fees",
                    "unanswered_question": "Is mandatory health insurance covered by the scholarship?",
                    "importance": "moderate",
                    "why_it_matters": "Uncovered medical insurance costs up to EUR 1,200 annually.",
                    "suggested_verification": "Verify medical coverage clauses on the official student portal."
                }
            ],
            "outdated_warnings": [],
            "checklist": [
                {
                    "item_id": "chk-101",
                    "action_required": "Verify submission portal URL before March 15 deadline.",
                    "recommended_authority": "Admissions Coordinator",
                    "priority": "high",
                    "rationale": "Avoid last-minute technical submission failures.",
                    "completed": False
                }
            ],
            "synthesis_summary": "Initial baseline verified. Core gap identified in health insurance coverage."
        }

        response = format_analysis_response(
            topic="Global Study Scholarship",
            question="What costs are covered?",
            sources=sources,
            raw_result=raw_ai_fixture
        )

        self.assertEqual(response.metrics.sources_analysed, 1)
        self.assertEqual(response.metrics.claims_extracted, 1)
        self.assertEqual(response.metrics.potential_conflicts, 0)
        self.assertEqual(response.metrics.information_gaps, 1)
        self.assertEqual(response.metrics.verification_actions, 1)
        self.assertEqual(len(response.claims), 1)
        self.assertEqual(len(response.gaps), 1)
        print("[PASS] Analysis Pipeline Response Assembly Passed")

if __name__ == "__main__":
    unittest.main()

