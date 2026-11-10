import os
import logging
from typing import Dict, Any, Optional
import httpx
from models import AudioTranscriptionResponse

logger = logging.getLogger("gapglint.gnani_stt")

# Supported file extensions per Gnani Prisma v3 documentation
SUPPORTED_AUDIO_EXTENSIONS = {".wav", ".mp3", ".ogg", ".flac", ".aac", ".m4a"}

# MIME type mapping helper
MIME_MAP = {
    ".wav": "audio/wav",
    ".mp3": "audio/mpeg",
    ".ogg": "audio/ogg",
    ".flac": "audio/flac",
    ".aac": "audio/aac",
    ".m4a": "audio/mp4",
}

GNANI_STT_ENDPOINT = os.getenv("GNANI_STT_ENDPOINT", "https://api.vachana.ai/stt/v3")

class GnaniConfigurationError(Exception):
    """Raised when GNANI_API_KEY is missing or invalid in environment."""
    pass

class GnaniAuthError(Exception):
    """Raised when authentication with Gnani API fails (401/403)."""
    pass

class GnaniRateLimitError(Exception):
    """Raised when rate limits or concurrency limits are exceeded (429)."""
    pass

class GnaniServiceError(Exception):
    """Raised when Gnani API returns an application or processing error."""
    pass

def get_gnani_api_key() -> str:
    """Retrieve Gnani API key securely from environment."""
    key = os.getenv("GNANI_API_KEY")
    if not key or not key.strip():
        raise GnaniConfigurationError(
            "GNANI_API_KEY is not configured in the backend environment. "
            "Please configure GNANI_API_KEY in backend/.env."
        )
    return key.strip()

