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
        Resolves active BharatCode API key, endpoint URL, and model.
        Returns: (provider_name, api_key, endpoint, model)
        """
        bharat_key = settings.BHARATCODE_API_KEY

        # Only read disk .env if key was not explicitly configured in settings
        if bharat_key is None:
            for path in (".env", "backend/.env", "../.env"):
                if os.path.exists(path):
                    vals = dotenv_values(path)
                    bharat_key = vals.get("BHARATCODE_API_KEY")
                    if bharat_key:
                        break

        if bharat_key and bharat_key.strip() and bharat_key.strip() not in (
            "", "your_bharatcode_api_key_here", "paste_your_api_key_here"
        ):
            clean_key = bharat_key.strip()
            base_url = settings.BHARATCODE_API_BASE_URL.rstrip("/")
            endpoint = f"{base_url}/chat/completions"
            return "bharatcode", clean_key, endpoint, settings.BHARATCODE_MODEL

        raise AssistantConfigurationException(
            "BharatCode API key is not configured. Please set BHARATCODE_API_KEY in the backend environment."
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
        Sends conversation messages to BharatCode Model API (/chat/completions)
        using the official qwen-3.8-27b model.
        """
        provider, api_key, endpoint, model = self._resolve_provider_and_key()
        self.active_provider = provider
        self.active_model = model

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

            if response.status_code in (401, 403):
                logger.error(f"BharatCode auth failed ({response.status_code}): {response.text}")
                raise AssistantAuthException("BharatCode authentication failed. Please verify your API key.")

            if response.status_code == 402:
                try:
                    err_msg = response.json().get("error", {}).get("message")
                except Exception:
                    err_msg = None
                display_err = err_msg or "BharatCode subscription required."
                logger.warning(f"BharatCode subscription required (402): {response.text}")
                raise AssistantAuthException(f"Subscription required: {display_err}")

            if response.status_code == 429:
                logger.warning(f"BharatCode rate limited: {response.text}")
                raise AssistantRateLimitException("BharatCode rate limit reached. Please wait a moment before trying again.")

            if response.status_code in (502, 503, 504):
                if response.status_code == 504:
                    raise AssistantTimeoutException("BharatCode request timed out. Please try again.")
                raise AssistantBusyException("BharatCode service is temporarily busy. Please try again in a moment.")

            if response.status_code != 200:
                logger.error(f"BharatCode unexpected status {response.status_code}: {response.text}")
                raise AssistantMalformedException(f"BharatCode returned status code {response.status_code}")

            try:
                data = response.json()
                choices = data.get("choices", [])
                if not choices:
                    raise AssistantMalformedException("BharatCode returned a malformed response: empty choice list")

                message = choices[0].get("message", {})
                content = message.get("content", "").strip()
                if not content:
                    raise AssistantMalformedException("BharatCode returned a malformed response: empty content")

                return content

            except (KeyError, ValueError, IndexError) as parse_err:
                logger.error(f"Failed to parse BharatCode JSON response: {parse_err}")
                raise AssistantMalformedException("Failed to parse malformed response from BharatCode API")

        except httpx.TimeoutException:
            logger.error("BharatCode request timed out via HTTP client")
            raise AssistantTimeoutException("BharatCode connection timed out. Please check your network connection.")

        except httpx.RequestError as net_err:
            logger.error(f"Network error contacting BharatCode: {net_err}")
            raise AssistantBusyException(f"Could not connect to BharatCode service: {str(net_err)}")
