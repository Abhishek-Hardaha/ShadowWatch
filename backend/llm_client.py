import os
import json
import httpx
import asyncio
from typing import List, Dict, Any, Optional

DEFAULT_LLM_URL = ""

class LLMClient:
    def __init__(self, base_url: str = DEFAULT_LLM_URL):
        self.base_url = (base_url or "").strip().rstrip("/")
        self.model_name = "qwen2.5:14b-instruct"

    def set_base_url(self, new_url: str):
        self.base_url = (new_url or "").strip().rstrip("/")

    async def check_health(self) -> Dict[str, Any]:
        if not self.base_url:
            return {
                "active": False,
                "url": "",
                "error": "No LLM endpoint configured. Please provide your Colab tunnel URL."
            }
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                resp = await client.get(f"{self.base_url}/api/status")
                if resp.status_code == 200:
                    data = resp.json()
                    return {
                        "active": True,
                        "url": self.base_url,
                        "model": data.get("model", {}).get("name", self.model_name),
                        "gpu": data.get("gpu", {}),
                        "ram": data.get("ram", {}),
                        "cpu": data.get("cpu", {})
                    }
        except Exception as e:
            return {
                "active": False,
                "url": self.base_url,
                "error": str(e)
            }
        return {"active": False, "url": self.base_url}

    async def chat_completion(self, messages: List[Dict[str, str]], temperature: float = 0.2, max_tokens: int = 800) -> str:
        if not self.base_url:
            return "[NO_LLM_CONFIGURED]"
        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False
        }
        try:
            async with httpx.AsyncClient(timeout=35.0) as client:
                resp = await client.post(
                    f"{self.base_url}/v1/chat/completions",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    return content.strip()
                else:
                    return f"[LLM ERROR: Status {resp.status_code} - {resp.text}]"
        except Exception as e:
            return f"[LLM NETWORK ERROR: {str(e)}]"

llm_client = LLMClient()
