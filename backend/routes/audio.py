import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from models import AudioTranscriptionResponse
from services.gnani_stt_service import (
    transcribe_audio_with_gnani,
    GnaniConfigurationError,
    GnaniAuthError,
    GnaniRateLimitError,
    GnaniServiceError
)

logger = logging.getLogger("gapglint.routes.audio")
router = APIRouter(prefix="/api/audio", tags=["audio"])

@router.post("/transcribe", response_model=AudioTranscriptionResponse)
async def transcribe_audio_endpoint(
    file: UploadFile = File(..., description="Audio file to transcribe (wav, mp3, ogg, flac, aac, m4a; max 30s)"),
    model: str = Form("prisma-v3.0", description="Gnani STT model (prisma-v3.0 or prisma-v2.5)"),
    language_code: str = Form("indic-auto", description="Language code (indic-auto for auto-detection, or e.g. en-IN, hi-IN)"),
    topic: Optional[str] = Form(None, description="Optional domain or context topic (up to 1600 chars)"),
    previous_text: Optional[str] = Form(None, description="Optional previous conversational context (up to 600 chars)")
):
    """
    Transcribes uploaded speech audio using Gnani Prisma v3 Speech-to-Text API.
    
    Accepts:
      - Multipart audio file (WAV, MP3, OGG, FLAC, AAC, M4A; max 30s)
      - Model selection (default: prisma-v3.0)
      - Language code (default: indic-auto for automatic language identification)
      - Optional topic and previous text context
    
    Returns:
      - transcript, detected_language_code, processing_time, latency, request_id
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided for uploaded audio file."
        )

    # Read uploaded audio content
    try:
        audio_bytes = await file.read()
    except Exception as e:
        logger.error(f"Error reading uploaded file: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to read uploaded audio content."
        )

    if not audio_bytes or len(audio_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded audio file is empty (0 bytes)."
        )

    # Execute transcription via Gnani STT service
    try:
        result = await transcribe_audio_with_gnani(
            audio_bytes=audio_bytes,
            filename=file.filename,
            model=model,
            language_code=language_code,
            topic=topic,
            previous_text=previous_text
        )
        return result

    except GnaniConfigurationError as e:
        logger.error(f"Configuration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except GnaniAuthError as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except GnaniRateLimitError as e:
        logger.warning(f"Rate limited: {e}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(e)
        )
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except TimeoutError as e:
        logger.error(f"Timeout error: {e}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=str(e)
        )
    except ConnectionError as e:
        logger.error(f"Connection error: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e)
        )
    except GnaniServiceError as e:
        logger.error(f"Service error: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unhandled error in transcribe_audio_endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during audio transcription."
        )

