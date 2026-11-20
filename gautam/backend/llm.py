"""
Swappable LLM Wrapper for Raasta.
Handles conversational profiling (adaptive interview pattern inspired by Chakra),
career explanation generation, and multilingual translation.
CRITICAL INVARIANT: The LLM NEVER evaluates eligibility rules.
"""

import os
import json
import re
from typing import Any, Dict, Optional, Tuple
from data import QUESTIONS

# Fields required to complete a student's Skill Genome
RUBRIC_FIELDS = [
    "interests",
    "age",
    "education",
    "gender",
    "govt_school",
    "category",
    "family_income_lakh",
    "marks_percent",
]


def extract_keywords_fallback(message: str, current_field: str) -> Any:
    """Deterministic fallback extractor for demo reliability when LLM API is unavailable."""
    msg_lower = message.lower()
    q_meta = next((q for q in QUESTIONS if q["key"] == current_field), None)
    if not q_meta:
        return None

    for opt in q_meta["options"]:
        keywords = opt.get("kw", [])
        if any(k.lower() in msg_lower for k in keywords):
            return [opt["v"]] if current_field == "interests" else opt["v"]

    # Simple number extraction for age/income/marks if not directly matched
    if current_field == "age":
        nums = re.findall(r"\b\d{1,2}\b", message)
        if nums:
            val = int(nums[0])
            if 14 <= val <= 25:
                return val
    elif current_field == "marks_percent":
        nums = re.findall(r"\b\d{1,2}\b", message)
        if nums:
            return float(nums[0])

    return None


def get_next_missing_field(profile: Dict[str, Any]) -> Tuple[Optional[str], Optional[Dict[str, Any]]]:
    """Finds the next unfilled field according to the Skill Genome rubric."""
    for q in QUESTIONS:
        key = q["key"]
        val = profile.get(key)
        if val is None or (isinstance(val, list) and len(val) == 0):
            return key, q
    return None, None


def chat_profile(
    student_id: str,
    lang: str,
    message: str,
    existing_profile: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Adaptive profiling chat endpoint logic.
    Follows Chakra adaptive-interview pattern: checks remaining unfilled fields,
    extracts new information from student message, and asks the next question.
    """
    profile = dict(existing_profile or {})
    profile.setdefault("state", "TN")
    profile.setdefault("disability", False)

    current_missing_key, current_q = get_next_missing_field(profile)

    # 1. Try extracting value for the current missing field
    if current_missing_key:
        extracted = extract_keywords_fallback(message, current_missing_key)
        if extracted is not None:
            profile[current_missing_key] = extracted

    # 2. Check what's still missing after extraction
    next_missing_key, next_q = get_next_missing_field(profile)

    if not next_missing_key:
        # All rubric fields collected!
        done_text = (
            "நன்றி! உங்கள் சுயவிவரம் முடிந்தது. உங்களுக்கான வழிகளைப் பார்க்கவும்."
            if lang == "ta"
            else "Thank you! Your Skill Genome is complete. Let's see your matched career routes."
        )
        return {
            "reply_text": done_text,
            "profile": profile,
            "done": True,
        }

    # Ask the next question
    q_text = next_q["ta"] if lang == "ta" else next_q["en"]
    return {
        "reply_text": q_text,
        "profile": profile,
        "done": False,
        "current_field": next_missing_key,
        "options": next_q.get("options", []),
    }
