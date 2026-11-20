# final/: Compiled demo (Sat 21 Nov, 6-9 PM)

Leave this folder empty until compilation. On Saturday, Aira assembles:

```
final/
  frontend/   <- aira/app/ + akshaj/voice.js + nandana/conversation.json
  backend/    <- gautam/backend/
  docs/       <- pranshu/ (roadmap, architecture) + aira/design/ + aira/screenshots/
```

## Compilation checklist
- [ ] Copy Aira's UI into `final/frontend/`
- [ ] Add `<script src="voice.js">` (Akshaj) before the app script; the UI calls `RaastaVoice.listen` and `RaastaVoice.speak`
- [ ] Load `conversation.json` (Nandana) for questions and replies
- [ ] Set `API_BASE` to Gautam's deployed backend URL
- [ ] Run the full Kavya journey: Tamil voice, careers, Radar (click an official link), pathway, Parent Mode, airplane mode, teacher dashboard
- [ ] Run Nandana's 5 test personas
- [ ] Check the voice fallback (turn off the backend; Chrome voice still works)
- [ ] Feature freeze at 9 PM
