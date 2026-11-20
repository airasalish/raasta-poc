# Raasta: Proof of Concept

**Team Absolute Zero · SRM Institute of Science and Technology, Chennai · Citi India Hackathon (Ada Lovelace Day), Round 2**

"Google Maps for careers" for rural India. A student talks in her own language, and Raasta shows careers that fit her, scholarships she actually qualifies for (with official sources), a week-by-week pathway, a voice note for her parents, and a teacher dashboard. It works on a cheap phone, even offline.

---

## How this repo works

**Everyone works ONLY inside their own folder.** Nobody edits anyone else's folder or `shared/`. At the end (Sat 21 Nov), we compile everything into `final/`.

| Folder | Owner | Works on |
|---|---|---|
| `aira/` | Aira (Lead) | Full UI/UX of the app: every screen, the design system, polish |
| `nandana/` | Nandana | Voice mode: the conversation (what Raasta asks and says), voice states and flow, testing |
| `akshaj/` | Akshaj | Voice engine: BHASHINI speech-to-text and text-to-speech integration (`voice.js`) |
| `gautam/` | Gautam | Backend (FastAPI), BHASHINI server side (`/api/stt`, `/api/tts`), helps everyone |
| `pranshu/` | Pranshu | Roadmap: Round 3 plan, production architecture, roadmap slides |
| `shared/prototype/` | Read-only | The working baseline prototype. **Copy it into your folder; don't edit it here.** |
| `final/` | Aira (Sat) | The compiled app we demo on Mon 23 Nov |

Each folder has a `README.md` with that person's exact task, deliverables and the **interface** they must follow so compilation is easy.

## How the pieces fit at the end

```
final/
  frontend/   <- Aira's UI (aira/)
                + Akshaj's voice.js (akshaj/)
                + Nandana's conversation script (nandana/conversation.json)
  backend/    <- Gautam's FastAPI (gautam/backend/), including /api/stt and /api/tts
  docs/       <- Pranshu's roadmap + architecture (pranshu/)
```

**The contracts everyone must follow:**
- **Voice (Akshaj → Aira):** `voice.js` exposes `window.RaastaVoice = { listen(lang) → Promise<text>, speak(text, lang) → Promise<void>, isOnline() }`. The UI only calls these two functions.
- **Conversation (Nandana → Aira, Gautam):** `nandana/conversation.json` holds every question, option, follow-up and error message in `en`, `ta`, `hi` and `ml`, using the same `key`s as `shared/prototype/data.js` (`QUESTIONS`).
- **Backend (Gautam → everyone):** the API contract below. Don't rename fields.

```
POST /api/profile/chat      {student_id, lang, message}        -> {reply_text, profile, done}
POST /api/careers/match     {profile}                          -> [{career_id, title, type, why, earning_range}]
POST /api/eligibility       {profile}                          -> [{opportunity_id, name, status, reasons:[{rule, passed, text}], benefit, deadline, source_url, last_checked}]
POST /api/pathway           {profile, career_id}               -> {weeks:[...], exams:[...], institutions:[...]}
POST /api/parent-script     {profile, career_id, lang}         -> {text}
GET  /api/facilitator/students                                 -> [{student_id, name, top_career, eligible_count, talent_flag, recommended}]
POST /api/facilitator/recommend {student_id, opportunity_id, note} -> {ok}
GET  /api/offline-pack                                         -> {opportunities, careers, version}
POST /api/stt               audio file + {lang}                -> {text}
POST /api/tts               {text, lang}                       -> audio (wav/mp3)
```

## Rules
1. **Only touch your own folder.** Need something from someone? Ask in the group.
2. **Never commit API keys or passwords.** Keys go in a local `.env` file, which `.gitignore` already blocks.
3. **Never make up scheme facts, statistics or quotes.** Every scholarship rule needs its official link.
4. Commit small and often, with clear messages, e.g. `akshaj: add BHASHINI tts call`.
5. **Feature freeze: Sat 21 Nov, 9 PM.** After that, bug fixes only.
6. Post one line in the group every night: done / blocked / next.

## Timeline
| Day | Goal |
|---|---|
| Fri 20 Nov | Everyone sets up their folder and starts |
| Sat 21 Nov | Pieces done by 6 PM, compilation into `final/` from 6-9 PM, **freeze at 9 PM** |
| Sun 22 Nov | 3 timed rehearsals, backup demo video |
| Mon 23 Nov | **Demo, 11:00 AM-2:00 PM** (10 min plus 5 min Q&A) |

## Run the baseline prototype
```
python -m http.server 5173 --directory shared/prototype
```
Open http://localhost:5173 in Chrome, tap **தமிழ்**, then **▶ Demo: Kavya's answers**.

## Not assigned yet
- Verifying every scholarship rule in `shared/prototype/data.js` on its official page (currently **placeholders**). Aira to assign.
- Deck (8 slides) and backup demo video. Aira to assign.
