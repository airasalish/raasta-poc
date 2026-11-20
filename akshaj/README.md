# akshaj/: Voice engine, BHASHINI (Akshaj)

## Task
Make Raasta **hear and speak Tamil (and English, Hindi, Malayalam) using BHASHINI**, the Government of India's language AI. Deliver one drop-in file, `voice.js`, that the UI uses. Gautam builds the server side (`/api/stt`, `/api/tts`) with you.

## How it works
```
Phone: tap mic -> record audio (MediaRecorder) -> POST /api/stt (Gautam's server) -> BHASHINI -> text back
Phone: text -> POST /api/tts -> BHASHINI -> audio back -> play it
```
**The API key stays on the server only**, never in `voice.js` and never in GitHub.

## BHASHINI access (do first, today)
1. Register: https://bhashini.gov.in/ulca/user/register, then verify your email (check spam).
2. Log in, go to **My Profile**, click **Generate**, and enter an app name (lowercase, underscores). You get a **User ID** and an **API key**.
3. Give both to Gautam **privately**. They go in the server's `.env` file, never in the repo.
4. Read the docs: https://bhashini.gitbook.io/bhashini-apis/ (pipeline config call, then compute call for ASR = speech-to-text and TTS = text-to-speech).

## Deliverable: `akshaj/voice.js` (by Sat 21 Nov, 6 PM)
It must expose exactly this, so Aira's UI can plug it in:
```js
window.RaastaVoice = {
  listen(lang)        // "ta" | "en" | "hi" | "ml" -> Promise<string> (what she said)
  speak(text, lang)   // -> Promise<void> (resolves when audio finishes)
  isOnline()          // -> boolean
};
```
Requirements:
- **Fallback:** if `/api/stt` or `/api/tts` fails or is slow (over 6 seconds), automatically fall back to the browser's Web Speech API. The code for that is already in `shared/prototype/app.js` (`listen()` / `speak()`). The demo must never get stuck.
- Show nothing yourself. Just return results; the UI handles visuals. You can fire events like `voice:listening`, `voice:thinking` and `voice:speaking` on `window` so the UI can animate.
- Ask for mic permission nicely; handle "permission denied" by rejecting with a clear error.
- Test on a **real Android phone in Chrome**, in Tamil.
- `akshaj/demo.html`: a tiny test page with a mic button and a speak button to prove it works.

## If BHASHINI isn't ready by Sat 2 PM
Keep the Web Speech fallback as the main path, and tell Aira and Gautam. We demo with that. (Optional backup: Sarvam AI, ₹100 free credits; ask Aira first.)
