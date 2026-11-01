import re
import io
from typing import Optional, Dict, Any
from bs4 import BeautifulSoup
import httpx
from models import ExtractedSource

DATE_PATTERNS = [
    r'(?:published|updated|date|revised)[\s:]*([A-Za-z]+\s+\d{1,2},\s*\d{4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})',
    r'\b((?:202[0-9]|201[5-9])-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01]))\b',
    r'\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+(?:202[0-9]|201[5-9]))\b',
    r'\b((?:202[0-9]|201[5-9])\/(?:202[0-9]|201[5-9]))\b' # academic cycles like 2024/2025
]

def extract_date_from_text(text: str) -> Optional[str]:
    for pattern in DATE_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            # If there is a capture group, prefer the inner date string
            if match.groups() and match.group(1):
                return match.group(1).strip()
            return match.group(0).strip()
    return None

async def extract_from_url(url: str, source_id: str) -> ExtractedSource:
    """Fetch website URL and extract readable textual content with metadata."""
    headers = {
        "User-Agent": "GapGlint-EvidenceBot/1.0 (+https://github.com/gapglint; educational research platform)"
    }
    
    clean_url = url.strip()
    if not clean_url.startswith(("http://", "https://")):
        clean_url = "https://" + clean_url

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(clean_url, headers=headers)
            
            if resp.status_code >= 400:
                return ExtractedSource(
                    source_id=source_id,
                    type="url",
                    title=clean_url.split('/')[2] if '/' in clean_url else clean_url,
                    url_or_filename=clean_url,
                    extracted_text="",
                    status="failed",
                    error_message=f"HTTP {resp.status_code}: Inaccessible webpage or forbidden access",
                    character_count=0
                )

            html = resp.text
            soup = BeautifulSoup(html, "html.parser")

            # Extract title
            title = ""
            if soup.title and soup.title.string:
                title = soup.title.string.strip()
            if not title:
                h1 = soup.find("h1")
                if h1:
                    title = h1.get_text(strip=True)
            if not title:
                title = clean_url.split('/')[2] if '/' in clean_url else clean_url

            # Remove noisy tags
            for tag in soup(["script", "style", "noscript", "svg", "nav", "footer", "aside"]):
                tag.decompose()

            # Attempt date extraction from meta tags
            pub_date = None
            date_meta = soup.find("meta", attrs={"property": re.compile(r"article:(published|modified)_time", re.I)}) or \
                        soup.find("meta", attrs={"name": re.compile(r"(pubdate|publishdate|date)", re.I)})
            if date_meta and date_meta.get("content"):
                pub_date = date_meta["content"].strip()[:20]

            # Collect body text
            body_text = ""
            main_content = soup.find("main") or soup.find("article") or soup.find("div", id=re.compile(r"(content|main)", re.I))
            if main_content:
                paragraphs = main_content.find_all(["p", "li", "h2", "h3", "h4", "td"])
                body_text = "\n\n".join(p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True))
            else:
                paragraphs = soup.find_all(["p", "li", "h2", "h3", "h4", "td"])
                body_text = "\n\n".join(p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True))

            # Fallback date search in body text
            if not pub_date:
                pub_date = extract_date_from_text(body_text[:1500])

            # Truncate to reasonable token limit (e.g. 20k chars)
            max_chars = 20000
            truncated_text = body_text[:max_chars]

            if not truncated_text.strip():
                return ExtractedSource(
                    source_id=source_id,
                    type="url",
                    title=title,
                    url_or_filename=clean_url,
                    extracted_text="",
                    status="failed",
                    error_message="Webpage returned no readable text or is protected by client-side JavaScript rendering",
                    character_count=0
                )

            return ExtractedSource(
                source_id=source_id,
                type="url",
                title=title,
                url_or_filename=clean_url,
                extracted_text=truncated_text,
                publication_date=pub_date,
                status="success",
                character_count=len(truncated_text)
            )

    except httpx.TimeoutException:
        return ExtractedSource(
            source_id=source_id,
            type="url",
            title=clean_url,
            url_or_filename=clean_url,
            extracted_text="",
            status="failed",
            error_message="Network request timed out while contacting host",
            character_count=0
        )
    except Exception as e:
        return ExtractedSource(
            source_id=source_id,
            type="url",
            title=clean_url,
            url_or_filename=clean_url,
            extracted_text="",
            status="failed",
            error_message=f"Failed to access URL: {str(e)}",
            character_count=0
        )

def extract_from_pdf_bytes(pdf_bytes: bytes, filename: str, source_id: str) -> ExtractedSource:
    """Extract readable text and metadata from PDF bytes using PyMuPDF (fitz)."""
    try:
        import fitz  # PyMuPDF
    except ImportError:
        return ExtractedSource(
            source_id=source_id,
            type="pdf",
            title=filename,
            url_or_filename=filename,
            extracted_text="",
            status="failed",
            error_message="PyMuPDF library is not installed in the environment",
            character_count=0
        )

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        if doc.page_count == 0:
            return ExtractedSource(
                source_id=source_id,
                type="pdf",
                title=filename,
                url_or_filename=filename,
                extracted_text="",
                status="failed",
                error_message="The provided PDF contains 0 pages or is corrupted",
                character_count=0
            )

        # Extract metadata
        meta = doc.metadata or {}
        title = meta.get("title") or filename
        pub_date = None
        creation_date = meta.get("creationDate") or meta.get("modDate")
        if creation_date:
            # Format: D:YYYYMMDDHHmmSS
            m = re.search(r'D:(\d{4})(\d{2})?(\d{2})?', creation_date)
            if m:
                pub_date = m.group(1)
                if m.group(2):
                    pub_date += f"-{m.group(2)}"

        # Extract page text
        pages_text = []
        for page_num in range(min(doc.page_count, 35)):  # reasonable page limit
            page = doc.load_page(page_num)
            text = page.get_text()
            if text.strip():
                pages_text.append(f"--- Page {page_num + 1} ---\n" + text.strip())

        full_text = "\n\n".join(pages_text)

        if not pub_date:
            pub_date = extract_date_from_text(full_text[:2000])

        max_chars = 25000
        truncated = full_text[:max_chars]

        if not truncated.strip():
            return ExtractedSource(
                source_id=source_id,
                type="pdf",
                title=title,
                url_or_filename=filename,
                extracted_text="",
                status="failed",
                error_message="PDF contains scanned bitmap images without embedded OCR text layer",
                character_count=0
            )

        return ExtractedSource(
            source_id=source_id,
            type="pdf",
            title=title,
            url_or_filename=filename,
            extracted_text=truncated,
            publication_date=pub_date,
            status="success",
            character_count=len(truncated)
        )

    except Exception as e:
        return ExtractedSource(
            source_id=source_id,
            type="pdf",
            title=filename,
            url_or_filename=filename,
            extracted_text="",
            status="failed",
            error_message=f"Failed to parse PDF document: {str(e)}",
            character_count=0
        )

def extract_from_manual_text(text: str, source_id: str, title: Optional[str] = None) -> ExtractedSource:
    """Prepare manually supplied textual excerpt or notes."""
    clean_text = text.strip()
    derived_title = title or clean_text[:40].replace('\n', ' ') + "..."
    pub_date = extract_date_from_text(clean_text[:500])

    return ExtractedSource(
        source_id=source_id,
        type="text",
        title=derived_title,
        url_or_filename="Manual Text Excerpt",
        extracted_text=clean_text[:20000],
        publication_date=pub_date,
        status="success" if len(clean_text) > 0 else "failed",
        error_message=None if len(clean_text) > 0 else "Manual text content is empty",
        character_count=len(clean_text)
    )
