import os
import tempfile
import subprocess
import json
from typing import Optional
from ..config import settings


class TranscriptionService:
    def __init__(self):
        self._model = None
        self._use_local = False
        self._use_api = False
        self._load_model()

    def _load_model(self):
        if settings.OPENAI_API_KEY:
            self._use_api = True
        else:
            self._use_local = True
            self._init_local_model()

    def _init_local_model(self):
        try:
            import whisper
            self._model = whisper.load_model(settings.WHISPER_MODEL_SIZE)
            self._use_local = True
        except ImportError:
            pass

    async def transcribe(self, file_path: str, language: str = None) -> dict:
        if self._use_api:
            return await self._transcribe_api(file_path, language)
        elif self._use_local:
            return await self._transcribe_local(file_path, language)
        else:
            if settings.OPENAI_API_KEY:
                return await self._transcribe_api(file_path, language)
            return {"text": "", "error": "No transcription model available"}

    async def _transcribe_api(self, file_path: str, language: str = None) -> dict:
        try:
            import openai
            client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            with open(file_path, "rb") as audio_file:
                kwargs = {
                    "model": settings.OPENAI_MODEL,
                    "file": audio_file,
                    "response_format": "verbose_json",
                }
                if language and language != "auto":
                    kwargs["language"] = language

                response = await client.audio.transcriptions.create(**kwargs)

            return {
                "text": response.text,
                "language": getattr(response, "language", language),
                "duration": getattr(response, "duration", None),
                "segments": getattr(response, "segments", None),
            }
        except Exception as e:
            return {"text": "", "error": str(e), "language": language}

    async def _transcribe_local(self, file_path: str, language: str = None) -> dict:
        try:
            if language == "auto":
                language = None

            result = self._model.transcribe(
                file_path,
                language=language,
                task="transcribe",
                verbose=False,
            )

            return {
                "text": result.get("text", ""),
                "language": result.get("language", language),
                "duration": result.get("duration", None),
                "segments": result.get("segments", None),
            }
        except Exception as e:
            return {"text": "", "error": str(e), "language": language}

    def get_audio_duration(self, file_path: str) -> Optional[float]:
        try:
            result = subprocess.run(
                [
                    "ffprobe", "-v", "quiet", "-print_format", "json",
                    "-show_format", file_path,
                ],
                capture_output=True, text=True, timeout=30,
            )
            data = json.loads(result.stdout)
            return float(data.get("format", {}).get("duration", 0))
        except Exception:
            return None


transcription_service = TranscriptionService()
