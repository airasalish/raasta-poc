import json
import re
import uuid
from functools import wraps
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

from fastapi import FastAPI, HTTPException  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402
from pydantic import BaseModel  # noqa: E402

import prompts  # noqa: E402
import schemes  # noqa: E402
from facts import FACTS, LANGUAGES, UI, english_pack  # noqa: E402
from llm import LLMError, chat_json, start_trace, take_trace  # noqa: E402
from portals import FINDERS, PORTALS, portal_card  # noqa: E402

CACHE = Path(__file__).resolve().parent / "cache"
CACHE.mkdir(exist_ok=True)

STUDY_TYPES = list(FINDERS.keys())
COST_LEVELS = {"free", "low", "medium", "high"}
MAX_INTEREST_QUESTIONS = 8

app = FastAPI(title="Raasta counsellor")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

SESSIONS: dict[str, dict] = {}


class StartIn(BaseModel):
    lang: str = "en"


class ChoiceIn(BaseModel):
    session: str
    choice: int


class SessionIn(BaseModel):
    session: str


def traced(fn):
    @wraps(fn)
    async def wrapper(*args, **kwargs):
        start_trace()
        result = await fn(*args, **kwargs)
        if isinstance(result, dict):
            result["ai"] = take_trace()
        return result
    return wrapper


@app.exception_handler(LLMError)
async def llm_error(_, exc: LLMError):
    return JSONResponse(status_code=502, content={"error": str(exc), "ai": take_trace()})


def get_session(sid: str) -> dict:
    s = SESSIONS.get(sid)
    if not s:
        raise HTTPException(404, "Session expired. Start again.")
    return s


def merge(english, translated):
    """Use the translated value where it has the same shape, else keep English."""
    if isinstance(english, dict):
        translated = translated if isinstance(translated, dict) else {}
        return {k: merge(v, translated.get(k)) for k, v in english.items()}
    if isinstance(translated, str) and translated.strip():
        return translated.strip()
    return english


async def language_pack(lang: str) -> dict:
    if lang == "en":
        return english_pack()
    path = CACHE / f"pack_{lang}.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    language = LANGUAGES[lang]["name"]
    system = prompts.TRANSLATE.format(language=language)
    facts = await chat_json(system, FACTS, max_tokens=4000, temperature=0.2, purpose="Translate the fixed questions")
    ui = await chat_json(system, UI, max_tokens=3000, temperature=0.2, purpose="Translate the button labels")
    pack = {"facts": merge(FACTS, facts), "ui": merge(UI, ui)}
    path.write_text(json.dumps(pack, ensure_ascii=False, indent=1), encoding="utf-8")
    return pack


def fact_screen(s: dict, fact: str) -> dict:
    local = s["pack"]["facts"][fact]
    codes = list(FACTS[fact]["options"].keys())
    s["pending_fact"] = fact
    return {
        "type": "question",
        "kind": "fact",
        "fact": fact,
        "text": local["question"],
        "options": [local["options"][c] for c in codes],
        "intro": s["pack"]["ui"]["about_you"] if s["phase"] == "family" else None,
    }


def next_intake_fact(s: dict) -> str | None:
    f = s["facts"]
    if "stage" not in f:
        return "stage"
    if f["stage"] in {"class_12", "passed_12", "college"} and "stream" not in f:
        return "stream"
    if "state" not in f:
        return "state"
    return None


def next_family_fact(s: dict) -> str | None:
    f = s["facts"]
    for fact in ("budget", "gender", "govt_school", "income", "category"):
        if fact == "govt_school" and f.get("state") != "tamil_nadu":
            continue
        if fact not in f:
            return fact
    return None


def student_profile(s: dict) -> dict:
    f = s["facts"]
    profile = {
        "stage": FACTS["stage"]["options"].get(f.get("stage"), "unknown"),
    }
    if f.get("stream"):
        profile["stream"] = FACTS["stream"]["options"][f["stream"]]
    for key in ("state", "gender", "budget"):
        if f.get(key) and f[key] != "skip":
            profile[key] = f[key] if key == "budget" else FACTS[key]["options"][f[key]]
    return profile


def history_for_model(s: dict) -> list[dict]:
    return [{"q": h["q_en"], "options": h["options_en"], "picked": h["picked_en"]} for h in s["history"]]


LENSES = [
    "What they notice first. The options are different things they would look at, not different amounts of effort.",
    "Two good things conflict and they cannot do both. The options are different things they would protect.",
    "They made a mistake other people will see. The options are different ways of facing that mistake.",
    "A slower person depends on them and gets it wrong again. The options are different ways of treating that person.",
    "They can save only one of three things. The options are which kind of thing they save.",
    "Nobody will ever know what they did. The options are what they still bother to do.",
    "A story they were told does not match what they can see. The options are what they trust.",
    "A plan fails halfway. The options are different next moves, and none of them is simply trying harder or resting.",
]


