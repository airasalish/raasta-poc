# Raasta: Product logic and codebase audit

**Scope:** everything under the UI, meaning the conversation, Skill Genome, career matching, Opportunity Radar, voice, offline mode and APIs. Nothing in this audit changes UI components.
**Audited code:** `aira/app/` at commit `12edd34` (live at raasta-poc.vercel.app), compared with `shared/prototype/` and `gautam/backend/`.
**Method:** I read the code, ran the matching and eligibility engines locally on edge-case profiles, and sent the seven conversation test cases to the live `/api/chat`.
**Status:** this is an audit only. Nothing in it has been changed yet; every fix waits for approval.

---

## 1. Existing architecture

```
Browser (PWA, vanilla JS, works on-device)
 ├─ index.html        UI shell + all CSS (v0 / Manus redesign lives here)
 ├─ data.js           QUESTIONS (8), CAREERS (8), OPPORTUNITIES (7), STUDENTS (5 sample), KAVYA
 ├─ engine.js         checkRule / eligibility / matchCareers / talentFlag (identical to shared/prototype/engine.js)
 ├─ app.js            state S, views, conversation (AI + rules fallback), routes, radar, pathway, parent note
 ├─ auth.js           on-device accounts (localStorage, salted SHA-256 PIN), per-user snapshots, teacher class view
 ├─ voice.js          RaastaVoice.listen/speak: Sarvam via /api, else Web Speech; daily budget, Stop button
 ├─ intro.js/.css     intro + extra styling
 └─ sw.js             network-first cache (raasta-v21); skips /api/ and non-GET

Vercel serverless (aira/app/api/, Node) — key only in Vercel env SARVAM_API_KEY
 ├─ chat.js           adaptive conversation turn: extract → decide stage in code → reply
 ├─ routes.js         3 AI career routes from the Skill Genome (+ course search links)
 ├─ understand.js     classify a spoken answer to an option (rules mode)
 ├─ stt.js / tts.js   Sarvam saaras:v4 / bulbul:v3 proxies
 └─ voice-status.js   is Sarvam configured?

Not connected to the live app:
 ├─ gautam/backend/   FastAPI implementing the README contract (/api/profile/chat, /api/careers/match, …)
 └─ nandana/conversation.json  question script (app.js never loads it)
```

**Data flow:** the student talks in `/api/chat`, which returns `updates` (profile fields) and `skills` (free text). These go into `S.profile` and `S.skills`. From there:
- `S.skills` goes to `/api/routes`, which returns the AI routes.
- `S.profile` goes to `eligibility()`, which feeds the Radar.
- `matchCareers(S.profile)` gives the catalogue routes.

After every render, `auth.js` calls `snapshot()`, which saves everything to `localStorage` under the signed-in user.

---

## 2. Existing functionality (verified)

| Area | Works today | Evidence |
|---|---|---|
| Adaptive conversation | Yes, online. It follows up on what the student actually said and doesn't force options | Live test, §3.1 |
| Stage control | Talking about skills (up to 3 turns), then 7 facts in order, each asked once, then a fixed closing message. Hard stop at 12 turns | `api/chat.js`, `app.js` `aiChatTurn` |
| Fact extraction | Each fact must quote the student's own words, which blocks invented age or income | `api/chat.js` |
| Changing an answer | "Sorry, I am actually 17" updated age 16 to 17 | Live test |
| Skill Genome | Free-text skills ("Pigeon training", "Mixie repair") are collected and shown | Live test |
| AI routes | Built from the skills, with a short job name, search links on 9 trusted sites, a real photo when one clearly matches, and Google Images / YouTube links | `api/routes.js`, `jobSee()` |
| Eligibility | Rule-by-rule pass / fail / unknown, with `maybe` when information is missing, a source link, and every scheme labelled "unverified" | `engine.js`, `radar()` |
| Offline | Chat falls back to the tap-through questions; catalogue matching and eligibility run on the device | `toRules()`, `engine.js` |
| Accounts | On-device student and teacher accounts. The class view shows real students by name, with sample students marked | `auth.js` |
| Voice | Sarvam STT and TTS with a daily per-device budget, falling back to browser speech. Stop button, stops on screen change, 10 s listening cap | `voice.js` |

---

## 3. Bugs and inconsistencies

### 3.1 Conversation (live results, `/api/chat`, English)

