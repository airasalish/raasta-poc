# gautam/: Backend + BHASHINI server side (Gautam)

## Task
Own the **FastAPI backend** and help everyone integrate. A first version is already in `gautam/backend/`:
- `main.py`: the API contract endpoints
- `engine.py`: rules engine
- `llm.py`: adaptive interview with a keyword fallback
- `data.py`
- `test_engine.py`

Review it, run the tests, and own it from here.

## Deliverables by Sat 21 Nov, 6 PM
1. **All endpoints in the root README contract working**, and tested: `pytest` passes.
2. **BHASHINI server side, with Akshaj:**
   - `POST /api/stt` (audio + lang → `{text}`)
   - `POST /api/tts` (`{text, lang}` → audio)
   - Read `BHASHINI_USER_ID` and `BHASHINI_API_KEY` from `.env` (never commit it; add a `.env.example` with empty values).
   - Return clear errors so Akshaj's `voice.js` can fall back to browser voice.
3. **`/api/profile/chat` with a real LLM** (Groq or Gemini free tier, behind the `llm.py` wrapper). Keep the keyword fallback so the demo works without the LLM. **The LLM never decides eligibility.**
4. **Deploy** the backend (Render free tier) and share the URL. Remember it sleeps after 15 min idle, so wake it 5 min before the demo.
5. `gautam/backend/README.md`: how to run it, its env variables, and the endpoint list.

## Run
```
cd gautam/backend
pip install fastapi uvicorn pydantic pytest
uvicorn main:app --reload --port 8000
pytest
```

## Helping others
- Akshaj: BHASHINI calls.
- Aira: connect the UI to the API (set `API_BASE`).
- Nandana: use her `conversation.json` lines in `/api/profile/chat` replies.