def question_style(score: int, field: str | None) -> str:
    """Generic only while the hidden score is 20 to 40. Above 40, ask about the work itself."""
    if not field or score <= 40:
        private = f" You are privately thinking of {field}, but the student must not be able to name that job." if field else " Name no job."
        return (
            f"score {score}. VAGUE.{private} Use an ordinary home, school, or street scene. "
            "Do not show that field's daily task, tools, materials, or workplace."
        )
    return (
        f"score {score}. TARGETED on {field}. The question must be a real task from this work. "
        f"Name the work of {field} and include a hard, boring, dirty, or unpleasant part of it. "
        "A general home, school, or street scene is wrong here."
    )


def outcomes(s: dict) -> dict:
    field, score = s["field"], s["score"]
    if not s["history"]:
        return {"neutral": "No answer yet. score 0. VAGUE opener. Name no job. Learn how they think."}
    if field:
        up, down = min(100, score + 20), max(0, score - 40)
        support = "CONFIRMED. Set question to null and options to []." if up >= 100 else f"stay in {field}. {question_style(up, field)}"
        oppose = (
            f"{field} is DROPPED. score 0. VAGUE opener in a new direction. Do not return to {field}."
            if down <= 0 else f"stay in {field}. {question_style(down, field)}"
        )
        neutral_up = min(100, score + 20)
        neutral = "CONFIRMED. Set question to null and options to []." if neutral_up >= 100 else f"stay in {field}. {question_style(neutral_up, field)}"
        return {
            "supports": support,
            "opposes": oppose,
            "neutral": "Do not pick neutral. If you do, the server still adds 20. " + neutral,
        }
    return {
        "suggests_field": "A new field starts at score 20. VAGUE. Hint at that field without naming the job. Also set style to vague.",
        "neutral": "Do not pick neutral. Put your best field in suggested_field and use suggests_field. That field starts at score 20. VAGUE.",
    }


def apply_verdict(s: dict, verdict: str, suggested: str | None) -> None:
    """Only a clear oppose lowers the score. Neutral used to freeze the meter at 20, so questions never left the generic band."""
    verdict = (verdict or "neutral").strip().lower()
    name = (suggested or "").strip().lower()
    if s["field"]:
        if verdict == "opposes":
            s["score"] = max(0, s["score"] - 40)
        else:
            s["score"] = min(100, s["score"] + 20)
        if s["score"] <= 0:
            s["dropped"].append(s["field"])
            s["field"] = None
            s["score"] = 0
    elif name and name not in [d.lower() for d in s["dropped"]]:
        s["field"], s["score"] = name, 20
    print(f"[{s['id'][:6]}] verdict={verdict} field={s['field']} score={s['score']} dropped={s['dropped']}")


def clean_question(data: dict) -> dict | None:
    question = data.get("question")
    options = [o for o in (data.get("options") or []) if isinstance(o, str) and o.strip()]
    if not isinstance(question, str) or not question.strip() or len(options) < 2:
        return None
    options = options[:4]
    options_en = [o for o in (data.get("options_en") or []) if isinstance(o, str)]
    if len(options_en) != len(options):
        options_en = options
    return {
        "text": question.strip(),
        "options": [o.strip() for o in options],
        "q_en": (data.get("question_en") or question).strip(),
        "options_en": [o.strip() for o in options_en],
    }