| Test case | Reply | Extracted | Verdict |
|---|---|---|---|
| Enjoys dancing | Asks who taught them and whether they teach others | skills `Dance`, interests none | Good conversation. **But** "Dance" never reaches the offline engine (§3.3) |
| Repairs fans / mixies | Asks who taught them | skills `Fan repair`, `Mixie repair` | Good. No catalogue career for appliance repair |
| Helps mother cook | Good follow-up | `Cooking`, interests `cooking` | Correct |
| "I don't know what I'm good at" | Asks about a normal day and what people ask their help with | nothing | Correct, and kind |
| Pigeon keeping (unexpected) | Asks how they learned | `Pigeon keeping`, `Pigeon training` | Good |
| Incomplete: "study" | Fine reply | **interests `computers`** | **BUG: invented interest** |
| Changes previous answer | Moves on to gender | age 17, education `c11_12` | Correct, but the change is overwritten silently |

**C-1 (P0): interests skip the quote check.**
- In `api/chat.js`, a bare `interests` value is accepted without checking it against the student's words (`else if (k === 'interests') raw[k] = v;`). This is how "study" became `computers`.
- `app.js` `aiChatTurn` also adds `matchOption(QUESTIONS[0], text)` keyword hits from the raw text, and nothing handles negation. "I don't like computers" would add `computers`.

**C-2 (P1): a fact asked once is never asked again.** If the extractor misses a valid answer, that field stays unknown and the Radar shows `maybe` for good. There's no confirmation step ("So you're in Class 12, right?").

**C-3 (P2): changed answers aren't recorded.** `Object.assign(S.profile, u)` overwrites silently. There's no log of what changed and no "you said 16 earlier, which is right?". Recommendation: keep `S.profileLog = [{field, old, new, turn}]`.

**C-4 (P1): the mode switch is silent.** If `/api/chat` fails twice (15 s timeout each), `toRules()` switches to the tap-through questions mid-conversation without telling the student. They may then see a fixed-option question right after a free conversation.

**C-5 (P2): stage order is fixed.** The facts always come in the order of `FIELDS`. If the student has already mentioned class or age while talking about skills, it is extracted and skipped, which is correct. There's no prioritising, though; for example, education matters more than marks for both matching and eligibility.

**C-6 (P2): `nandana/conversation.json` isn't used.** The questions come from `data.js` `QUESTIONS` (rules mode) and from prompt text (AI mode). The README contract says the UI should load `conversation.json`.

### 3.2 Skill Genome

**G-1 (P0): two separate skill systems.**
- `S.skills`: free text, any language, only from the AI.
- `S.profile.interests`: one of 6 fixed tags (`stitching, drawing, computers, phone_repair, farming, cooking`).

Only `interests` reaches `matchCareers()`, and only `skills` reaches `/api/routes`. A dancer, singer, footballer or appliance repairer has `skills` but no `interests`. Offline, or when `/api/routes` fails, they get careers chosen only by education level.

**G-2 (P2): skill labels are English only.** The AI returns "Dance" or "Shop accounts", and the Tamil UI shows them in English.

**G-3 (P2): no confidence or source per skill.** We can't tell "said once in passing" from "does it every day for neighbours". This is useful for ranking and for the teacher view.

**G-4 (P3): no explicit "unknown".** Fields are either set or `undefined`. "Prefers not to say" (for category or income) is indistinguishable from "never asked" once the `asked` list is lost. `asked` is saved per user in `auth.js`, so this only affects demo sessions.

### 3.3 Career matching (`engine.js` `matchCareers`, run locally)

```
profile                                → result (id:score)
{}                                     → (nothing)
{education:c11_12} (e.g. a dancer)     → fashion_tech:3, garment_supervisor:3, iti_sewing:3, textile_design_digital:3
{interests:[farming]} (no education)   → agri_drone:2, food_processing:2, teacher:2
{interests:[computers], dropout}       → mobile_tech:13, garment_supervisor:3, iti_sewing:3, …
```

**M-1 (P0): order bias.** With no tag match, ties break by array order, so the first four careers (all garment) win. `app.js` `paths()` now filters garment routes for non-stitching students, but the engine itself is still biased, and `gautam/backend` inherits the same logic.

**M-2 (P1): missing education is treated as ineligible.** An unknown `education` gets −8, the same as a wrong level, so a farmer with no class given scores 2 instead of 13. Unknown should score 0, and the student should be asked for it.

**M-3 (P0): the catalogue is too small for real students.** It has 8 careers and 6 tags. There's nothing for music, dance, sport, electrical or appliance repair, driving, beauty, retail or accounts, or healthcare (nursing, ANM). The README target was 25 careers. Without the AI, unexpected skills produce irrelevant careers.

**M-4 (P1): explanations aren't grounded.**
- Catalogue `why` texts are fixed sentences, not derived from the rule that matched. For example, fashion_tech always says "Stitching is real garment-construction skill".
- AI route `why` text is LLM output. It is labelled "AI suggestion, verify", which is honest, but it's still unverified.
- Proposal: return `reasons: [{type:'tag', value:'stitching'}, {type:'education', value:'c11_12'}]` from the engine and build the sentence from those.

