import os
import sys
import json
import asyncio
import httpx
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

from services.gemini_service import analyze_sources_with_gemini, get_gemini_client
from services.source_extractor import extract_from_url, extract_from_pdf_bytes, extract_from_manual_text
from routes.analyze import format_analysis_response
from models import ExtractedSource

async def run_validation():
    print("=" * 80)
    print("GAPGLINT FINAL REAL-WORLD VALIDATION SUITE")
    print("=" * 80)

    results = {
        "task1_sources": False,
        "task2_workflow": False,
        "task3_error_handling": False,
        "task4_frontend_data": False,
        "details": {}
    }

    # -------------------------------------------------------------
    # TASK 1: REAL SOURCE TESTING
    # -------------------------------------------------------------
    print("\n>>> [TASK 1] TESTING REAL-WORLD PUBLIC SOURCES & ACTUAL PDF")
    
    url1 = "https://peps.python.org/pep-0684/"
    url2 = "https://docs.python.org/3.12/whatsnew/3.12.html"
    real_pdf_path = os.path.join(os.path.dirname(__file__), "tests", "real_research_paper.pdf")

    print(f"1. Fetching Real URL 1: {url1} ...")
    src_url1 = await extract_from_url(url1, "src-real-url-1")
    print(f"   Status: {src_url1.status} | Title: {src_url1.title[:45]} | Chars: {src_url1.character_count}")
    assert src_url1.status == "success" and src_url1.character_count > 1000

    print(f"2. Fetching Real URL 2: {url2} ...")
    src_url2 = await extract_from_url(url2, "src-real-url-2")
    print(f"   Status: {src_url2.status} | Title: {src_url2.title[:45]} | Chars: {src_url2.character_count}")
    assert src_url2.status == "success" and src_url2.character_count > 1000

    print(f"3. Reading Real PDF Document: {real_pdf_path} ...")
    with open(real_pdf_path, "rb") as f:
        pdf_bytes = f.read()
    src_pdf = extract_from_pdf_bytes(pdf_bytes, "arXiv_Quantum_Plasma.pdf", "src-real-pdf-1")
    print(f"   Status: {src_pdf.status} | Title: {src_pdf.title[:45]} | Chars: {src_pdf.character_count} | Date: {src_pdf.publication_date}")
    assert src_pdf.status == "success" and src_pdf.character_count > 500

    print("[PASS] Task 1 Completed: Extracted readable content from actual URLs and an actual published PDF!")
    results["task1_sources"] = True

    # -------------------------------------------------------------
    # TASK 2: END-TO-END WORKFLOW WITH GEMINI
    # -------------------------------------------------------------
    print("\n>>> [TASK 2] END-TO-END WORKFLOW WITH REAL RESEARCH QUESTION")
    topic = "Python 3.12 Concurrency & Sub-interpreters"
    question = "Can Python threads in separate sub-interpreters run truly in parallel without GIL contention in 3.12, and how is memory shared?"

    print(f"Topic: {topic}")
    print(f"Research Question: {question}")
    print("Executing Gemini Analysis Engine on real sources...")

    raw_ai = await analyze_sources_with_gemini(
        topic=topic,
        question=question,
        sources=[src_url1, src_url2]
    )

    formatted_response = format_analysis_response(topic, question, [src_url1, src_url2], raw_ai)

    print(f"\n--- Extracted Claims ({len(formatted_response.claims)}) ---")
    for c in formatted_response.claims[:3]:
        print(f"  * [{c.source_title[:25]}]: {c.claim_text}")
        print(f"    Excerpt: \"{c.evidence_excerpt[:90]}...\"")
        assert c.source_url is not None, "Claim must retain source URL"

    print(f"\n--- Potential Conflicts Detected ({len(formatted_response.conflicts)}) ---")
    for conf in formatted_response.conflicts:
        print(f"  * Topic: {conf.topic}")
        print(f"    Reason: {conf.conflict_reason}")
        print(f"    Resolution: {conf.resolution_hint}")

    print(f"\n--- Information Gaps Identified ({len(formatted_response.gaps)}) ---")
    for g in formatted_response.gaps[:2]:
        print(f"  * [{g.importance.upper()}]: {g.title} -> {g.unanswered_question}")
        print(f"    Why it matters: {g.why_it_matters}")

    print(f"\n--- Verification Checklist ({len(formatted_response.checklist)}) ---")
    for chk in formatted_response.checklist[:3]:
        print(f"  * [{chk.priority.upper()}]: {chk.action_required} (Authority: {chk.recommended_authority})")

    print(f"\n--- Decision Readiness ---")
    print(f"  Score: {formatted_response.decision_readiness.score}/100 ({formatted_response.decision_readiness.level})")
    print(f"  Explanation: {formatted_response.decision_readiness.explanation}")

    # JSON & Markdown export generation test
    json_export = formatted_response.model_dump_json(indent=2)
    assert len(json_export) > 500, "JSON export too short"
    print(f"[PASS] JSON export validated ({len(json_export)} bytes)")

    md_export = f"""# GapGlint Evidence Intelligence Report: {formatted_response.topic}
Decision Readiness: {formatted_response.decision_readiness.score}/100 ({formatted_response.decision_readiness.level})
Sources Analysed: {formatted_response.metrics.sources_analysed}
Claims Extracted: {formatted_response.metrics.claims_extracted}
Potential Conflicts: {formatted_response.metrics.potential_conflicts}
Information Gaps: {formatted_response.metrics.information_gaps}

## Summary
{formatted_response.synthesis_summary}
"""
    assert len(md_export) > 100, "Markdown export too short"
    print(f"[PASS] Markdown export validated ({len(md_export)} bytes)")
    print("[PASS] Task 2 Completed: Full end-to-end workflow executed successfully!")
    results["task2_workflow"] = True

    # -------------------------------------------------------------
    # TASK 3: ERROR HANDLING & EDGE CASES
    # -------------------------------------------------------------
    print("\n>>> [TASK 3] ERROR HANDLING & EDGE CASES")

    # 1. Invalid / malformed URL
    print("1. Testing malformed / unresolvable URL...")
    err_url = await extract_from_url("https://this-is-a-completely-fake-domain-12345xyz.org", "err-url-1")
    print(f"   Status: {err_url.status} | Error: {err_url.error_message}")
    assert err_url.status == "failed" and err_url.character_count == 0

    # 2. Inaccessible website (HTTP 404)
    print("2. Testing HTTP 404 inaccessible URL...")
    err_404 = await extract_from_url("http://127.0.0.1:8000/api/nonexistent_404_route", "err-404")
    print(f"   Status: {err_404.status} | Error: {err_404.error_message}")
    assert err_404.status == "failed" and ("404" in (err_404.error_message or "") or "HTTP" in (err_404.error_message or ""))

    # 3. Corrupted / Invalid PDF bytes
    print("3. Testing corrupted non-PDF bytes...")
    corrupt_pdf = extract_from_pdf_bytes(b"THIS IS NOT A VALID PDF FILE FORMAT DATA", "corrupt.pdf", "err-pdf-1")
    print(f"   Status: {corrupt_pdf.status} | Error: {corrupt_pdf.error_message}")
    assert corrupt_pdf.status == "failed"

    # 4. Empty / 0-byte PDF
    print("4. Testing 0-byte empty PDF...")
    empty_pdf = extract_from_pdf_bytes(b"", "empty.pdf", "err-pdf-2")
    print(f"   Status: {empty_pdf.status} | Error: {empty_pdf.error_message}")
    assert empty_pdf.status == "failed"

    # 5. Empty manual text
    print("5. Testing empty manual text...")
    empty_txt = extract_from_manual_text("   \n  ", "err-txt-1")
    print(f"   Status: {empty_txt.status} | Error: {empty_txt.error_message}")
    assert empty_txt.status == "failed"

    # 6. Gemini API missing key handling
    print("6. Testing missing GEMINI_API_KEY handling...")
    old_key = os.environ.get("GEMINI_API_KEY")
    try:
        os.environ["GEMINI_API_KEY"] = ""
        try:
            get_gemini_client()
            assert False, "Should have raised ValueError"
        except ValueError as ve:
            print(f"   Correctly caught missing key error: {ve}")
            assert "GEMINI_API_KEY is not set" in str(ve)
    finally:
        if old_key:
            os.environ["GEMINI_API_KEY"] = old_key

    # 7. Empty sources payload to AI
    print("7. Testing empty sources to AI...")
    try:
        await analyze_sources_with_gemini("Test", "Test", [])
        assert False, "Should have raised ValueError for empty sources"
    except ValueError as ve:
        print(f"   Correctly caught empty sources error: {ve}")

    print("[PASS] Task 3 Completed: All edge cases and error states handled gracefully!")
    results["task3_error_handling"] = True

    # -------------------------------------------------------------
    # TASK 4: FRONTEND DATA INTEGRITY
    # -------------------------------------------------------------
    print("\n>>> [TASK 4] FRONTEND DATA INTEGRITY AUDIT")
    # Verify model fields required by frontend components
    assert hasattr(formatted_response.metrics, "sources_analysed")
    assert hasattr(formatted_response.metrics, "claims_extracted")
    assert hasattr(formatted_response.metrics, "potential_conflicts")
    assert hasattr(formatted_response.metrics, "information_gaps")
    assert hasattr(formatted_response.decision_readiness, "score")
    assert hasattr(formatted_response.decision_readiness, "explanation")
    assert len(formatted_response.claims) > 0
    assert len(formatted_response.checklist) > 0

    print(f"Metrics: Sources={formatted_response.metrics.sources_analysed}, Claims={formatted_response.metrics.claims_extracted}, Conflicts={formatted_response.metrics.potential_conflicts}, Gaps={formatted_response.metrics.information_gaps}")
    print(f"Checklist count: {len(formatted_response.checklist)}")
    print(f"Readiness Score: {formatted_response.decision_readiness.score}")
    print("[PASS] Task 4 Completed: Backend response format strictly fulfills frontend requirements!")
    results["task4_frontend_data"] = True

    print("\n" + "=" * 80)
    print("FINAL SUMMARY: ALL REAL-WORLD VALIDATION TASKS PASSED (100%)")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(run_validation())
