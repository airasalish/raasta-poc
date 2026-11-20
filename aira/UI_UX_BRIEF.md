# UI/UX Brief: Raasta (paste this into Antigravity as your first prompt)

You are the lead product designer and frontend engineer for **Raasta**, our Round 2 entry in the Citi India Hackathon (Ada Lovelace Day). I own the **entire UI/UX**. Your job is to **think like a senior designer first, then build**. Don't just restyle what exists: question it, research good patterns, and propose the best **professional, minimal, warm** experience for our users, then implement it.

Read these files in this folder before doing anything:
- `../HANDOFF_FULL_CONTEXT.md` (local only, not in the repo): the full project context (problem, features, scope, team, deadlines)
- `shared/prototype/`: the current working prototype (read-only baseline; copy it into `aira/app/`) (`index.html`, `app.js`, `engine.js`, `data.js`, `sw.js`)
- `README.md` (team folders, contracts) and `aira/README.md` (my task)
- **Work ONLY inside `aira/`.** Never edit other people's folders or `shared/`.

---

## 1. What Raasta is (30 seconds)
"Google Maps for careers" for rural Indian students (Class 9 to graduation). A student **talks in Tamil** (or English, Hindi or Malayalam), and Raasta builds their profile. It then shows:
- careers that fit them, including vocational and non-STEM ones
- scholarships they **actually qualify for**, with the official source
- a week-by-week learning pathway
- a voice note for their parents (Parent Mode)
- a teacher dashboard (Facilitator Mode)

It must work on a **₹5,000 Android phone**, on **slow or no internet**.

**Demo persona: Kavya, 17**, Class 12, Villupuram (Tamil Nadu). She studied in a government school, her family earns under ₹2.5 lakh, and she stitches clothes for neighbours. The whole demo is her journey, so it must feel flawless.

## 2. Who we design for (think hard about these people)
- **Kavya:** a first-time smartphone user for anything "official". She may read slowly, and is more comfortable speaking than typing. She's shy, can be intimidated by English and forms, and is curious.
- **Her parents:** may not read at all. They decide whether she studies further, especially as a girl, so they need trust, cost and safety, explained in Tamil by voice.
- **A village teacher (facilitator):** runs 60+ students on one shared phone, is busy, and needs to scan a list fast and act in one tap.
- **The judges (Citi):** they see a 4-minute live demo on a laptop screen share. It must **look professional and instantly clear** on a phone frame.

## 3. Hard constraints (non-negotiable)
1. **Low literacy first:** icons and pictures plus short words; voice everywhere (🎙️ to speak, 🔊 to hear any screen read aloud). Every question can also be answered by **tapping a big icon**. Never rely on text alone.
2. **Tamil-first typography:** Tamil script is long and tall. Use a proper Tamil font (e.g. Noto Sans Tamil or Mukta Malar via Google Fonts, with a system fallback), generous line height, no clipped text, buttons that grow with the text. Test every screen in Tamil, not just English.
3. **Cheap phones:** 360px-wide screens first; tap targets at least 48px; no heavy animation libraries; fast first load; works offline (keep the service worker and cache).
4. **Accessible:** WCAG AA contrast, readable in sunlight (strong contrast), a visible focus state, don't use colour alone (✅/❌ plus words), screen-reader labels.
5. **Trust signals:** every scholarship shows **why** (each rule as passed or failed) and an **official source link**. Unverified data shows a clear "verify" badge. Never let the UI look like the AI is guessing.
6. **Offline states:** a calm, clear "You're offline, saved info still works" banner; nothing breaks. Voice needs internet; tapping still works offline.
7. **No logins, no forms** in the student flow. A conversation, not a form.
8. **Don't break the logic:** keep `engine.js` (rules engine and matcher) and the data shapes in `data.js` working. Voice: call only `RaastaVoice.listen(lang)` / `RaastaVoice.speak(text, lang)` (Akshaj delivers `akshaj/voice.js`; until then wrap the prototype's Web Speech code under those names). Conversation text comes from `nandana/conversation.json` once it exists. The API contract in `README.md` must stay compatible, because the backend team (Gautam) is building it now. You may restructure the UI code freely.