async def transcribe_audio_with_gnani(
    audio_bytes: bytes,
    filename: str,
    model: str = "prisma-v3.0",
    language_code: str = "indic-auto",
    topic: Optional[str] = None,
    previous_text: Optional[str] = None,
    timeout_seconds: float = 30.0
) -> AudioTranscriptionResponse:
    """
    Transcribes audio using Gnani Prisma v3 REST API.
    
    API Specifications:
      - Endpoint: https://api.vachana.ai/stt/v3
      - Header: X-API-Key-ID: <GNANI_API_KEY>
      - Method: POST multipart/form-data
      - Audio file field: audio_file
      - Supported formats: wav, mp3, ogg, flac, aac, m4a (max 30 seconds)
      - Models: prisma-v3.0 (default), prisma-v2.5
      - Language: indic-auto (default automatic language detection) or specific codes (e.g. en-IN, hi-IN)
    """
    api_key = get_gnani_api_key()

    # 1. Validate audio content
    if not audio_bytes or len(audio_bytes) == 0:
        raise ValueError("Audio file is empty (0 bytes). Please provide valid audio data.")

    # 2. Validate file extension
    ext = os.path.splitext(filename)[1].lower() if filename else ""
    if ext not in SUPPORTED_AUDIO_EXTENSIONS:
        raise ValueError(
            f"Unsupported audio format '{ext}'. Supported formats: "
            f"{', '.join(sorted(SUPPORTED_AUDIO_EXTENSIONS))}"
        )

    # 3. Payload size check (Serverless safety limit 4.5 MB, API limit 10 MB)
    max_bytes = 10 * 1024 * 1024  # 10 MB
    if len(audio_bytes) > max_bytes:
        raise ValueError(
            f"Audio file ({len(audio_bytes) / (1024 * 1024):.1f} MB) exceeds maximum allowed size of 10 MB. "
            f"Gnani REST STT is optimized for clips up to 30 seconds."
        )

    content_type = MIME_MAP.get(ext, "application/octet-stream")

    # 4. Prepare request fields
    form_data: Dict[str, str] = {
        "model": model or "prisma-v3.0",
        "language_code": language_code or "indic-auto"
    }

    if topic and topic.strip():
        form_data["topic"] = topic.strip()[:1600]

    if previous_text and previous_text.strip():
        form_data["previous_text"] = previous_text.strip()[:600]

    headers = {
        "X-API-Key-ID": api_key,
        "User-Agent": "GapGlint-STT/1.0"
    }

    files = {
        "audio_file": (filename, audio_bytes, content_type)
    }

    # 5. Execute HTTP POST to Gnani Prisma v3 REST API
    try:
        async with httpx.AsyncClient(timeout=timeout_seconds) as client:
            response = await client.post(
                GNANI_STT_ENDPOINT,
                headers=headers,
                data=form_data,
                files=files
            )

    except httpx.TimeoutException:
        logger.error(f"Gnani STT request timed out after {timeout_seconds}s")
        raise TimeoutError(f"Gnani STT API timed out after {timeout_seconds} seconds.")
    except httpx.ConnectError as e:
        logger.error(f"Network error contacting Gnani STT: {e}")
        raise ConnectionError(f"Unable to connect to Gnani STT service at {GNANI_STT_ENDPOINT}.")
    except Exception as e:
        logger.error(f"Unexpected error during Gnani STT call: {e}")
        raise GnaniServiceError(f"Speech-to-text request failed: {str(e)}")

    # 6. Parse response status and payload
    status_code = response.status_code

    try:
        data = response.json()
    except Exception:
        data = {"raw_text": response.text}

    # Handle HTTP Error Codes safely without exposing secrets
    if status_code == 401:
        err_msg = data.get("detail", {}).get("message", "Unauthorized") if isinstance(data, dict) else "Unauthorized"
        logger.error("Gnani STT Authentication failed (401)")
        raise GnaniAuthError(f"Authentication with Gnani API failed: {err_msg}")

    elif status_code == 402:
        logger.error("Gnani STT Insufficient account credits (402)")
        raise GnaniServiceError("Insufficient Gnani account credit to process transcription.")

    elif status_code == 403:
        err_code = data.get("detail", {}).get("error_code", "SCOPE_NOT_ALLOWED") if isinstance(data, dict) else "FORBIDDEN"
        logger.error(f"Gnani STT Forbidden (403): {err_code}")
        raise GnaniAuthError(f"Access forbidden: {err_code}. Verify your API key has STT scope enabled.")

    elif status_code == 429:
        err_msg = data.get("detail", {}).get("message", "Too many requests") if isinstance(data, dict) else "Rate limited"
        logger.warning(f"Gnani STT Rate limited (429): {err_msg}")
        raise GnaniRateLimitError(f"Gnani rate limit reached: {err_msg}")

    elif status_code >= 400:
        err_info = data.get("error", {}) if isinstance(data, dict) else {}
        err_msg = err_info.get("message") or data.get("detail", {}).get("message") or f"HTTP {status_code}"
        logger.error(f"Gnani STT Error (HTTP {status_code}): {err_msg}")
        raise GnaniServiceError(f"Gnani STT API returned error: {err_msg}")

    # 7. Check for structured response success
    if isinstance(data, dict) and data.get("success") is False:
        err_info = data.get("error", {})
        err_msg = err_info.get("message", "Transcription failed")
        raise GnaniServiceError(f"Gnani transcription failed: {err_msg}")

    transcript = data.get("transcript", "")
    request_id = data.get("request_id")
    resp_model = data.get("model", model)
    detected_lang = data.get("detected_language_code")
    proc_time = data.get("processing_time")
    latency = data.get("end_to_end_latency")

    return AudioTranscriptionResponse(
        success=True,
        transcript=transcript,
        request_id=request_id,
        model=resp_model,
        detected_language_code=detected_lang,
        processing_time=float(proc_time) if proc_time is not None else None,
        end_to_end_latency=float(latency) if latency is not None else None,
        filename=filename,
        file_size_bytes=len(audio_bytes)
    )

