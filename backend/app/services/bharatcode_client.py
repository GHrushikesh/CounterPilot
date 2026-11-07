import logging
import os
from typing import List, Dict, Optional
import httpx
from dotenv import dotenv_values

from app.core.config import settings
from app.core.exceptions import (
    AssistantConfigurationException,
    AssistantAuthException,
    AssistantRateLimitException,
    AssistantBusyException,
    AssistantTimeoutException,
    AssistantMalformedException,
)

logger = logging.getLogger(__name__)


class BharatCodeClient:
    def __init__(self, http_client: Optional[httpx.Client] = None):
        self._http_client = http_client
        self.active_model: str = settings.BHARATCODE_MODEL
        self.active_provider: str = "bharatcode"

    def _resolve_provider_and_key(self) -> tuple[str, str, str, str]:
        """
        Resolves active AI provider, api_key, endpoint URL, and model.
        Supports both official BharatCode API and Google Gemini fallback testing.
        Returns: (provider_name, api_key, endpoint, model)
        """
        gemini_key = getattr(settings, "GEMINI_API_KEY", None)
        bharat_key = settings.BHARATCODE_API_KEY

        # Only read disk .env if neither key was explicitly patched / configured in settings
        if gemini_key is None and bharat_key is None:
            for path in (".env", "backend/.env", "../.env"):
                if os.path.exists(path):
                    vals = dotenv_values(path)
                    if not gemini_key:
                        gemini_key = vals.get("GEMINI_API_KEY")
                    if not bharat_key:
                        bharat_key = vals.get("BHARATCODE_API_KEY")
                    if gemini_key or bharat_key:
                        break

        # 1. If explicit Gemini API Key is active
        if gemini_key and gemini_key.strip() and gemini_key.strip() not in (
            "", "your_gemini_api_key_here", "paste_your_api_key_here"
        ):
            base_url = settings.GEMINI_API_BASE_URL.rstrip("/")
            endpoint = f"{base_url}/chat/completions"
            return "gemini", gemini_key.strip(), endpoint, settings.GEMINI_MODEL

        # 2. If BharatCode API Key is active
        if bharat_key and bharat_key.strip() and bharat_key.strip() not in (
            "", "your_bharatcode_api_key_here", "paste_your_api_key_here"
        ):
            clean_key = bharat_key.strip()
            # If user pasted a Google Gemini key into BHARATCODE_API_KEY (AIza... prefix)
            if clean_key.startswith("AIza"):
                base_url = settings.GEMINI_API_BASE_URL.rstrip("/")
                endpoint = f"{base_url}/chat/completions"
                return "gemini", clean_key, endpoint, settings.GEMINI_MODEL

            base_url = settings.BHARATCODE_API_BASE_URL.rstrip("/")
            endpoint = f"{base_url}/chat/completions"
            return "bharatcode", clean_key, endpoint, settings.BHARATCODE_MODEL

        raise AssistantConfigurationException(
            "BharatCode API key is not configured. Please set BHARATCODE_API_KEY or GEMINI_API_KEY in the backend environment."
        )

    def _get_api_key(self) -> str:
        _, key, _, _ = self._resolve_provider_and_key()
        return key

    def generate_chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> str:
        """
        Sends conversation messages to active Model API (/chat/completions).
        Supports BharatCode (qwen-3.8-27b) and Google Gemini (gemini-2.5-flash).
        """
        provider, api_key, endpoint, model = self._resolve_provider_and_key()
        self.active_provider = provider
        self.active_model = model
        provider_label = "Gemini" if provider == "gemini" else "BharatCode"

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        timeout = settings.BHARATCODE_TIMEOUT_SECONDS

        try:
            if self._http_client:
                response = self._http_client.post(endpoint, json=payload, headers=headers, timeout=timeout)
            else:
                with httpx.Client(timeout=timeout) as client:
                    response = client.post(endpoint, json=payload, headers=headers)

            # Resilient fallback if initial Gemini model was deprecated or not found (404)
            if provider == "gemini" and response.status_code == 404:
                for fb_model in ("gemini-2.5-flash-lite", "gemini-3.1-flash-lite"):
                    if fb_model != model:
                        logger.info(f"Gemini model {model} returned 404. Retrying with {fb_model}...")
                        payload["model"] = fb_model
                        if self._http_client:
                            fallback_res = self._http_client.post(endpoint, json=payload, headers=headers, timeout=timeout)
                        else:
                            with httpx.Client(timeout=timeout) as client:
                                fallback_res = client.post(endpoint, json=payload, headers=headers)
                        if fallback_res.status_code == 200:
                            response = fallback_res
                            self.active_model = fb_model
                            break

            if response.status_code in (401, 403):
                logger.error(f"{provider_label} auth failed ({response.status_code}): {response.text}")
                raise AssistantAuthException(f"{provider_label} authentication failed. Please verify your API key.")

            if response.status_code == 402:
                try:
                    err_msg = response.json().get("error", {}).get("message")
                except Exception:
                    err_msg = None
                display_err = err_msg or f"{provider_label} subscription required."
                logger.warning(f"{provider_label} subscription required (402): {response.text}")
                raise AssistantAuthException(f"Subscription required: {display_err}")

            if response.status_code == 429:
                logger.warning(f"{provider_label} rate limit exceeded.")
                raise AssistantRateLimitException(f"{provider_label} model rate limit reached. Please wait a moment and retry.")

            if response.status_code in (502, 503, 504):
                logger.error(f"{provider_label} service unavailable ({response.status_code}): {response.text}")
                raise AssistantBusyException(f"{provider_label} AI service is currently busy. Please retry shortly.")

            if response.status_code != 200:
                logger.error(f"{provider_label} returned unexpected status {response.status_code}: {response.text}")
                raise AssistantMalformedException(f"{provider_label} API returned HTTP status {response.status_code}.")

            try:
                data = response.json()
                choices = data.get("choices")
                if not choices or not isinstance(choices, list) or len(choices) == 0:
                    raise ValueError("No choices found in response")

                choice = choices[0]
                message = choice.get("message", {})
                content = message.get("content")
                if not content or not isinstance(content, str):
                    raise ValueError("No content string in message choice")

                return content.strip()

            except Exception as parse_err:
                logger.error(f"Failed to parse {provider_label} JSON response: {parse_err}. Response body: {response.text}")
                raise AssistantMalformedException(f"Received malformed or non-standard response from {provider_label} API.")

        except httpx.TimeoutException as timeout_err:
            logger.error(f"{provider_label} API timeout after {timeout}s: {timeout_err}")
            raise AssistantTimeoutException(f"{provider_label} AI model request timed out. Please try again.")

        except (
            AssistantConfigurationException,
            AssistantAuthException,
            AssistantRateLimitException,
            AssistantBusyException,
            AssistantTimeoutException,
            AssistantMalformedException,
        ):
            raise

        except httpx.RequestError as req_err:
            logger.error(f"Network error connecting to {provider_label}: {req_err}")
            raise AssistantBusyException(f"Failed to connect to {provider_label} Model API: {str(req_err)}")

