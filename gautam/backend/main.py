"""
FastAPI Backend for RAASTA ("Google Maps for Careers").
Complies 100% with API Contract specified in CONTEXT_PACK.md Section 9.
"""

from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from data import CAREERS, OPPORTUNITIES, STUDENTS
from engine import (
    evaluate_eligibility,
    generate_parent_script,
    generate_pathway,
    match_careers,
    talent_flag,
)
from llm import chat_profile

app = FastAPI(
    title="Raasta AI Backend",
    description="Backend API for Raasta - Reimagining Education & Economic Empowerment for Rural India",
    version="1.0.0",
)

# Enable CORS for local development and PWA serving
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory recommendations store for Facilitator Mode
facilitator_recommendations: Dict[str, Dict[str, Any]] = {}


# --- Request & Response Models ---
class ChatRequest(BaseModel):
    student_id: Optional[str] = "s1"
    lang: str = "ta"
    message: str
    profile: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ProfileRequest(BaseModel):
    profile: Dict[str, Any]


class PathwayRequest(BaseModel):
    profile: Dict[str, Any]
    career_id: Optional[str] = None


class ParentScriptRequest(BaseModel):
    profile: Dict[str, Any]
    career_id: str
    lang: Optional[str] = "ta"


class RecommendRequest(BaseModel):
    student_id: str
    opportunity_id: Optional[str] = None
    note: Optional[str] = ""


# --- Endpoints ---
@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "Raasta API", "version": "1.0.0"}


@app.post("/api/profile/chat")
def api_profile_chat(req: ChatRequest):
    """
    Multilingual profiling chat endpoint.
    Extracts profile attributes iteratively using the adaptive interview rubric.
    """
    return chat_profile(
        student_id=req.student_id or "s1",
        lang=req.lang,
        message=req.message,
        existing_profile=req.profile or {},
    )


@app.post("/api/careers/match")
def api_careers_match(req: ProfileRequest):
    """
    Matches student Skill Genome to NCO-2015 mapped careers.
    Always guarantees inclusion of at least one vocational and one emerging career.
    """
    matched = match_careers(req.profile)
    return [
        {
            "career_id": c["id"],
            "title": c["title"],
            "type": c["type"],
            "why": c["why"],
            "earning_range": c.get("earn", "₹12,000-25,000/month"),
            "score": c.get("score", 0),
        }
        for c in matched
    ]


@app.post("/api/eligibility")
def api_eligibility(req: ProfileRequest):
    """
    Deterministic rules engine evaluation of scholarships, schemes, and apprenticeships.
    The LLM never evaluates eligibility. Returns per-rule audit trails and official URLs.
    """
    return evaluate_eligibility(req.profile)


@app.post("/api/pathway")
def api_pathway(req: PathwayRequest):
    """
    Generates structured learning pathway with DIKSHA/SWAYAM/Skill India links and exams.
    """
    return generate_pathway(req.profile, req.career_id or "fashion_tech")


@app.post("/api/parent-script")
def api_parent_script(req: ParentScriptRequest):
    """
    Generates localized Parent Mode script ready for voice playback in Tamil or English.
    """
    script = generate_parent_script(req.profile, req.career_id, req.lang or "ta")
    return {"text": script}


@app.get("/api/facilitator/students")
def api_facilitator_students():
    """
    Returns village facilitator dashboard with talent flags and eligible opportunity counts.
    """
    student_list = []
    for s in STUDENTS:
        matched = match_careers(s)
        top_career = matched[0]["title"]["en"] if matched else None
        eligible_items = [o for o in evaluate_eligibility(s) if o["status"] == "eligible"]
        student_id = s.get("student_id", s["name"])
        student_list.append({
            "student_id": student_id,
            "name": s["name"],
            "district": s.get("district", "Villupuram"),
            "top_career": top_career,
            "eligible_count": len(eligible_items),
            "talent_flag": talent_flag(s),
            "recommended": student_id in facilitator_recommendations,
        })
    return student_list


@app.post("/api/facilitator/recommend")
def api_facilitator_recommend(req: RecommendRequest):
    """
    Records facilitator endorsement/recommendation for a student.
    """
    facilitator_recommendations[req.student_id] = {
        "opportunity_id": req.opportunity_id,
        "note": req.note,
    }
    return {"ok": True, "student_id": req.student_id}


@app.get("/api/offline-pack")
def api_offline_pack():
    """
    Ships complete scheme rules and career data for on-device IndexedDB / ServiceWorker storage.
    Enables 100% functionality in airplane mode.
    """
    return {
        "version": "1.0.0",
        "opportunities": OPPORTUNITIES,
        "careers": CAREERS,
    }
