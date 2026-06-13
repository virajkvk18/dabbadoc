from __future__ import annotations
import json
from typing import Any

from app.core.config import get_settings
from .utils import extract_json_object, image_to_data_url


class LLMError(RuntimeError):
    pass


class GeminiClient:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._client = None

    def _get_client(self):
        if not self.settings.gemini_api_key:
            raise LLMError("GEMINI_API_KEY is missing")
        if self._client is None:
            from google import genai
            self._client = genai.Client(api_key=self.settings.gemini_api_key)
        return self._client

    def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        image_bytes: bytes | None = None,
        mime_type: str = "image/jpeg",
    ) -> dict[str, Any]:
        client = self._get_client()
        try:
            from google.genai import types

            parts = [types.Part.from_text(text=user_prompt)]
            if image_bytes:
                parts.append(types.Part.from_bytes(data=image_bytes, mime_type=mime_type))

            response = client.models.generate_content(
                model=self.settings.gemini_model,
                contents=[types.Content(role="user", parts=parts)],
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.2,
                    response_mime_type="application/json",
                ),
            )
            text = getattr(response, "text", None) or ""
            data = extract_json_object(text)
            if not data:
                raise LLMError("Gemini returned empty/non-JSON response")
            return data
        except Exception as exc:
            raise LLMError(f"Gemini error: {exc}") from exc


class GrokClient:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._client = None

    def _get_client(self):
        if not self.settings.grok_api_key:
            raise LLMError("GROK_API_KEY is missing")
        if self._client is None:
            from openai import OpenAI
            self._client = OpenAI(
                api_key=self.settings.grok_api_key,
                base_url="https://api.x.ai/v1",
            )
        return self._client

    def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        image_base64: str | None = None,
        mime_type: str = "image/jpeg",
    ) -> dict[str, Any]:
        client = self._get_client()
        try:
            content: list[dict[str, Any]] = [{"type": "text", "text": user_prompt}]
            data_url = image_to_data_url(image_base64, mime_type=mime_type)
            if data_url:
                content.append({"type": "image_url", "image_url": {"url": data_url}})

            response = client.chat.completions.create(
                model=self.settings.grok_model,
                temperature=0.2,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": content},
                ],
            )
            text = response.choices[0].message.content or "{}"
            data = extract_json_object(text)
            if not data:
                raise LLMError("Grok returned empty/non-JSON response")
            return data
        except Exception as exc:
            raise LLMError(f"Grok error: {exc}") from exc


class LLMRouter:
    """Gemini primary, Grok fallback.

    Your existing app can keep both keys in backend env. The frontend should never
    directly call Gemini or Grok.
    """

    def __init__(self) -> None:
        self.settings = get_settings()
        self.gemini = GeminiClient()
        self.grok = GrokClient()

    def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        image_bytes: bytes | None = None,
        image_base64: str | None = None,
        mime_type: str = "image/jpeg",
    ) -> tuple[dict[str, Any], str, bool, list[str]]:
        errors: list[str] = []
        try:
            data = self.gemini.generate_json(system_prompt, user_prompt, image_bytes=image_bytes, mime_type=mime_type)
            return data, "gemini", False, errors
        except Exception as exc:
            errors.append(str(exc))

        if self.settings.enable_grok_fallback:
            try:
                data = self.grok.generate_json(system_prompt, user_prompt, image_base64=image_base64, mime_type=mime_type)
                return data, "grok", True, errors
            except Exception as exc:
                errors.append(str(exc))

        return {}, "local_rules", True, errors
