import asyncio
import contextvars
import json
import os
import re
import time

from pathlib import Path

import httpx
from dotenv import load_dotenv

ENV_FILE = Path(__file__).resolve().parent.parent / ".env"
BASE_URL = os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1")
MODEL = os.getenv("LLM_MODEL", "openai/gpt-oss-120b")


class LLMError(Exception):
    pass


_trace = contextvars.ContextVar("ai_trace", default=None)


def start_trace() -> None:
    _trace.set([])


def take_trace() -> list:
    return list(_trace.get() or [])


def _note(purpose: str, ok: bool, key_label: str = "") -> None:
    box = _trace.get()
    if box is None:
        return
    model = MODEL.split("/")[-1]
    if key_label:
        model = f"{model} · {key_label}"
    box.append({"purpose": purpose, "model": model, "ok": ok})


# Stay on one key until Groq says that account is used up, then the other, then back.
_active = 0
_cool_until = [0.0, 0.0]


def _clean(name: str) -> str:
    return (os.getenv(name) or "").strip().strip('"').strip("'")


def _keys() -> list[str]:
    load_dotenv(ENV_FILE, override=True)
    primary = _clean("API_KEY") or _clean("GROQ_API_KEY")
    second = _clean("API_KEY_2")
    keys = []
    for key in (primary, second):
        if key and key not in keys:
            keys.append(key)
    if not keys:
        raise LLMError("No API_KEY in .env. Save the file with API_KEY=your_groq_key.")
    while len(_cool_until) < len(keys):
        _cool_until.append(0.0)
    return keys


def _pick(count: int) -> int | None:
    """The key to use now. Skips an account that is still cooling off."""
    global _active
    now = time.monotonic()
    for offset in range(count):
        index = (_active + offset) % count
        if _cool_until[index] <= now:
            _active = index
            return index
    return None


def _cool(index: int, seconds: float) -> None:
    """Park this key and make the next call start on the other one."""
    global _active
    _cool_until[index] = time.monotonic() + max(seconds, 1)
    if len(_cool_until) > 1:
        _active = (index + 1) % len(_cool_until)


def _retry_seconds(resp: httpx.Response) -> float:
    header = resp.headers.get("retry-after")
    if header:
        try:
            return float(header)
        except ValueError:
            pass
    text = resp.text.lower()
    hours = re.search(r"(\d+)\s*h", text)
    minutes = re.search(r"(\d+)\s*m", text)
    seconds = re.search(r"(\d+)\s*s", text)
    total = 0.0
    if hours:
        total += int(hours.group(1)) * 3600
    if minutes:
        total += int(minutes.group(1)) * 60
    if seconds:
        total += int(seconds.group(1))
    return total or 4.0


def _exhausted(wait: float, text: str) -> bool:
    lowered = text.lower()
    return wait > 30 or "per day" in lowered or "quota" in lowered


def _parse(text: str) -> dict:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.S)
        if match:
            return json.loads(match.group(0))
        raise


async def chat_json(system: str, user: dict, max_tokens: int = 1200, temperature: float = 0.6, purpose: str = "AI call") -> dict:
    body = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": json.dumps(user, ensure_ascii=False)},
        ],
        "temperature": temperature,
        "max_completion_tokens": max_tokens,
        "response_format": {"type": "json_object"},
    }
    if "gpt-oss" in MODEL:
        body["reasoning_effort"] = "low"
    keys = _keys()
    last_error = "unknown error"
    async with httpx.AsyncClient(timeout=90) as client:
        for _ in range(len(keys)):
            index = _pick(len(keys))
            if index is None:
                break
            label = f"key {index + 1}"
            headers = {"Authorization": f"Bearer {keys[index]}"}
            move_on = False
            for attempt in range(3):
                resp = await client.post(f"{BASE_URL}/chat/completions", json=body, headers=headers)
                if resp.status_code == 429:
                    wait = _retry_seconds(resp)
                    last_error = "rate limit"
                    if _exhausted(wait, resp.text) or attempt == 2:
                        _cool(index, wait)
                        move_on = True
                        break
                    await asyncio.sleep(wait + 0.5)
                    continue
                if resp.status_code in {401, 403}:
                    _cool(index, 3600)
                    last_error = f"{label} was rejected"
                    move_on = True
                    break
                if resp.status_code >= 400:
                    detail = resp.text[:300]
                    if resp.status_code == 400 and "json" in detail.lower() and attempt == 0:
                        body["max_completion_tokens"] = int(max_tokens * 1.5)
                        last_error = detail
                        continue
                    raise LLMError(f"Model error {resp.status_code}: {detail}")
                content = resp.json()["choices"][0]["message"].get("content") or ""
                try:
                    parsed = _parse(content)
                except (json.JSONDecodeError, ValueError):
                    last_error = "the model did not return JSON"
                    body["temperature"] = 0.3
                    continue
                _note(purpose, True, label)
                return parsed
            if move_on:
                continue
            break
    _note(purpose, False)
    now = time.monotonic()
    cooling = [max(0.0, _cool_until[i] - now) for i in range(len(keys))]
    if cooling and all(wait > 30 for wait in cooling):
        minutes = int(min(cooling) // 60) + 1
        if len(keys) > 1:
            raise LLMError(f"Both Groq keys are used up for now. Try again in about {minutes} minutes.")
        raise LLMError(f"Free quota is used up for now. Try again in about {minutes} minutes.")
    raise LLMError(f"Could not get an answer from the model: {last_error}")
