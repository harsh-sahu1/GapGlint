import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from routes.health import health_check

res = health_check()
print("HEALTH_CHECK_RESULT:", res)
assert res == {"status": "healthy", "application": "GapGlint"}
print("HEALTH_TEST_PASSED_SUCCESSFULLY")
