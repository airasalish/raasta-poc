# aira/: UI/UX (Aira, Lead)

## Task
Design and build the **full UI/UX** of Raasta: professional, minimal, warm, and usable by low-literacy students on cheap Android phones. Tamil first.

## Start
1. Copy `shared/prototype/*` into `aira/app/`.
2. Follow the full design brief: `UI_UX_BRIEF.md` (in this folder).

## Screens
1. Welcome and language pick
2. Talk, Don't Type (voice chat)
3. Your Routes (careers)
4. Opportunity Radar (scholarships)
5. My Pathway
6. Parent Mode
7. Profile ("About me")
8. Facilitator Mode (teacher dashboard)
9. Offline banner, loading, empty and error states

## Must plug in (don't build these yourself)
- **Voice:** call only `RaastaVoice.listen(lang)` and `RaastaVoice.speak(text, lang)`. Akshaj delivers `akshaj/voice.js`. Until then, keep the Web Speech code from the prototype behind those same two function names.
- **Conversation text:** load the questions from `nandana/conversation.json` (same keys as `QUESTIONS` in `data.js`).
- **Data and logic:** keep `engine.js` and the data shapes unchanged. The backend (Gautam) uses the same API contract (see the root README).

## Deliverables by Sat 21 Nov, 6 PM
- [ ] `aira/app/`: all screens, the Kavya path polished end to end
- [ ] `aira/design/`: design proposal, design system (colours, type, components), flow map
- [ ] `aira/screenshots/`: every screen (for the deck's wireframe/POC slide)
- [ ] Tested at 360px, 412px and laptop width; Tamil and English; light and dark; offline