**M-5 (P1): `earn` figures are shown as "indicative".** Salary ranges such as "₹15,000-30,000/month" have no source. This conflicts with "never invent salaries". Either cite a source (NCS, PLFS) or hide them.

**M-6 (P2): vocational fairness is only partial.** `matchCareers` forces at least one vocational and one emerging career, which is good. But vocational careers mostly need a `c9_10` or `dropout` match. A `ug` student with practical skills rarely sees them.

### 3.4 Opportunity Radar (`data.js` OPPORTUNITIES)

| Scheme | Source link | Verified | Issue |
|---|---|---|---|
| Pudhumai Penn (TN) | myscheme.gov.in scheme page | no | ₹1,000/month not verified on the official page |
| Central Sector Scheme | scholarships.gov.in (portal home) | no | **R-1:** the rule is `marks_percent ≥ 80`, but the label says "80th percentile". They are different things. The scheme uses percentile |
| Post-Matric BC/OBC | portal home | no | ₹2.5 lakh limit not verified. Tamil Nadu's own BC/MBC scheme differs |
| Post-Matric SC | portal home | no | Same |
| NMMS | education.gov.in/nmms | no | Only `c9_10` passes, so Class 11–12 renewal students show "not eligible" |
| NAPS | apprenticeshipindia.gov.in | no | Age 14 minimum (18 for hazardous trades) isn't modelled per trade |
| PMKVY | skillindiadigital.gov.in | no | Only checks age 15 or older |

- **R-1 (P0):** the Central Sector rule and its label contradict each other (percent vs percentile).
- **R-2 (P0 for honesty):** `verified_by` is `null` for all 7 schemes, so every one is labelled "unverified". This is correct behaviour, but it's a demo risk, and the README lists verification as "not assigned yet".
- **R-3 (P1):** there are no `deadline` or `last_checked` fields, although the README `/api/eligibility` contract includes them.
- **R-4 (P1):** 4 of the 7 source links point to a portal home page, not the scheme's own page.
- **R-5 (P2):** `category` is missing from the questions on `minority`-only schemes (none exist yet). `disability` is never asked, but it's stored as `false` by default, which is *assumed*, not *known*.
- **R-6 (P2):** the `maybe` status doesn't say which answer is missing in a way the student can act on, such as "Tell us your family income to check this one".

### 3.5 Technical integrity

| ID | Priority | Finding |
|---|---|---|
| T-1 | P0 | **Tamil, the primary language, falls back to English** for catalogue career reasons and eligibility rule texts. `data.js` builds `why_i18n` from `{hi, ml}` only, and `localizedRule` has no `ta`. The career `type` labels ("vocational") and "· indicative" are also untranslated. |
| T-2 | P1 | **Two API contracts.** The README and `gautam/backend` define `/api/profile/chat`, `/api/careers/match`, `/api/eligibility`, and others. The live app uses `/api/chat`, `/api/routes`, `/api/understand`, `/api/stt`, `/api/tts` and `/api/voice-status`, with different shapes. The FastAPI backend isn't deployed or used. |
| T-3 | P1 | **No automated tests for the live JS logic.** `gautam/backend/test_engine.py` tests the Python port only. Nothing tests `engine.js`, `api/chat.js` validation or `clean()`. |
| T-4 | P1 | **Voice budget can be bypassed.** It's per device in `localStorage`, and the server has no rate limit, so `/api/*` can be called directly from an allowed origin. iPhone voice is known not to work (out of scope by decision). |
| T-5 | P2 | **Offline gaps.** AI routes and course links need the network, and job photos need Wikimedia. Catalogue routes, Radar and Pathway work offline. The service worker skips `/api/`, which is correct. |
| T-6 | P2 | **Data stays on one phone only** (`localStorage`), with no sync or export. Clearing browser data loses every account. The PIN hash is client-side, which is fine for a demo but not real security. |
| T-7 | P2 | **The parent note is personal only for Kavya.** Other students get a generic "Your child…" text. |
| T-8 | P3 | `voice.js` `playB64` resolves on `pause`. Stopping and immediately speaking again can leave the earlier promise pending (harmless). |

---

## 4. Missing implementations (claimed or contracted, not built)

1. `nandana/conversation.json` isn't loaded (C-6).
2. The README API contract isn't used (T-2).
3. Scheme verification: 0 of 7 schemes verified (R-2).
4. `deadline` and `last_checked` fields are missing (R-3).
5. The catalogue has 8 of the 25 careers targeted and 7 of the 20 opportunities.
6. There's no way for the engine to use free-text skills (G-1).
7. There are no JS tests (T-3).

---

## 5. Recommended improvements

