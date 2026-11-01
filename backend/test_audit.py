import sys
import os
import asyncio

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

from services.gemini_service import get_gemini_client, analyze_sources_with_gemini
from services.source_extractor import extract_from_url, extract_from_pdf_bytes, extract_from_manual_text
from models import ExtractedSource
import fitz

async def main():
    print("--- 1. TESTING GEMINI API CLIENT ---")
    try:
        client = get_gemini_client()
        print("Gemini client initialized successfully.")
        model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
        print(f"Testing Gemini model: {model}")
        res = client.models.generate_content(
            model=model,
            contents="Say 'GapGlint Online' and nothing else."
        )
        print("Gemini Response:", res.text.strip())
        assert "GapGlint" in res.text, "Gemini did not return expected response"
        print("[PASS] Gemini API genuinely integrated and working!\n")
    except Exception as e:
        print("[FAIL] Gemini API error:", e, "\n")

    print("--- 2. TESTING URL EXTRACTION ---")
    try:
        sample_url = "https://example.com"
        src_url = await extract_from_url(sample_url, "test-url-1")
        print(f"URL: {src_url.url_or_filename}")
        print(f"Title: {src_url.title}")
        print(f"Status: {src_url.status}")
        print(f"Extracted characters: {src_url.character_count}")
        print(f"Text preview: {src_url.extracted_text[:100]}...")
        assert src_url.status == "success" and src_url.character_count > 0
        print("[PASS] URL Extraction works on real website URLs!\n")
    except Exception as e:
        print("[FAIL] URL extraction error:", e, "\n")

    print("--- 3. TESTING PDF TEXT EXTRACTION (PyMuPDF) ---")
    try:
        # Create an in-memory sample PDF using PyMuPDF
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((50, 72), "GapGlint Scholarship Guidelines 2026\nEligibility: Minimum 80% aggregate.\nDeadline: November 15, 2026.\nDocument Required: Income Certificate.")
        pdf_bytes = doc.tobytes()
        doc.close()

        src_pdf = extract_from_pdf_bytes(pdf_bytes, "Scholarship_Guidelines_2026.pdf", "test-pdf-1")
        print(f"PDF Title: {src_pdf.title}")
        print(f"Status: {src_pdf.status}")
        print(f"Extracted text: {src_pdf.extracted_text}")
        assert src_pdf.status == "success" and "80%" in src_pdf.extracted_text
        print("[PASS] PDF text extraction works with PyMuPDF!\n")
    except Exception as e:
        print("[FAIL] PDF extraction error:", e, "\n")

    print("--- 4, 5, 6, 7, 8, 10. TESTING END-TO-END GEMINI EVIDENCE ANALYSIS ---")
    try:
        # Source A: Official Portal 2026
        src1 = ExtractedSource(
            source_id="src-001",
            type="pdf",
            title="National Fellowship 2026 Official Handbook",
            url_or_filename="https://fellowships.gov/handbook-2026.pdf",
            extracted_text="National Fellowship Scheme 2026. Published on January 10, 2026. Minimum eligibility is 80% in undergraduate studies. The annual stipend is $25,000. Application deadline is October 31, 2026.",
            publication_date="2026-01-10",
            status="success",
            character_count=200
        )

        # Source B: Third-Party Guide (Contradictory and Outdated 2022 info)
        src2 = ExtractedSource(
            source_id="src-002",
            type="url",
            title="EduPortal Scholarship Summary 2022",
            url_or_filename="https://eduportal.org/fellowship-review",
            extracted_text="EduPortal Guide. Revised June 2022. Minimum eligibility is 75% for applicants. Annual grant amount is $20,000. All submissions close September 15, 2022.",
            publication_date="2022-06-15",
            status="success",
            character_count=180
        )

        # Source C: Failed source
        src3 = ExtractedSource(
            source_id="src-003",
            type="url",
            title="Scholarship Renewal Terms Portal",
            url_or_filename="https://fellowships.gov/renewals-hidden",
            extracted_text="",
            status="failed",
            error_message="HTTP 404: Not Found",
            character_count=0
        )

        test_topic = "National Fellowship Scheme Requirements"
        test_question = "What is the exact eligibility percentage, and what are the renewal conditions for year two?"

        print("Calling analyze_sources_with_gemini with real conflicting and incomplete sources...")
        analysis = await analyze_sources_with_gemini(
            topic=test_topic,
            question=test_question,
            sources=[src1, src2, src3]
        )

        print("\n--- CLAIMS EXTRACTED ---")
        claims = analysis.get("claims", [])
        print(f"Total claims: {len(claims)}")
        for c in claims[:3]:
            print(f"- [{c.get('source_title')}]: {c.get('claim_text')} (Excerpt: '{c.get('evidence_excerpt')}')")
        assert len(claims) > 0, "No claims extracted"

        print("\n--- CONFLICTS DETECTED ---")
        conflicts = analysis.get("conflicts", [])
        print(f"Total conflicts: {len(conflicts)}")
        for conf in conflicts:
            print(f"- Topic: {conf.get('topic')}")
            print(f"  Source A: {conf.get('source_a', {}).get('claim_text')}")
            print(f"  Source B: {conf.get('source_b', {}).get('claim_text')}")
            print(f"  Reason: {conf.get('conflict_reason')}")
            print(f"  Resolution Hint: {conf.get('resolution_hint')}")
            print(f"  Can resolve by date: {conf.get('can_resolve_by_date')}")
        assert len(conflicts) > 0, "Contradiction was not detected"

        print("\n--- INFORMATION GAPS DETECTED ---")
        gaps = analysis.get("gaps", [])
        print(f"Total gaps: {len(gaps)}")
        for g in gaps:
            print(f"- [{g.get('importance')}]: {g.get('title')} -> {g.get('unanswered_question')}")
            print(f"  Why it matters: {g.get('why_it_matters')}")
        assert len(gaps) > 0, "Information gaps not detected"

        print("\n--- OUTDATED WARNINGS ---")
        outdated = analysis.get("outdated_warnings", [])
        print(f"Total outdated warnings: {len(outdated)}")
        for o in outdated:
            print(f"- Source: {o.get('source_title')} | Reference: {o.get('dated_reference')}")
            print(f"  Concern: {o.get('potential_concern')}")
        assert len(outdated) > 0, "Outdated 2022 info was not flagged"

        print("\n--- VERIFICATION CHECKLIST ---")
        checklist = analysis.get("checklist", [])
        print(f"Total checklist items: {len(checklist)}")
        for chk in checklist:
            print(f"- [{chk.get('priority')}]: {chk.get('action_required')} (Authority: {chk.get('recommended_authority')})")
        assert len(checklist) > 0, "Checklist was not generated"

        print("\n[PASS] AI Evidence Pipeline successfully verified!")

    except Exception as e:
        print("[FAIL] AI Analysis Pipeline error:", e)

if __name__ == "__main__":
    asyncio.run(main())

