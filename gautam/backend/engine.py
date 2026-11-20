"""
Raasta Rules Engine & Matcher (Pure Python).
Evaluates scholarship/scheme eligibility deterministically.
The LLM NEVER decides eligibility - this engine does.
All rules produce auditable reasons and cite official sources.
"""

from typing import Any, Dict, List, Optional
from data import CAREERS, OPPORTUNITIES


def check_rule(profile: Dict[str, Any], rule: Dict[str, Any]) -> Optional[bool]:
    """
    Check a single rule against a student profile.
    Returns:
        True  -> Rule passed
        False -> Rule failed
        None  -> Field unknown in profile (evaluates to 'maybe')
    """
    field = rule.get("f")
    val = profile.get(field)

    if val is None:
        return None

    op = rule.get("op")
    target = rule.get("v")

    if op == "eq":
        return val == target
    elif op == "in":
        return val in target
    elif op == "gte":
        return val >= target
    elif op == "lte":
        return val <= target
    else:
        return None


def evaluate_eligibility(
    profile: Dict[str, Any],
    opportunities: Optional[List[Dict[str, Any]]] = None,
) -> List[Dict[str, Any]]:
    """
    Evaluates profile eligibility against all opportunities.
    Returns list of evaluated opportunities sorted by status:
    eligible -> maybe -> not_eligible.
    """
    if opportunities is None:
        opportunities = OPPORTUNITIES

    results = []
    status_order = {"eligible": 0, "maybe": 1, "not_eligible": 2}

    for opp in opportunities:
        reasons = []
        for r in opp.get("rules", []):
            passed = check_rule(profile, r)
            reasons.append({
                "rule": r.get("f"),
                "passed": passed,
                "text": r.get("t"),
            })

        if any(r["passed"] is False for r in reasons):
            status = "not_eligible"
        elif any(r["passed"] is None for r in reasons):
            status = "maybe"
        else:
            status = "eligible"

        results.append({
            "opportunity_id": opp["id"],
            "name": opp["name"],
            "type": opp.get("type", "scholarship"),
            "benefit": opp.get("benefit", ""),
            "status": status,
            "reasons": reasons,
            "source_url": opp.get("source_url", ""),
            "verified": bool(opp.get("verified_by")),
            "verified_by": opp.get("verified_by"),
            "last_checked": opp.get("last_checked"),
            "deadline": opp.get("deadline", "Check official portal"),
        })

    results.sort(key=lambda x: status_order.get(x["status"], 99))
    return results


def match_careers(
    profile: Dict[str, Any],
    careers: Optional[List[Dict[str, Any]]] = None,
) -> List[Dict[str, Any]]:
    """
    Scores and matches careers against student interests and education.
    Guarantees inclusion of at least one vocational and one emerging career.
    """
    if careers is None:
        careers = CAREERS

    interests = profile.get("interests", []) or []
    education = profile.get("education")

    scored = []
    for c in careers:
        tags = c.get("tags", [])
        score = sum(10 for t in tags if t in interests)
        min_edu = c.get("min_edu", [])
        if education and min_edu:
            if education in min_edu:
                score += 3
            else:
                score -= 8

        item = dict(c)
        item["score"] = score
        scored.append(item)

    # Filter to positive score, sorted descending
    positive = [c for c in scored if c["score"] > 0]
    positive.sort(key=lambda x: x["score"], reverse=True)

    # Pick top 4
    picked = positive[:4]

    # Ensure at least one vocational and one emerging option if available in positive scored
    for required_type in ["vocational", "emerging"]:
        if not any(c.get("type") == required_type for c in picked):
            candidate = next((c for c in positive if c.get("type") == required_type), None)
            if candidate and candidate not in picked:
                picked.append(candidate)

    return picked


def talent_flag(profile: Dict[str, Any]) -> bool:
    """
    AI Talent Flag:
    Marks student as high-potential if marks >= 80% OR has 2+ demonstrated interests/skills.
    """
    marks = profile.get("marks_percent", 0) or 0
    interests = profile.get("interests", []) or []
    return (marks >= 80) or (len(interests) >= 2)


def generate_parent_script(
    profile: Dict[str, Any],
    career_id: str,
    lang: str = "ta",
    careers: Optional[List[Dict[str, Any]]] = None,
) -> str:
    """
    Generates Parent Mode audio script in Tamil or English explaining the career,
    safety, financial benefits, and earnings.
    """
    if careers is None:
        careers = CAREERS

    career = next((c for c in careers if c["id"] == career_id), None)
    if not career and careers:
        career = careers[0]

    eligible_opps = [o for o in evaluate_eligibility(profile) if o["status"] == "eligible"]
    n_count = len(eligible_opps)

    name = profile.get("name")
    earn = career.get("earn", "சந்தைக்கேற்ப") if career else ""

    if lang == "ta":
        student_label = name or "உங்கள் பிள்ளை"
        career_title = career["title"].get("ta", career["title"].get("en")) if career else "பொருத்தமான"
        return (
            f"வணக்கம். {student_label} {career_title} துறையில் படிக்க விரும்புகிறார். "
            f"இதற்கு {n_count} உதவித்தொகைகள் கிடைக்க வாய்ப்பு உள்ளது. "
            f"எதிர்பார்க்கப்படும் வருமானம் {earn}. ஆசிரியர் உதவியுடன் விண்ணப்பிக்கலாம்."
        )
    else:
        student_label = name or "Your child"
        career_title = career["title"].get("en", "the selected field") if career else "their chosen path"
        return (
            f"Hello. {student_label} wants to pursue {career_title}. "
            f"{n_count} scholarships may be available to support their education. "
            f"Expected earnings: {earn}. The facilitator can guide them to apply."
        )


def generate_pathway(
    profile: Dict[str, Any],
    career_id: str,
    careers: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Generates a structured week-by-week learning pathway with official links and exams.
    """
    if careers is None:
        careers = CAREERS

    career = next((c for c in careers if c["id"] == career_id), None)
    if not career:
        matched = match_careers(profile, careers)
        career = matched[0] if matched else careers[0]

    path_steps = []
    for i, step in enumerate(career.get("path", [])):
        path_steps.append({
            "week": f"Week {i * 2 + 1}-{i * 2 + 2}",
            "goal": step[0],
            "resource_title": step[1],
            "resource_url": step[2] if len(step) > 2 else "",
        })

    return {
        "career_id": career["id"],
        "title": career["title"],
        "type": career.get("type"),
        "why": career.get("why"),
        "earn": career.get("earn"),
        "weeks": path_steps,
        "exams": career.get("exams", []),
        "institutions": [
            "Nearest Govt ITI",
            "District Employment & Career Guidance Centre",
            "State Polytechnic College",
        ],
    }