async def interest_turn(s: dict) -> dict:
    language = LANGUAGES[s["lang"]]["name"]
    system = prompts.INTEREST.format(language=language)
    payload = {
        "student": student_profile(s),
        "active_field": s["field"],
        "score": s["score"],
        "lens": LENSES[len(s["history"]) % len(LENSES)],
        "dropped": s["dropped"],
        "outcomes": outcomes(s),
        "history": history_for_model(s),
    }
    why = "Write the first interest question" if not s["history"] else "Judge the last answer and write the next question"
    data = await chat_json(system, payload, max_tokens=1500, purpose=why)
    if s["history"]:
        apply_verdict(s, str(data.get("verdict", "neutral")), data.get("suggested_field"))
    if s["field"] and (s["score"] >= 100 or len(s["history"]) >= MAX_INTEREST_QUESTIONS):
        s["score"] = 100
        return await jobs_screen(s)
    if len(s["history"]) >= MAX_INTEREST_QUESTIONS:
        s["field"] = s["field"] or (str(data.get("suggested_field") or "skilled work").strip().lower())
        s["score"] = 100
        return await jobs_screen(s)
    question = clean_question(data)
    if s["field"] and s["score"] > 40 and str(data.get("style") or "").lower() != "targeted":
        payload["score"] = s["score"]
        payload["active_field"] = s["field"]
        payload["outcomes"] = outcomes(s)
        payload["note"] = (
            f"The score is now {s['score']} for {s['field']}. Rewrite the question as TARGETED. "
            f"It must be a real task in {s['field']}, with that work's tools or workplace and a hard part of the day. "
            "Do not write a generic home, school, or market scene. Set style to targeted."
        )
        rewritten = clean_question(await chat_json(
            system, payload, max_tokens=1500, purpose=f"Rewrite as a targeted {s['field']} question",
        ))
        if rewritten:
            question = rewritten
            data["style"] = "targeted"
    if not question:
        payload["outcomes"] = {"neutral": f"stay in {s['field']}. {question_style(s['score'], s['field'])}" if s["field"]
                               else "score 0. VAGUE opener. Name no job."}
        payload["note"] = "Your last reply had no usable question. Give a question with 2 to 4 options."
        question = clean_question(await chat_json(system, payload, max_tokens=1500, purpose="Write that question again"))
        if not question:
            raise LLMError("The model did not give a question. Try again.")
    s["current"] = question
    return {"type": "question", "kind": "interest", "text": question["text"], "options": question["options"]}


async def jobs_screen(s: dict) -> dict:
    s["phase"] = "jobs"
    if not s.get("jobs"):
        language = LANGUAGES[s["lang"]]["name"]
        data = await chat_json(
            prompts.JOBS.format(field=s["field"], language=language),
            {"student": student_profile(s), "answers": history_for_model(s)},
            max_tokens=1500,
            purpose="Suggest 3 jobs in this field",
        )
        jobs = [j for j in (data.get("jobs") or []) if isinstance(j, dict) and j.get("title")][:3]
        if not jobs:
            raise LLMError("The model did not suggest jobs. Try again.")
        s["jobs"] = jobs
    return {"type": "jobs", "field": s["field"], "jobs": s["jobs"]}


def localized_line(english: str, local: str | None) -> str:
    if not isinstance(local, str) or not local.strip():
        return english
    amounts = re.findall(r"\d[\d,]*", english)
    if all(a in local for a in amounts):
        return local.strip()
    return english


async def road_screen(s: dict) -> dict:
    s["phase"] = "road"
    if s.get("road"):
        return {"type": "road", "road": s["road"]}
    language = LANGUAGES[s["lang"]]["name"]
    eligible = schemes.candidates(s["facts"])
    system = prompts.ROAD.format(
        language=language,
        study_types=", ".join(STUDY_TYPES),
        portals=", ".join(PORTALS.keys()),
    )
    payload = {
        "student": student_profile(s),
        "field": s["field"],
        "job": {"title": s["job"].get("title_en") or s["job"]["title"], "what": s["job"].get("what")},
        "answers": [h["picked_en"] for h in s["history"]],
        "schemes": [{"id": x["id"], "gives": x["pays"]} for x in eligible],
    }
    data = await chat_json(system, payload, max_tokens=5000, temperature=0.5, purpose="Draw the road, colleges, exams and the parent note")
    raw_steps = [st for st in (data.get("steps") or []) if isinstance(st, dict) and st.get("title")]
    if len(raw_steps) < 2:
        raise LLMError("The model did not draw a road. Try again.")

    steps = []
    for st in raw_steps[:7]:
        study_type = st.get("study_type") if st.get("study_type") in FINDERS else "practice"
        allowed = set(FINDERS[study_type])
        prepare = []
        for item in st.get("prepare") or []:
            if not isinstance(item, dict):
                continue
            name = next((p for p in PORTALS if p.lower() == str(item.get("portal", "")).strip().lower()), None)
            if name not in allowed:
                continue
            card = portal_card(name, str(item.get("tip") or ""))
            if card and card["name"] not in [c["name"] for c in prepare]:
                prepare.append(card)
        for name in FINDERS[study_type]:
            if name not in [c["name"] for c in prepare]:
                prepare.append(portal_card(name))
        steps.append({
            "title": str(st.get("title")).strip(),
            "title_en": str(st.get("title_en") or "").strip(),
            "what": str(st.get("what") or "").strip(),
            "duration": str(st.get("duration") or "").strip(),
            "study_type": study_type,
            "cost_level": st.get("cost_level") if st.get("cost_level") in COST_LEVELS else "low",
            "exams": [str(e) for e in (st.get("exams") or []) if str(e).strip()][:4],
            "places": [str(p) for p in (st.get("places") or []) if str(p).strip()][:3],
            "prepare": prepare[:3],
        })

    best = schemes.attach(steps, s["facts"])
    lines = data.get("scheme_lines") if isinstance(data.get("scheme_lines"), dict) else {}
    for step in steps:
        for m in step["schemes"]:
            m["line"] = localized_line(m["pays"], lines.get(m["id"]))

    parent_raw = data.get("parent") if isinstance(data.get("parent"), dict) else {}
    parent = {k: str(parent_raw.get(k) or "").strip() for k in ("wants", "cost", "time", "pay", "safety", "help")}
    if best:
        parent["scheme"] = f"{best['name']}: {localized_line(best['pays'], lines.get(best['id']))}"

    s["road"] = {
        "job": s["job"],
        "summary": str(data.get("summary") or "").strip(),
        "steps": steps,
        "parent": parent,
    }
    return {"type": "road", "road": s["road"]}