## 4. Screens and flows to design (my full scope)
Student app:
1. **Welcome + language pick:** Tamil / English / Hindi / Malayalam; very warm, one tap.
2. **Talk, Don't Type (voice chat):** a conversational feel; a big mic button with clear listening, thinking and speaking states; icon answer chips; live "profile chips" filling in as she talks; a progress feel (how far along she is) without a scary form-style progress bar.
3. **Your Routes (career matches):** career cards with type tag (vocational, professional, emerging, govt), a one-line "why it fits you", indicative earnings, and "See pathway". Make vocational careers feel as respected as professional ones.
4. **Opportunity Radar (scholarships):** grouped Eligible / Maybe / Not eligible; benefit amount first; reasons as ✅/❌ lines; official link; "verify" badge; deadline if present.
5. **My Pathway:** week-by-week steps as a simple vertical route or "road" (we're called Raasta, meaning "the path"; use that metaphor tastefully), with exams and resources.
6. **Parent Mode:** one big "Play for my family 🔊" moment; a large-text transcript; feels like a respectful message to the parents.
7. **Profile / "About me":** the chips she built, editable by tapping.

Facilitator app:
8. **Teacher dashboard:** a student list; talent flag ⭐; top route; eligible count; one-tap **Recommend**; filter or sort; works on a phone and looks great on a laptop.

Global:
9. Bottom navigation, the offline banner, empty, loading and error states, and the onboarding hint (first-time tooltip for the mic).

## 5. Design direction (decide yourself, but justify it)
I want **professional + minimal + warm + Indian**, not a generic SaaS template and not cluttered or "government-portal" looking. Before building, **think and propose**:
- 2-3 visual directions (mood, colour palette with hex, type scale, corner radius, iconography style, illustration or no illustration), each with a one-line rationale tied to our users. Recommend one.
- A small **design system**: colour tokens (light and dark), spacing scale, type scale (including Tamil sizes), components (button, chip, card, status pill, mic button, banner, nav, list row), with states.
- An **information architecture and flow map** of the Kavya journey (fewest taps from welcome to scholarship proof to Parent Mode).
- Micro-interactions that help understanding (mic pulse, chips popping in, a step-by-step pathway reveal), all lightweight and respecting `prefers-reduced-motion`.
- Icon choice: a consistent open-source icon set (e.g. Lucide or Phosphor, inline SVG) instead of mixed emoji, **unless** you argue emoji is better for low-literacy recognition. Decide and explain.

Ask me only if a choice is truly mine to make (for example brand colour preference). Otherwise use your judgement and tell me what you chose.

## 6. Tech guidance
- The current prototype is vanilla HTML/CSS/JS, with no build step. You may keep it vanilla (simplest, fastest, works offline) **or** move to React + Vite + Tailwind if you think it's clearly better and can finish by **Sat 21 Nov, 9 PM** (feature freeze). Explain the trade-off and pick one.
- Keep it a PWA (manifest plus service worker) so it installs and works offline.
- Keep all colours as CSS variables (tokens) with dark mode.
- Voice: keep the existing Web Speech API code as the default. Structure it so `speak()` and `listen()` can later call our backend `/api/tts` and `/api/stt` (Sarvam/BHASHINI) **without UI changes**.
- Keep text in a translation map (en / ta / hi / ml) so adding a language is a data change, not a code change.

## 7. Deliverables (in this order)
1. **Design proposal** (a short markdown in `aira/design/`): the directions, your recommendation, the design system, the flow map, key decisions with reasons.
2. **Implementation** of all screens in Section 4, in `aira/app/`, with Kavya's demo path polished end to end.
3. **A demo mode:** the "▶ Demo: Kavya" one-tap fill must still exist, but make it subtle, since it's for the presenter.
4. **QA pass:** test at 360px, 412px and laptop width, in Tamil and English, in light and dark, and offline (DevTools offline); fix overflow and clipping; check contrast.
5. **Screenshots** of every screen (for the deck's wireframe/POC slide) (save in `aira/screenshots/`) plus a short `aira/design/UI_NOTES.md` explaining the design for the judges (3-5 bullet points on *why* it suits rural, low-literacy users).

## 8. Definition of done
- A first-time user can finish the Kavya journey **without reading English** and without help.
- The Kavya journey is 3.5 minutes or less in the live demo, with zero visual glitches.
- It looks like a polished, real product in a 10-minute pitch, and judges "get it" in 5 seconds per screen.
- Nothing in the eligibility logic or data shapes is broken; the backend can plug in later.

## 9. Rules
- Never invent scholarship facts, statistics or quotes in UI copy. Use what's in `data.js` and keep its "verify" badges.
- Keep feature names exactly: **Talk, Don't Type · Someone Like Me · Parent Mode · Opportunity Radar · Apply-Assist · Connect & Earn · My Pathway · Earn While You Learn · Facilitator Mode**.
- Small, frequent commits to GitHub; never commit API keys.
- Today is Fri 20 Nov 2026. Feature freeze is **Sat 21 Nov, 9 PM**. The demo is **Mon 23 Nov, 11 AM**. Prioritise accordingly: polish the Kavya path first, everything else second.

**Start by reading the files, then give me your design proposal (Deliverable 1) before writing UI code.**
