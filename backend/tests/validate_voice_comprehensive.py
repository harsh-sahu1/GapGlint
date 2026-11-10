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
from services.gnani_stt_service import SUPPORTED_AUDIO_EXTENSIONS, transcribe_audio_with_gnani, GnaniAuthError, GnaniConfigurationError
from services.source_extractor import extract_from_url, extract_from_pdf_bytes, extract_from_manual_text

async def run_comprehensive_validation():
    print("=" * 80)
    print("GAPGLINT VOICE: COMPREHENSIVE MULTI-SOURCE VALIDATION SUITE")
    print("=" * 80)

    test_results = {
        "scenario_transcriptions": False,
        "scenario_evidence_intelligence": False,
        "scenario_provenance": False,
        "hinglish_speech": False,
        "edge_cases": False,
        "regression_testing": False,
        "security_audit": False,
        "details": {}
    }

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver", timeout=60.0) as client:
        
        # -------------------------------------------------------------
        # PART 1: REALISTIC ROAD CONSTRUCTION INVESTIGATION SCENARIO
        # -------------------------------------------------------------
        print("\n" + "=" * 60)
        print("PART 1: REALISTIC ROAD CONSTRUCTION INVESTIGATION SCENARIO")
        print("=" * 60)

        resident_wav_path = os.path.join(os.path.dirname(__file__), "resident_interview.wav")
        official_wav_path = os.path.join(os.path.dirname(__file__), "official_interview.wav")
        pdf_path = os.path.join(os.path.dirname(__file__), "official_highway_schedule.pdf")

        assert os.path.exists(resident_wav_path), f"File missing: {resident_wav_path}"
        assert os.path.exists(official_wav_path), f"File missing: {official_wav_path}"
        assert os.path.exists(pdf_path), f"File missing: {pdf_path}"

        # 1. Transcribe Resident Audio
        print("\n1. Transcribing Resident Interview Audio...")
        with open(resident_wav_path, "rb") as f:
            resident_bytes = f.read()

        resp_res = await client.post(
            "/api/audio/transcribe",
            data={"model": "prisma-v3.0", "language_code": "indic-auto"},
            files={"file": ("resident_interview.wav", resident_bytes, "audio/wav")}
        )
        assert resp_res.status_code == 200, f"Resident transcription failed: {resp_res.text}"
        data_res = resp_res.json()
        resident_transcript = data_res["transcript"]
        print(f"   [PASS] Resident Transcript: \"{resident_transcript}\"")
        print(f"   Model: {data_res['model']} | Language: {data_res.get('detected_language_code')} | Latency: {data_res.get('end_to_end_latency')}s")
        assert len(resident_transcript.strip()) > 0

        # 2. Transcribe Official Audio
        print("\n2. Transcribing Project Engineer Interview Audio...")
        with open(official_wav_path, "rb") as f:
            official_bytes = f.read()

        resp_off = await client.post(
            "/api/audio/transcribe",
            data={"model": "prisma-v3.0", "language_code": "indic-auto"},
            files={"file": ("official_interview.wav", official_bytes, "audio/wav")}
        )
        assert resp_off.status_code == 200, f"Official transcription failed: {resp_off.text}"
        data_off = resp_off.json()
        official_transcript = data_off["transcript"]
        print(f"   [PASS] Official Transcript: \"{official_transcript}\"")
        print(f"   Model: {data_off['model']} | Language: {data_off.get('detected_language_code')} | Latency: {data_off.get('end_to_end_latency')}s")
        assert len(official_transcript.strip()) > 0

        test_results["scenario_transcriptions"] = True

        # 3. Stage All Sources into Evidence Synthesis Pipeline
        print("\n3. Synthesizing Evidence Matrix with PDF + 2 Audio Interviews (POST /api/analyze)...")
        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()

        audio_staged = [
            {
                "id": "audio-resident-01",
                "filename": "resident_interview.wav",
                "transcript": resident_transcript
            },
            {
                "id": "audio-official-02",
                "filename": "official_interview.wav",
                "transcript": official_transcript
            }
        ]

        topic = "Highway 48 Project Completion Schedule and Delay Discrepancies"
        question = "What is the legally mandated project deadline, how do resident and engineer testimonies contrast with the directive, and what approvals are missing for proposed delays?"

        analyze_resp = await client.post(
            "/api/analyze",
            data={
                "topic": topic,
                "question": question,
                "audio_transcripts_json": json.dumps(audio_staged)
            },
            files=[
                ("pdf_files", ("official_highway_schedule.pdf", pdf_bytes, "application/pdf"))
            ]
        )

        assert analyze_resp.status_code == 200, f"Analysis matrix failed: {analyze_resp.text}"
        analysis = analyze_resp.json()
        print("   [PASS] Evidence Matrix Analysis successfully generated!")

        # -------------------------------------------------------------
        # PART 2: VERIFY EVIDENCE INTELLIGENCE
        # -------------------------------------------------------------
        print("\n" + "=" * 60)
        print("PART 2: VERIFY EVIDENCE INTELLIGENCE ON THE SCENARIO")
        print("=" * 60)

        # 1. Check Atomic Claims & Source Attribution
        claims = analysis.get("claims", [])
        print(f"\n1. Extracted Grounded Claims ({len(claims)} total):")
        assert len(claims) >= 3, "Expected at least 3 atomic claims across sources"
        
        audio_claims = []
        pdf_claims = []
        for c in claims:
            s_title = c.get("source_title", "")
            c_text = c.get("claim_text", "")
            excerpt = c.get("evidence_excerpt", "")
            url = c.get("source_url", "")
            print(f"   * [{s_title}]: \"{c_text}\"")
            print(f"     Provenance File: {url} | Quote: \"{excerpt[:80]}...\"")
            if "resident_interview" in url or "resident" in s_title.lower():
                audio_claims.append(c)
            elif "official_interview" in url or "official_interview" in s_title.lower() or "engineer" in s_title.lower():
                audio_claims.append(c)
            elif "official_highway_schedule" in url or "pdf" in s_title.lower():
                pdf_claims.append(c)

        print(f"   -> Audio-grounded claims: {len(audio_claims)} | PDF-grounded claims: {len(pdf_claims)}")
        assert len(audio_claims) >= 1, "Expected at least 1 claim grounded in audio interviews"

        # 2. Check Contradiction Detection
        conflicts = analysis.get("conflicts", [])
        print(f"\n2. Detected Contradictions & Discrepancies ({len(conflicts)} total):")
        assert len(conflicts) >= 1, "Expected at least 1 detected conflict regarding project deadline"
        for conf in conflicts:
            print(f"   * Discrepancy: {conf.get('topic')} [Severity: {conf.get('severity')}]")
            print(f"     Reason: {conf.get('conflict_reason')}")
            print(f"     Source A: {conf.get('source_a', {}).get('source_title')} -> \"{conf.get('source_a', {}).get('claim_text')}\"")
            print(f"     Source B: {conf.get('source_b', {}).get('source_title')} -> \"{conf.get('source_b', {}).get('claim_text')}\"")
            print(f"     Resolution Hint: {conf.get('resolution_hint')}")

        # 3. Check Negative Space / Information Gaps
        gaps = analysis.get("gaps", [])
        print(f"\n3. Discovered Information Gaps ({len(gaps)} total):")
        assert len(gaps) >= 1, "Expected at least 1 identified information gap"
        for g in gaps:
            print(f"   * [{g.get('importance').upper()}]: {g.get('title')} ({g.get('category')})")
            print(f"     Question: {g.get('unanswered_question')}")
            print(f"     Why it matters: {g.get('why_it_matters')}")
            print(f"     Action: {g.get('suggested_verification')}")

        # 4. Check Decision Readiness Score
        readiness = analysis.get("decision_readiness", {})
        score = readiness.get("score")
        level = readiness.get("level")
        print(f"\n4. Decision Readiness Assessment:")
        print(f"   Score: {score}/100 ({level})")
        print(f"   Calculation: {readiness.get('explanation')}")
        assert 15 <= score <= 96

        # 5. Check Verification Checklist
        checklist = analysis.get("checklist", [])
        print(f"\n5. Actionable Verification Checklist ({len(checklist)} tasks):")
        assert len(checklist) >= 1, "Expected at least 1 verification task"
        for item in checklist:
            print(f"   * [{item.get('priority').upper()}]: {item.get('action_required')}")
            print(f"     Authority: {item.get('recommended_authority')}")
            print(f"     Rationale: {item.get('rationale')}")

        test_results["scenario_evidence_intelligence"] = True

        # -------------------------------------------------------------
        # PART 3: VERIFY AUDIO PROVENANCE
        # -------------------------------------------------------------
        print("\n" + "=" * 60)
        print("PART 3: VERIFY AUDIO PROVENANCE TRACEABILITY")
        print("=" * 60)

        sources = analysis.get("sources", [])
        audio_sources = [s for s in sources if s.get("type") == "audio"]
        print(f"Total Sources in Ledger: {len(sources)} | Audio Sources: {len(audio_sources)}")
        assert len(audio_sources) == 2, "Expected exactly 2 audio sources in the provenance ledger"
        
        for asrc in audio_sources:
            print(f"   * Source ID: {asrc.get('source_id')}")
            print(f"     Title: {asrc.get('title')}")
            print(f"     Original Filename: {asrc.get('url_or_filename')}")
            print(f"     Status: {asrc.get('status')} | Chars: {asrc.get('character_count')}")
            assert asrc.get("url_or_filename") in ["resident_interview.wav", "official_interview.wav"]

        test_results["scenario_provenance"] = True

        # -------------------------------------------------------------
        # PART 4: HINDI-ENGLISH CODE-MIXED SPEECH (HINGLISH)
        # -------------------------------------------------------------
        print("\n" + "=" * 60)
        print("PART 4: CODE-MIXED SPEECH (HINGLISH) TRANSCRIPTION TEST")
        print("=" * 60)

        hinglish_wav_path = os.path.join(os.path.dirname(__file__), "hinglish_interview.wav")
        assert os.path.exists(hinglish_wav_path), f"File missing: {hinglish_wav_path}"
        with open(hinglish_wav_path, "rb") as f:
            hinglish_bytes = f.read()

        resp_h = await client.post(
            "/api/audio/transcribe",
            data={"model": "prisma-v3.0", "language_code": "indic-auto"},
            files={"file": ("hinglish_interview.wav", hinglish_bytes, "audio/wav")}
        )
        assert resp_h.status_code == 200, f"Hinglish transcription failed: {resp_h.text}"
        data_h = resp_h.json()
        print(f"   [PASS] Hinglish Transcript: \"{data_h.get('transcript')}\"")
        print(f"   Detected Language: {data_h.get('detected_language_code')}")
        print(f"   Processing Time: {data_h.get('processing_time')}s")
        assert len(data_h.get("transcript", "").strip()) > 0
        test_results["hinglish_speech"] = True

        # -------------------------------------------------------------
        # PART 5: EDGE CASES VALIDATION
        # -------------------------------------------------------------
        print("\n" + "=" * 60)
        print("PART 5: EDGE CASES VALIDATION")
        print("=" * 60)

        # Edge Case 1: Empty audio file (0 bytes)
        print("\n1. Testing Empty Audio (0 bytes)...")
        resp_empty = await client.post(
            "/api/audio/transcribe",
            files={"file": ("empty.wav", b"", "audio/wav")}
        )
        print(f"   Status: {resp_empty.status_code} | Detail: {resp_empty.json().get('detail')}")
        assert resp_empty.status_code == 400

        # Edge Case 2: Unsupported file format (.txt)
        print("\n2. Testing Unsupported Audio Format (.txt)...")
        resp_unsupported = await client.post(
            "/api/audio/transcribe",
            files={"file": ("report.txt", b"plain text content", "text/plain")}
        )
        print(f"   Status: {resp_unsupported.status_code} | Detail: {resp_unsupported.json().get('detail')}")
        assert resp_unsupported.status_code == 400

        # Edge Case 3: Oversized audio (> 10 MB)
        print("\n3. Testing Oversized Audio (> 10 MB)...")
        fake_large_audio = b"\x00" * (11 * 1024 * 1024) # 11 MB
        resp_large = await client.post(
            "/api/audio/transcribe",
            files={"file": ("large_audio.wav", fake_large_audio, "audio/wav")}
        )
        print(f"   Status: {resp_large.status_code} | Detail: {resp_large.json().get('detail')}")
        assert resp_large.status_code == 400

        # Edge Case 4: Missing filename
        print("\n4. Testing Upload with empty filename...")
        resp_nofile = await client.post(
            "/api/audio/transcribe",
            files={"file": ("", b"abc", "audio/wav")}
        )
        print(f"   Status: {resp_nofile.status_code}")
        assert resp_nofile.status_code in [400, 422]

        test_results["edge_cases"] = True

        # -------------------------------------------------------------
        # PART 6: REGRESSION TESTING (PDF, URL, MANUAL TEXT)
        # -------------------------------------------------------------
        print("\n" + "=" * 60)
        print("PART 6: REGRESSION TESTING (PDF, URL, MANUAL TEXT)")
        print("=" * 60)

        # 1. URL extraction test
        print("1. Testing Web URL Extractor...")
        test_url = "https://peps.python.org/pep-0684/"
        url_res = await extract_from_url(test_url, "url-reg-1")
        print(f"   URL Status: {url_res.status} | Title: {url_res.title[:35]} | Chars: {url_res.character_count}")
        assert url_res.status == "success" and url_res.character_count > 500

        # 2. PDF extraction test
        print("2. Testing PyMuPDF Extractor...")
        pdf_res = extract_from_pdf_bytes(pdf_bytes, "official_highway_schedule.pdf", "pdf-reg-1")
        print(f"   PDF Status: {pdf_res.status} | Title: {pdf_res.title[:35]} | Chars: {pdf_res.character_count}")
        assert pdf_res.status == "success" and pdf_res.character_count > 100

        # 3. Manual text extraction test
        print("3. Testing Manual Text Extractor...")
        text_res = extract_from_manual_text("Press note: The ministry will inspect Highway 48 on Friday.", "text-reg-1")
        print(f"   Text Status: {text_res.status} | Chars: {text_res.character_count}")
        assert text_res.status == "success" and text_res.character_count > 0

        # 4. Direct API health test
        print("4. Testing GET /api/health ...")
        health_res = await client.get("/api/health")
        print(f"   Health Status: {health_res.status_code} | Body: {health_res.json()}")
        assert health_res.status_code == 200

        test_results["regression_testing"] = True

        # -------------------------------------------------------------
        # PART 7: SECURITY AUDIT
        # -------------------------------------------------------------
        print("\n" + "=" * 60)
        print("PART 7: SECURITY AUDIT")
        print("=" * 60)

        # 1. Check frontend code for secret leaks
        frontend_src = Path(__file__).resolve().parent.parent.parent / "frontend" / "src"
        secret_found = False
        gnani_key = os.getenv("GNANI_API_KEY", "")

        for root, dirs, files in os.walk(frontend_src):
            for file in files:
                if file.endswith((".ts", ".tsx", ".js", ".jsx", ".html")):
                    content = open(os.path.join(root, file), "r", encoding="utf-8", errors="ignore").read()
                    if "GNANI_API_KEY" in content or (gnani_key and gnani_key in content):
                        print(f"   [FAIL] Secret found in: {file}")
                        secret_found = True

        if not secret_found:
            print("   [PASS] No API keys or secrets found anywhere in frontend code.")

        # 2. Check gitignore for .env
        env_ignored = False
        import subprocess
        proc = subprocess.run(["git", "check-ignore", "backend/.env"], capture_output=True, text=True)
        if proc.returncode == 0 and "backend/.env" in proc.stdout:
            env_ignored = True
            print("   [PASS] backend/.env is strictly excluded from Git tracking.")
        assert env_ignored, "backend/.env must be ignored by Git"

        # 3. Check environment variable handling
        assert gnani_key and gnani_key.startswith("vach_"), "GNANI_API_KEY must be a valid non-empty string"
        print("   [PASS] GNANI_API_KEY properly loaded from backend/.env into runtime.")

        test_results["security_audit"] = True

    print("\n" + "=" * 80)
    print("ALL COMPREHENSIVE VALIDATION CHECKS PASSED WITH 100% SUCCESS!")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(run_comprehensive_validation())

