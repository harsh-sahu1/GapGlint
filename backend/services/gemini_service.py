import os
import json
import logging
from typing import List, Optional, Dict, Any
from google import genai
from google.genai import types
from models import (
    ExtractedSource,
    ExtractedClaim,
    Contradiction,
    ConflictSourceRef,
    InformationGap,
    OutdatedDetail,
    VerificationChecklistItem,
    AnalysisMetrics,
    AnalysisResponse
)

logger = logging.getLogger("gapglint.gemini")

def get_gemini_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not api_key.strip():
        raise ValueError(
            "GEMINI_API_KEY is not set. Please set the GEMINI_API_KEY environment variable in your backend environment or .env file."
        )
    return genai.Client(api_key=api_key.strip())

SYSTEM_PROMPT = """You are GapGlint's Evidence Intelligence Engine.
Your core mission is to analyze multiple sources on a given topic, extract atomic verifiable claims, detect contradictions, identify what information is critically missing (negative space / gaps), flag potentially outdated details based strictly on explicit dates, and generate an actionable verification checklist.

CRITICAL RULES:
1. STRICT GROUNDING: Never fabricate claims, evidence excerpts, publication dates, or URLs. Every claim excerpt MUST be a verbatim or accurate reflection from the provided text.
2. CONTRADICTION FAIRNESS: When two sources present conflicting numbers, criteria, or deadlines, NEVER declare one as definitively false. Contrast both with their respective source titles and excerpts, and explain whether date or authority can guide resolution.
3. INFORMATION GAPS: Identify what is NOT found in the provided sources that a user must know to make an informed decision (e.g., hidden fees, renewal terms, required documents, official deadlines).
4. OUTDATED DATA: Never assume an undated source is outdated. Only flag outdated details when explicit dates or past cycle references (e.g. 2021/2022 when user asks for 2025/2026) are present.
5. SEPARATION: Clearly distinguish sourced factual statements from AI-generated verification suggestions.
"""

ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "claims": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "claim_id": {"type": "string"},
                    "claim_text": {"type": "string"},
                    "topic": {"type": "string"},
                    "source_id": {"type": "string"},
                    "source_title": {"type": "string"},
                    "evidence_excerpt": {"type": "string"},
                    "publication_date": {"type": "string", "nullable": True},
                    "confidence": {"type": "number"}
                },
                "required": ["claim_id", "claim_text", "topic", "source_id", "source_title", "evidence_excerpt"]
            }
        },
        "conflicts": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "conflict_id": {"type": "string"},
                    "topic": {"type": "string"},
                    "severity": {"type": "string", "enum": ["high", "medium", "low"]},
                    "source_a": {
                        "type": "object",
                        "properties": {
                            "claim_text": {"type": "string"},
                            "source_id": {"type": "string"},
                            "source_title": {"type": "string"},
                            "evidence_excerpt": {"type": "string"},
                            "publication_date": {"type": "string", "nullable": True}
                        },
                        "required": ["claim_text", "source_id", "source_title", "evidence_excerpt"]
                    },
                    "source_b": {
                        "type": "object",
                        "properties": {
                            "claim_text": {"type": "string"},
                            "source_id": {"type": "string"},
                            "source_title": {"type": "string"},
                            "evidence_excerpt": {"type": "string"},
                            "publication_date": {"type": "string", "nullable": True}
                        },
                        "required": ["claim_text", "source_id", "source_title", "evidence_excerpt"]
                    },
                    "conflict_reason": {"type": "string"},
                    "resolution_hint": {"type": "string"},
                    "can_resolve_by_date": {"type": "boolean"},
                    "can_resolve_by_authority": {"type": "boolean"}
                },
                "required": ["conflict_id", "topic", "severity", "source_a", "source_b", "conflict_reason", "resolution_hint"]
            }
        },
        "gaps": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "gap_id": {"type": "string"},
                    "title": {"type": "string"},
                    "category": {"type": "string", "enum": ["timeline", "prerequisites", "official_policy", "fees", "documentation", "other"]},
                    "unanswered_question": {"type": "string"},
                    "importance": {"type": "string", "enum": ["critical", "moderate", "exploratory"]},
                    "why_it_matters": {"type": "string"},
                    "suggested_verification": {"type": "string"},
                    "flag_reason": {"type": "string"}
                },
                "required": ["gap_id", "title", "category", "unanswered_question", "importance", "why_it_matters", "suggested_verification"]
            }
        },
        "outdated_warnings": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "detail_id": {"type": "string"},
                    "source_id": {"type": "string"},
                    "source_title": {"type": "string"},
                    "dated_reference": {"type": "string"},
                    "potential_concern": {"type": "string"},
                    "recommendation": {"type": "string"}
                },
                "required": ["detail_id", "source_id", "source_title", "dated_reference", "potential_concern", "recommendation"]
            }
        },
        "checklist": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "item_id": {"type": "string"},
                    "action_required": {"type": "string"},
                    "why_it_matters": {"type": "string"},
                    "recommended_authority": {"type": "string"},
                    "priority": {"type": "string", "enum": ["high", "medium", "low"]},
                    "rationale": {"type": "string"},
                    "supporting_sources": {
                        "type": "array",
                        "items": {"type": "string"}
                    },
                    "completed": {"type": "boolean"}
                },
                "required": ["item_id", "action_required", "recommended_authority", "priority", "rationale"]
            }
        },
        "synthesis_summary": {"type": "string"}
    },
    "required": ["claims", "conflicts", "gaps", "outdated_warnings", "checklist", "synthesis_summary"]
}

