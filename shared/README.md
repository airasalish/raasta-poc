# shared/: read-only baseline

`prototype/` is the working Raasta prototype everyone starts from. It already does the full Kavya journey:
- language pick
- voice/tap chat
- careers
- Opportunity Radar (rules engine)
- pathway
- Parent Mode
- teacher dashboard
- offline mode

**Don't edit files here.** Copy what you need into your own folder and change the copy.

| File | What it is |
|---|---|
| `prototype/index.html` | Page and styles |
| `prototype/app.js` | Screens, voice (Web Speech API), navigation |
| `prototype/engine.js` | Rules engine (eligibility), career matcher, talent flag; runs on the phone |
| `prototype/data.js` | Questions, Kavya's profile, careers, opportunities (**rules not yet verified**), demo students |
| `prototype/sw.js`, `manifest.json` | Offline / installable PWA |

Run it:
```
python -m http.server 5173 --directory shared/prototype
```
