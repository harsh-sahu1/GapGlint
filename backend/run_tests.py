import unittest
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if sys.platform == "win32":
    import asyncio
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

def run_all_tests():
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Discover and add test modules
    from tests.test_source_extractor import TestSourceExtractor
    from tests.test_ai_logic import TestAILogicAndValidation

    suite.addTests(loader.loadTestsFromTestCase(TestSourceExtractor))
    suite.addTests(loader.loadTestsFromTestCase(TestAILogicAndValidation))

    runner = unittest.TextTestRunner(verbosity=2)
    print("=" * 60)
    print("GAPGLINT PHASE 2: COMPREHENSIVE TEST SUITE")
    print("=" * 60)
    result = runner.run(suite)

    # Run API endpoint tests
    print("\nRunning API Endpoint & Error Handling Suite...")
    from tests.test_api_endpoints import run_all_endpoint_tests
    import asyncio
    asyncio.run(run_all_endpoint_tests())

    print("\n" + "=" * 60)
    if result.wasSuccessful():
        print("ALL BACKEND TEST SUITES COMPLETED WITH 100% SUCCESS!")
    else:
        print("SOME TESTS ENCOUNTERED FAILURES.")
    print("=" * 60)

if __name__ == "__main__":
    run_all_tests()

