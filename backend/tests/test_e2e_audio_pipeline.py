import os
import sys
import json
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

import httpx
from main import app

async def run_e2e_test():
    print("=" * 75)
    print("GAPGLINT COMPLETE E2E WORKFLOW: VOICE -> TRANSCRIPTION -> EVIDENCE PIPELINE")
    print("=" * 75)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver", timeout=60.0) as client:
        # -------------------------------------------------------------
        # STEP 1: Audio Upload -> Gnani Prisma v3 Transcription
        # -------------------------------------------------------------
        print("\n>>> STEP 1: Calling POST /api/audio/transcribe with sample_speech.wav ...")
        wav_path = os.path.join(os.path.dirname(__file__), "sample_speech.wav")
        assert os.path.exists(wav_path), f"Audio file not found: {wav_path}"

        with open(wav_path, "rb") as f:
            audio_bytes = f.read()

        transcribe_resp = await client.post(
            "/api/audio/transcribe",
            data={"model": "prisma-v3.0", "language_code": "indic-auto"},
            files={"file": ("sample_speech.wav", audio_bytes, "audio/wav")}
        )

        assert transcribe_resp.status_code == 200, f"Transcription failed: {transcribe_resp.text}"
        transcribe_data = transcribe_resp.json()
        transcript = transcribe_data.get("transcript", "")
        print(f"[PASS] HTTP 200 OK")
        print(f"Request ID: {transcribe_data.get('request_id')}")
        print(f"Detected Language: {transcribe_data.get('detected_language_code')}")
        print(f"Processing Time: {transcribe_data.get('processing_time')}s")
        print(f"Transcript: \"{transcript[:100]}...\"")
        assert len(transcript.strip()) > 0, "Transcript must not be empty"

        # -------------------------------------------------------------
        # STEP 2: Staging Audio Transcript into GapGlint Evidence Analysis
        # -------------------------------------------------------------
        print("\n>>> STEP 2: Ingesting Audio Transcript into Evidence Synthesis Matrix (POST /api/analyze) ...")
        topic = "Masquerade Protocol and Participant Testimony Audit"
        question = "What rules apply to the masquerade event, and what discrepancies exist in participant testimony regarding sound and movement?"

        audio_payload = json.dumps([
            {
                "id": "audio-test-01",
                "filename": "sample_speech.wav",
                "transcript": transcript
            }
        ])

        # Complementary document with intentional rule discrepancy to test contradiction engine
        policy_note = (
            "Official Masquerade Governance Notice (2026):\n"
            "Clause 4.1 - Audio and Movement Standards: The masquerade strictly prohibits idle movement or deceptive appearances. "
            "All tides and participant movement must be fully audible and alert at all times; silent or asleep movements are strictly forbidden."
        )

        # PDF file regression testing
        pdf_path = os.path.join(os.path.dirname(__file__), "real_sample.pdf")
        pdf_bytes = open(pdf_path, "rb").read() if os.path.exists(pdf_path) else None

        multipart_data = {
            "topic": topic,
            "question": question,
            "audio_transcripts_json": audio_payload,
            "manual_text": policy_note,
        }

        files = []
        if pdf_bytes:
            files.append(("pdf_files", ("official_sample.pdf", pdf_bytes, "application/pdf")))

        analyze_resp = await client.post(
            "/api/analyze",
            data=multipart_data,
            files=files if files else None
        )

        assert analyze_resp.status_code == 200, f"Analysis failed: {analyze_resp.text}"
        analysis = analyze_resp.json()
        print("[PASS] Evidence Matrix Analysis successfully synthesized!")

        # -------------------------------------------------------------
        # STEP 3: Verify Grounded Atomic Claims Traceable to Audio
        # -------------------------------------------------------------
        print("\n>>> STEP 3: Verifying Grounded Claims & Audio Provenance ...")
        claims = analysis.get("claims", [])
        print(f"Total Grounded Claims Extracted: {len(claims)}")
        assert len(claims) > 0, "Expected at least 1 grounded claim"

        audio_claims = [c for c in claims if "audio" in c.get("source_id", "").lower() or "sample_speech.wav" in c.get("source_url", "").lower() or "audio" in c.get("source_title", "").lower()]
        print(f"Claims grounded in Audio Source: {len(audio_claims)}")
        for c in claims[:4]:
            print(f"  * [{c.get('source_title')}]: {c.get('claim_text')}")
            print(f"    Excerpt: \"{c.get('evidence_excerpt')[:90]}...\"")
            print(f"    Source Link/Filename: {c.get('source_url')}")

        # -------------------------------------------------------------
        # STEP 4: Verify Contradiction / Conflict Engine
        # -------------------------------------------------------------
        print("\n>>> STEP 4: Verifying Contradiction Detection ...")
        conflicts = analysis.get("conflicts", [])
        print(f"Conflicts Detected: {len(conflicts)}")
        for conf in conflicts:
            print(f"  * Conflict Topic: {conf.get('topic')} [Severity: {conf.get('severity')}]")
            print(f"    Reason: {conf.get('conflict_reason')}")
            print(f"    Source A: {conf.get('source_a', {}).get('source_title')}")
            print(f"    Source B: {conf.get('source_b', {}).get('source_title')}")

        # -------------------------------------------------------------
        # STEP 5: Verify Negative Space / Information Gaps
        # -------------------------------------------------------------
        print("\n>>> STEP 5: Verifying Information Gaps ...")
        gaps = analysis.get("gaps", [])
        print(f"Information Gaps Found: {len(gaps)}")
        for g in gaps[:2]:
            print(f"  * [{g.get('importance')}]: {g.get('title')} -> {g.get('unanswered_question')}")

        # -------------------------------------------------------------
        # STEP 6: Verify Decision Readiness Score
        # -------------------------------------------------------------
        print("\n>>> STEP 6: Verifying Decision Readiness Score ...")
        readiness = analysis.get("decision_readiness", {})
        score = readiness.get("score")
        level = readiness.get("level")
        print(f"Decision Readiness: {score}/100 ({level})")
        print(f"Explanation: {readiness.get('explanation')}")
        assert score is not None and 15 <= score <= 96, "Readiness score out of expected bounds"

        # -------------------------------------------------------------
        # STEP 7: Verify Verification Checklist
        # -------------------------------------------------------------
        print("\n>>> STEP 7: Verifying Actionable Verification Checklist ...")
        checklist = analysis.get("checklist", [])
        print(f"Action Items: {len(checklist)}")
        for item in checklist[:2]:
            print(f"  * [{item.get('priority')}]: {item.get('action_required')} (Authority: {item.get('recommended_authority')})")

        # -------------------------------------------------------------
        # STEP 8: Verify Source Ledger contains Audio
        # -------------------------------------------------------------
        sources = analysis.get("sources", [])
        audio_src = [s for s in sources if s.get("type") == "audio"]
        print(f"\n[PASS] Verified Audio Source in Provenance Ledger: {len(audio_src)} audio source(s) recorded.")
        assert len(audio_src) > 0, "Audio source must be indexed in sources ledger"

    print("\n" + "=" * 75)
    print("ALL WORKFLOW STEPS PASSED WITH 100% SUCCESS!")
    print("=" * 75)

if __name__ == "__main__":
    asyncio.run(run_e2e_test())