@app.get("/api/languages")
async def languages():
    return {"languages": [{"code": c, **v} for c, v in LANGUAGES.items()]}


@app.post("/api/start")
@traced
async def start(body: StartIn):
    if body.lang not in LANGUAGES:
        raise HTTPException(400, "Unknown language")
    sid = uuid.uuid4().hex
    s = {
        "id": sid, "lang": body.lang, "phase": "intake", "facts": {}, "history": [],
        "field": None, "score": 0, "dropped": [], "current": None, "pending_fact": None,
        "jobs": None, "job": None, "road": None,
    }
    s["pack"] = await language_pack(body.lang)
    SESSIONS[sid] = s
    return {
        "session": sid,
        "ui": s["pack"]["ui"],
        "speech": LANGUAGES[body.lang]["speech"],
        "screen": fact_screen(s, "stage"),
    }


@app.post("/api/answer")
@traced
async def answer(body: ChoiceIn):
    s = get_session(body.session)
    if s["phase"] in {"intake", "family"} and s["pending_fact"]:
        fact = s["pending_fact"]
        codes = list(FACTS[fact]["options"].keys())
        if not 0 <= body.choice < len(codes):
            raise HTTPException(400, "Bad choice")
        s["facts"][fact] = codes[body.choice]
        s["pending_fact"] = None
        if s["phase"] == "intake":
            nxt = next_intake_fact(s)
            if nxt:
                return {"screen": fact_screen(s, nxt)}
            s["phase"] = "interest"
            return {"screen": await interest_turn(s)}
        nxt = next_family_fact(s)
        if nxt:
            return {"screen": fact_screen(s, nxt)}
        return {"screen": await road_screen(s)}

    if s["phase"] == "interest" and s["current"]:
        q = s["current"]
        if not 0 <= body.choice < len(q["options"]):
            raise HTTPException(400, "Bad choice")
        s["history"].append({
            "q": q["text"], "q_en": q["q_en"], "options_en": q["options_en"],
            "picked": q["options"][body.choice], "picked_en": q["options_en"][body.choice],
        })
        s["current"] = None
        return {"screen": await interest_turn(s)}
    raise HTTPException(409, "Nothing to answer right now.")


@app.post("/api/retry")
@traced
async def retry(body: SessionIn):
    s = get_session(body.session)
    if s["phase"] == "interest":
        return {"screen": await interest_turn(s)}
    if s["phase"] == "jobs":
        return {"screen": await jobs_screen(s)}
    if s["phase"] == "road":
        return {"screen": await road_screen(s)}
    if s["pending_fact"]:
        return {"screen": fact_screen(s, s["pending_fact"])}
    raise HTTPException(409, "Nothing to retry.")


@app.post("/api/job")
@traced
async def pick_job(body: ChoiceIn):
    s = get_session(body.session)
    if not s.get("jobs") or not 0 <= body.choice < len(s["jobs"]):
        raise HTTPException(400, "Bad choice")
    if s.get("job") is not s["jobs"][body.choice]:
        s["road"] = None
    s["job"] = s["jobs"][body.choice]
    s["phase"] = "family"
    nxt = next_family_fact(s)
    if nxt:
        return {"screen": fact_screen(s, nxt)}
    return {"screen": await road_screen(s)}


@app.post("/api/jobs")
@traced
async def back_to_jobs(body: SessionIn):
    s = get_session(body.session)
    if not s.get("jobs"):
        raise HTTPException(409, "No jobs yet.")
    return {"screen": await jobs_screen(s)}


app.mount("/samples", StaticFiles(directory=ROOT / "ui-samples", html=True), name="samples")
app.mount("/", StaticFiles(directory=ROOT / "aira" / "app", html=True), name="ui")
