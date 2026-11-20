"""
Unit tests for Raasta Rules Engine & Matcher.
Verifies Kavya journey, eligibility rules, career matching guarantees,
and edge cases.
"""

import pytest
from data import KAVYA, STUDENTS
from engine import (
    check_rule,
    evaluate_eligibility,
    match_careers,
    talent_flag,
    generate_parent_script,
    generate_pathway,
)


def test_kavya_full_eligibility():
    """Kavya must qualify for exactly 5 schemes and fail NMMS and Post-Matric SC."""
    results = evaluate_eligibility(KAVYA)
    by_id = {r["opportunity_id"]: r for r in results}

    # Expected Eligible (5)
    assert by_id["pudhumai_penn"]["status"] == "eligible"
    assert by_id["central_sector"]["status"] == "eligible"
    assert by_id["post_matric_obc"]["status"] == "eligible"
    assert by_id["naps"]["status"] == "eligible"
    assert by_id["pmkvy"]["status"] == "eligible"

    # Expected Not Eligible (2)
    assert by_id["nmms"]["status"] == "not_eligible"
    assert any(
        r["rule"] == "education" and r["passed"] is False
        for r in by_id["nmms"]["reasons"]
    )

    assert by_id["post_matric_sc"]["status"] == "not_eligible"
    assert any(
        r["rule"] == "category" and r["passed"] is False
        for r in by_id["post_matric_sc"]["reasons"]
    )


def test_missing_field_evaluates_to_maybe():
    """If a profile is missing a required field, the status must be 'maybe'."""
    incomplete_profile = dict(KAVYA)
    del incomplete_profile["category"]

    results = evaluate_eligibility(incomplete_profile)
    by_id = {r["opportunity_id"]: r for r in results}

    assert by_id["post_matric_obc"]["status"] == "maybe"
    assert any(
        r["rule"] == "category" and r["passed"] is None
        for r in by_id["post_matric_obc"]["reasons"]
    )


def test_income_boundary_failure():
    """If income exceeds limit, scholarship must fail with an explicit reason."""
    richer_profile = dict(KAVYA)
    richer_profile["family_income_lakh"] = 5.0  # Above 4.5L Central Sector limit

    results = evaluate_eligibility(richer_profile)
    by_id = {r["opportunity_id"]: r for r in results}

    assert by_id["central_sector"]["status"] == "not_eligible"
    assert any(
        r["rule"] == "family_income_lakh" and r["passed"] is False
        for r in by_id["central_sector"]["reasons"]
    )


def test_kavya_career_matching_guarantees():
    """Career matches must include vocational and emerging tracks."""
    matches = match_careers(KAVYA)
    assert len(matches) >= 3

    types = [m["type"] for m in matches]
    assert "vocational" in types, "Must contain at least one vocational career"
    assert "emerging" in types, "Must contain at least one emerging career"

    # Top match should be fashion_tech or garment_supervisor for Kavya (stitching)
    top_ids = [m["id"] for m in matches[:2]]
    assert "fashion_tech" in top_ids or "garment_supervisor" in top_ids


def test_talent_flag():
    """Marks >= 80 or 2+ interests triggers talent flag."""
    # Kavya: 82% marks -> True
    assert talent_flag(KAVYA) is True

    # Murugan: 65% marks, 1 interest -> False
    murugan = next(s for s in STUDENTS if s["name"] == "Murugan")
    assert talent_flag(murugan) is False

    # Divya: 93% marks, 2 interests -> True
    divya = next(s for s in STUDENTS if s["name"] == "Divya")
    assert talent_flag(divya) is True


def test_parent_mode_script():
    """Parent mode script must generate proper Tamil and English with eligible count."""
    script_ta = generate_parent_script(KAVYA, "fashion_tech", lang="ta")
    assert "வணக்கம்" in script_ta
    assert "Kavya" in script_ta
    assert "5 உதவித்தொகைகள்" in script_ta

    script_en = generate_parent_script(KAVYA, "fashion_tech", lang="en")
    assert "Hello" in script_en
    assert "5 scholarships" in script_en


def test_pathway_generation():
    """Pathway steps must contain week-by-week goals and links."""
    pw = generate_pathway(KAVYA, "fashion_tech")
    assert pw["career_id"] == "fashion_tech"
    assert len(pw["weeks"]) >= 3
    assert any("SWAYAM" in w["resource_title"] for w in pw["weeks"])
    assert "NIFT entrance" in pw["exams"]


def test_api_endpoints():
    """Test full FastAPI application endpoints via TestClient."""
    from fastapi.testclient import TestClient
    from main import app

    client = TestClient(app)

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

    # 2. Eligibility API
    res = client.post("/api/eligibility", json={"profile": KAVYA})
    assert res.status_code == 200
    opps = res.json()
    assert any(o["opportunity_id"] == "pudhumai_penn" and o["status"] == "eligible" for o in opps)

    # 3. Careers Match API
    res = client.post("/api/careers/match", json={"profile": KAVYA})
    assert res.status_code == 200
    careers = res.json()
    assert any(c["type"] == "vocational" for c in careers)
    assert any(c["type"] == "emerging" for c in careers)

    # 4. Pathway API
    res = client.post("/api/pathway", json={"profile": KAVYA, "career_id": "fashion_tech"})
    assert res.status_code == 200
    assert len(res.json()["weeks"]) > 0

    # 5. Parent Script API
    res = client.post("/api/parent-script", json={"profile": KAVYA, "career_id": "fashion_tech", "lang": "ta"})
    assert res.status_code == 200
    assert "வணக்கம்" in res.json()["text"]

    # 6. Facilitator Students API
    res = client.get("/api/facilitator/students")
    assert res.status_code == 200
    students = res.json()
    kavya_item = next(s for s in students if s["name"] == "Kavya")
    assert kavya_item["talent_flag"] is True

    # 7. Offline Pack API
    res = client.get("/api/offline-pack")
    assert res.status_code == 200
    pack = res.json()
    assert len(pack["opportunities"]) >= 7
    assert len(pack["careers"]) >= 8