**A. Make the Skill Genome the single source of truth** (keeps the existing shapes).
- Keep `S.profile.interests` (6 tags) and `S.skills` exactly as they are.
- Add `S.skillMap`: `[{label, tag|null, evidence:"<student's words>", turn}]`. The `/api/chat` extractor already returns `skills`; ask it for an optional `tag` too, quote-checked the same way as facts.
- Add an on-device synonym table: dance and music go to a new `performing_arts` tag, fan, mixie and wiring to `electrical`, and so on, so offline matching understands common skills.

**B. Fix the engine without breaking its API.**
- Unknown education should score 0, not −8. Break ties by `type` balance instead of array order.
- Return `matched_on: ['tag:stitching', 'edu:c11_12']` on each career. The UI can ignore it; explanations can use it.
- Add careers for the missing skill families (with sourced pathways only), and drop or source the `earn` ranges.

**C. Harden the conversation.**
- Quote-check `interests` (fixes C-1). Stop the raw keyword merge, or add negation handling.
- When a fact was asked but not caught, ask once more in simpler words, then mark it `declined`.
- Before finishing, read the facts back once ("Class 12, family income about ₹2 lakh, government school. Is that right?"). This turns silent overwrites (C-3) into confirmations.
- When switching to tap mode (C-4), say so: "Network is slow, let's tap through the rest."

**D. Radar honesty.**
- Fix the Central Sector rule label (R-1). Add `deadline`, `last_checked` and `verified_by` once a person checks each page.
- Show "needs: family income" chips for `maybe` results.

**E. Language.** Add Tamil `why` and rule texts (T-1). Translate the career type labels. Translate skill labels in the extractor (ask for `label_local` as well as the English one).

**F. Tests.** Add a tiny Node test script, `aira/app/tests/engine.test.js`, covering the profiles in §3.3, plus `clean()` and the quote check from `api/chat.js`. It should run with `node`, no framework needed.

---

## 6. Priority classification

| Priority | Items |
|---|---|
| **P0 (before any demo)** | C-1 invented interests · G-1 skills not reaching the engine · M-1 order bias · M-3 catalogue gaps (at least performing arts, sport, electrical) · R-1 percentile label · T-1 Tamil fallback |
| **P1 (next)** | C-2 re-ask then decline · C-4 tell the student about the mode switch · M-2 unknown education · M-4 grounded reasons · M-5 unsourced salaries · R-3/R-4 deadlines and deep links · T-2 one API contract · T-3 tests · T-4 server rate limit |
| **P2 / P3** | C-3 change log and read-back · C-5 fact order · C-6 load conversation.json · G-2/G-3/G-4 · M-6 · R-5/R-6 · T-5…T-8 |

---

## 7. Files that need modification (all inside `aira/`)

| File | Changes | Touches UI? |
|---|---|---|
| `aira/app/api/chat.js` | Quote-check interests; optional `tag` / `label_local` per skill; re-ask once; read-back step | No |
| `aira/app/app.js` (logic functions only: `aiChatTurn`, `paths`, `toRules`) | Drop the raw keyword merge; record `skillMap`; announce the mode switch | Text only, no layout |
| `aira/app/engine.js` (the app's own copy) | Unknown education scores 0; tie-break; `matched_on` | No |
| `aira/app/data.js` | New careers and tags; Tamil `why` and rule texts; fixed Central Sector label; `deadline` / `last_checked` fields (left empty until verified) | No |
| `aira/app/api/routes.js` | Return `label_local`; pass `matched_on` context | No |
| `aira/app/tests/engine.test.js` (new) | Engine and validation tests | No |

**Not touched:**
- `shared/prototype/` (read-only)
- teammates' folders (`gautam/`, `nandana/`, `akshaj/`, `pranshu/`). The API contract mismatch (T-2) should be agreed with Gautam, not changed unilaterally.
- `index.html`, `intro.css` and the view templates (v0 owns the UI)

---

## 8. Testing recommendations

1. **Engine unit tests** (Node, no dependencies): the profiles from §3.3, plus every scheme with one rule flipped, to prove pass, fail and maybe.
2. **Conversation regression set:** the 7 cases above, in en, ta, hi and ml. Save the expected `updates` and `skills`, and check after each prompt change. Each run uses about 14 Sarvam calls, so run it before demos, not on every commit.
3. **Negative cases:**
   - "I don't like computers" should not add `computers`.
   - "my brother is 19" should not set `age`.
   - "we earn very little" should not set income.
4. **Offline drill:** turn on airplane mode after a chat. Routes, Radar and Pathway should still render, and the chat should switch to tap mode with a message.
5. **Language drill:** go through every screen in Tamil and list any English left. T-1 shows there is some today.
6. **Personas:** run `nandana/test-personas.md` end to end and log the results in `nandana/test-log.md` (Nandana's folder; ask her to do it).

---

*Prepared from code reading, local engine runs and live API calls on 23 Nov 2026. Each claim above can be traced to a file and line or to a test result listed here.*
