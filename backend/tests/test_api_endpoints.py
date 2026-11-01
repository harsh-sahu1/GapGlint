import unittest
import asyncio
import os
import sys
import httpx

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from main import app

async def run_all_endpoint_tests():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        res = await client.get("/api/health")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        assert res.json() == {"status": "healthy", "application": "GapGlint"}
        print("[PASS] GET /api/health returned healthy status")

        # 2. Empty topic validation
        res = await client.post("/api/analyze/json", json={"topic": "", "urls": ["https://example.org"], "manual_texts": []})
        assert res.status_code == 400
        assert "Research topic is required" in res.json()["detail"]
        print("[PASS] Empty topic rejected with 400")

        # 3. Empty sources validation
        res = await client.post("/api/analyze/json", json={"topic": "Fellowships", "urls": [], "manual_texts": []})
        assert res.status_code == 400
        assert "At least one source" in res.json()["detail"]
        print("[PASS] Empty sources rejected with 400")

        # 4. Missing API key handling
        old_key = os.environ.get("GEMINI_API_KEY")
        if "GEMINI_API_KEY" in os.environ:
            del os.environ["GEMINI_API_KEY"]
        try:
            res = await client.post("/api/analyze/json", json={
                "topic": "Fellowships",
                "urls": [],
                "manual_texts": [{"id": "t1", "title": "Note", "content": "Sample content text"}]
            })
            assert res.status_code == 400
            assert "GEMINI_API_KEY is not set" in res.json()["detail"]
            print("[PASS] Missing API key cleanly handled with error description")
        finally:
            if old_key:
                os.environ["GEMINI_API_KEY"] = old_key

    print("ALL_ENDPOINT_TESTS_COMPLETED_SUCCESSFULLY")

if __name__ == "__main__":
    asyncio.run(run_all_endpoint_tests())
