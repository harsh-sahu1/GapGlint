import subprocess
import time
import urllib.request
import json
import sys
import os

print("Starting Uvicorn server on port 8000...")
proc = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "main:app", "--port", "8000"],
    cwd=os.path.dirname(os.path.abspath(__file__)),
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE
)

try:
    # Wait for server to bind
    time.sleep(2.5)
    url = "http://127.0.0.1:8000/api/health"
    print(f"Pinging {url}...")
    with urllib.request.urlopen(url, timeout=5) as response:
        status_code = response.getcode()
        body = response.read().decode('utf-8')
        data = json.loads(body)
        print("HTTP_STATUS_CODE:", status_code)
        print("HEALTH_DATA:", data)
        assert status_code == 200
        assert data == {"status": "healthy", "application": "GapGlint"}
        print("LIVE_SERVER_HEALTH_VERIFIED_SUCCESSFULLY")
finally:
    proc.terminate()
    proc.kill()
    print("Server cleanly stopped.")

