import unittest
import asyncio
import io
import os
import sys

# Ensure backend root is on Python sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pymupdf as fitz
from services.source_extractor import (
    extract_from_pdf_bytes,
    extract_from_manual_text,
    extract_date_from_text,
    DATE_PATTERNS
)

class TestSourceExtractor(unittest.TestCase):

    def test_pdf_extraction_with_valid_fixture(self):
        """Create a real in-memory PDF fixture and verify PyMuPDF extracts text and pages."""
        doc = fitz.open()
        page1 = doc.new_page()
        page1.insert_text((50, 72), "GapGlint Official Fellowship Guidelines 2025/2026.")
        page1.insert_text((50, 100), "Requirement 1: Minimum cumulative grade percentage is 75%.")
        page1.insert_text((50, 128), "Published on: October 15, 2024.")

        page2 = doc.new_page()
        page2.insert_text((50, 72), "Requirement 2: Annual stipend is $36,000 paid quarterly.")
        
        pdf_bytes = doc.write()
        doc.close()

        result = extract_from_pdf_bytes(pdf_bytes, "guidelines_2025.pdf", "src-pdf-01")
        
        self.assertEqual(result.status, "success")
        self.assertEqual(result.type, "pdf")
        self.assertEqual(result.title, "guidelines_2025.pdf")
        self.assertIn("75%", result.extracted_text)
        self.assertIn("Page 1", result.extracted_text)
        self.assertIn("Page 2", result.extracted_text)
        self.assertGreater(result.character_count, 50)
        print("[PASS] PDF Extraction Test Passed")

    def test_pdf_extraction_with_corrupted_bytes(self):
        """Verify error handling on corrupted PDF file bytes."""
        corrupted = b"NOT_A_REAL_PDF_HEADER_JUST_GARBAGE_BYTES"
        result = extract_from_pdf_bytes(corrupted, "broken.pdf", "src-pdf-02")
        
        self.assertEqual(result.status, "failed")
        self.assertIsNotNone(result.error_message)
        self.assertIn("Failed to parse PDF document", result.error_message)
        print("[PASS] Corrupted PDF Error Handling Test Passed")

    def test_manual_text_extraction(self):
        """Verify manual text excerpts are properly formatted and dated."""
        sample_note = "Official Admissions Note: Application deadline for cycle 2026 is March 1, 2026. GRE required."
        result = extract_from_manual_text(sample_note, "src-text-01", "Dean Excerpt")

        self.assertEqual(result.status, "success")
        self.assertEqual(result.type, "text")
        self.assertEqual(result.title, "Dean Excerpt")
        self.assertIn("March 1, 2026", result.extracted_text)
        self.assertEqual(result.character_count, len(sample_note))
        print("[PASS] Manual Text Extraction Test Passed")

    def test_date_regex_extraction(self):
        """Verify temporal reference extraction from various date formats."""
        self.assertEqual(extract_date_from_text("Published: October 15, 2024 by admin"), "October 15, 2024")
        self.assertEqual(extract_date_from_text("For the academic cycle 2025/2026"), "2025/2026")
        self.assertEqual(extract_date_from_text("Effective date: 2024-08-30."), "2024-08-30")
        print("[PASS] Date Regex Extraction Test Passed")

if __name__ == "__main__":
    unittest.main()
