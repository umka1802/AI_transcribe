import pytest
from app.services.export_service import export_service


class TestExportService:
    def test_export_txt(self):
        text = "Hello world"
        result = export_service.export_txt(text)
        assert isinstance(result, bytes)
        assert result.decode("utf-8") == text

    def test_export_docx(self):
        text = "Hello\nworld"
        result = export_service.export_docx(text)
        assert isinstance(result, bytes)
        assert len(result) > 0

    def test_export_srt_simple(self):
        text = "Hello world"
        result = export_service.export_srt(text, None)
        decoded = result.decode("utf-8")
        assert "1" in decoded
        assert "Hello world" in decoded

    def test_export_srt_with_segments(self):
        segments = [
            {"start": 0.0, "end": 2.5, "text": " Hello "},
            {"start": 2.5, "end": 5.0, "text": " world "},
        ]
        result = export_service.export_srt("", segments)
        decoded = result.decode("utf-8")
        assert "00:00:00,000 --> 00:00:02,500" in decoded
        assert "Hello" in decoded
        assert "world" in decoded

    def test_format_srt_time(self):
        result = export_service._format_srt_time(3661.5)
        assert result == "01:01:01,500"

    def test_export_pdf(self):
        text = "Hello world"
        result = export_service.export_pdf(text)
        assert isinstance(result, bytes)
        assert len(result) > 0