async def analyze_sources_with_gemini(
    topic: str,
    question: Optional[str],
    sources: List[ExtractedSource]
) -> Dict[str, Any]:
    """Execute end-to-end evidence intelligence using Gemini API."""
    client = get_gemini_client()

    # Filter out completely failed sources but preserve their status for gap tracking
    successful_sources = [s for s in sources if s.status == "success" and s.extracted_text.strip()]
    failed_sources = [s for s in sources if s.status == "failed"]

    if not successful_sources and not failed_sources:
        raise ValueError("No valid sources provided for analysis.")

    # Construct input payload for prompt
    sources_payload = []
    for s in successful_sources:
        sources_payload.append({
            "source_id": s.source_id,
            "type": s.type,
            "title": s.title,
            "url_or_filename": s.url_or_filename,
            "publication_date": s.publication_date or "Unknown / Undated",
            "content": s.extracted_text[:12000] # preserve generous context per source
        })

    failed_info = []
    for f in failed_sources:
        failed_info.append({
            "source_id": f.source_id,
            "title": f.title,
            "error": f.error_message or "Extraction failed"
        })

    user_prompt = f"""RESEARCH INQUIRY:
Topic: {topic}
Specific Decision Question: {question or 'Identify critical criteria, hidden constraints, and discrepancies.'}

SOURCE DOCUMENTS PROVIDED ({len(successful_sources)} successful):
{json.dumps(sources_payload, indent=2)}

UNAVAILABLE / FAILED SOURCES ({len(failed_sources)}):
{json.dumps(failed_info, indent=2)}

TASK:
1. Extract 3 to 10 atomic, verifiable claims per source covering eligibility, requirements, deadlines, benefits, or exclusions.
2. Cross-reference claims across sources to detect ANY conflicting stipulations, differing numbers, or incompatible policies.
3. Analyze the user's research question to identify critical information GAPS (unanswered questions, missing renewal conditions, unmentioned fees).
4. If failed sources prevented answering parts of the question, clearly note that in the gaps analysis.
5. Identify any dated details that appear outdated relative to the active cycle.
6. Provide a prioritized, actionable verification checklist indicating which authority or portal the user must consult next.
7. Provide a concise executive synthesis summary.

Return strictly the specified JSON structure."""

    # Select model: gemini-3.5-flash-lite is fast, reliable and lowest-cost for high-throughput synthesis
    model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=ANALYSIS_SCHEMA,
                temperature=0.1
            )
        )

        response_text = response.text
        parsed = json.loads(response_text)
        return parsed

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response from Gemini: {e}")
        raise ValueError(f"AI returned invalid JSON: {str(e)}")
    except Exception as e:
        logger.error(f"Gemini API invocation error: {e}")
        # Sanitize error to avoid leaking credentials
        err_msg = str(e)
        if "API_KEY_INVALID" in err_msg or "401" in err_msg:
            raise ValueError("Invalid Gemini API Key. Please verify your GEMINI_API_KEY environment variable.")
        elif "RESOURCE_EXHAUSTED" in err_msg or "429" in err_msg:
            raise ValueError("Gemini API rate limit or quota exceeded. Please wait a moment and retry.")
        raise ValueError(f"AI Analysis failed: {err_msg}")

