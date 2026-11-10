import os
import sys
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from services.gnani_stt_service import (
    transcribe_audio_with_gnani,
    GnaniConfigurationError,
    GnaniAuthError,
    GnaniRateLimitError,
    GnaniServiceError
)

async def test_real_speech_transcription():
    print("\n--- TEST 1: Real Speech Audio Transcription with Gnani Prisma v3 ---")
    wav_path = os.path.join(os.path.dirname(__file__), "sample_speech.wav")
    assert os.path.exists(wav_path), f"Sample audio file not found at {wav_path}"

    with open(wav_path, "rb") as f:
        audio_bytes = f.read()

    print(f"Audio file loaded: sample_speech.wav ({len(audio_bytes)} bytes)")

    response = await transcribe_audio_with_gnani(
        audio_bytes=audio_bytes,
        filename="sample_speech.wav",
        model="prisma-v3.0",
        language_code="indic-auto"
    )

    print(f"Transcription Success: {response.success}")
    print(f"Model: {response.model}")
    print(f"Request ID: {response.request_id}")
    print(f"Detected Language: {response.detected_language_code}")
    print(f"Processing Time: {response.processing_time}s")
    print(f"End-to-End Latency: {response.end_to_end_latency}s")
    print(f"Transcript: \"{response.transcript}\"")

    assert response.success is True, "Expected success to be True"
    assert response.transcript and len(response.transcript.strip()) > 0, "Transcript should not be empty"
    assert response.model == "prisma-v3.0", f"Expected model prisma-v3.0, got {response.model}"
    assert response.request_id is not None, "Request ID should be present"
    print(">>> TEST 1 PASSED: Real audio transcribed successfully!")

async def test_empty_audio_validation():
    print("\n--- TEST 2: Empty Audio Validation (0 bytes) ---")
    try:
        await transcribe_audio_with_gnani(
            audio_bytes=b"",
            filename="empty.wav"
        )
        assert False, "Should have raised ValueError on empty audio"
    except ValueError as e:
        print(f"Expected error caught: {e}")
        print(">>> TEST 2 PASSED: Empty audio rejected correctly!")

async def test_unsupported_format_validation():
    print("\n--- TEST 3: Unsupported Audio Format Validation ---")
    try:
        await transcribe_audio_with_gnani(
            audio_bytes=b"fake audio data",
            filename="test.txt"
        )
        assert False, "Should have raised ValueError on unsupported format"
    except ValueError as e:
        print(f"Expected error caught: {e}")
        print(">>> TEST 3 PASSED: Unsupported format rejected correctly!")

async def test_fastapi_endpoint_integration():
    print("\n--- TEST 4: FastAPI /api/audio/transcribe Endpoint Test ---")
    import httpx
    from main import app

    wav_path = os.path.join(os.path.dirname(__file__), "sample_speech.wav")
    with open(wav_path, "rb") as f:
        audio_bytes = f.read()

    # Use httpx.AsyncClient with ASGI app transport for clean testing
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver") as client:
        # Test 4a: Valid upload
        resp = await client.post(
            "/api/audio/transcribe",
            data={"model": "prisma-v3.0", "language_code": "indic-auto"},
            files={"file": ("sample_speech.wav", audio_bytes, "audio/wav")}
        )
        print(f"Endpoint status code: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        print(f"Endpoint response success: {data.get('success')}")
        print(f"Endpoint transcript: \"{data.get('transcript')}\"")
        assert data.get("success") is True
        assert len(data.get("transcript", "")) > 0

        # Test 4b: Invalid format upload
        bad_resp = await client.post(
            "/api/audio/transcribe",
            data={"model": "prisma-v3.0"},
            files={"file": ("test.pdf", b"dummy pdf", "application/pdf")}
        )
        print(f"Invalid format status code: {bad_resp.status_code}")
        assert bad_resp.status_code == 400
        print(">>> TEST 4 PASSED: FastAPI endpoint handles valid and invalid requests correctly!")

async def run_all_tests():
    print("=" * 70)
    print("GAPGLINT GNANI PRISMA V3 STT VERIFICATION SUITE")
    print("=" * 70)
    await test_real_speech_transcription()
    await test_empty_audio_validation()
    await test_unsupported_format_validation()
    await test_fastapi_endpoint_integration()
    print("\n" + "=" * 70)
    print("ALL GNANI STT TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_all_tests())

