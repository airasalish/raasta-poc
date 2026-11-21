# Voice mode states (Nandana)

How the screen and voice behave in each state of "Talk, Don't Type". Lines marked *(line)* come from `conversation.json`. Akshaj's `voice.js` fires `voice:listening`, `voice:thinking` and `voice:speaking` on `window` so the UI can switch state.

| State | What she sees | What she hears | What she can do |
|---|---|---|---|
| **Idle** | The question in big text, big icon options, a big mic button, a small "Listen" button | The question is read aloud once *(ask)*. Then quiet. | Tap an option, tap the mic to speak, tap "Listen" to hear the question again |
| **Listening** | Mic button pulses, the word "Listening…", options stay visible | Nothing (an optional soft tick when the mic opens) | Speak, or tap an option instead. Tap the mic again to cancel. |
| **Thinking** | A small spinner and "One moment", options stay visible and tappable | Nothing. If it takes over 6 seconds, the app switches to the browser voice (Akshaj's fallback). | Tap an option without waiting |
| **Speaking** | Sound-wave icon. The matched answer is highlighted, then the next question appears. | Short confirmation *(confirm)*, then the next question *(ask)*. After question 4: *(encouragement)*. At the end: *(closing)*. | Tap to skip the voice and answer the next question |
| **Didn't understand** | The mic shakes once. The message appears. The options pulse softly so she sees where to tap. | *(not_understood)*. On the second miss in a row, the simpler question *(reask)*. | Tap an option, or try speaking again |
| **No internet** | Small "OFFLINE" badge. Mic greyed out. Options fully tappable. | *(offline)*, said once when it happens | Tap answers. Eligibility and saved routes still work offline. |
| **Mic permission denied** | Mic hidden. A short note: "Tap your answers instead." | *(mic_denied)* | Tap answers. A "Try mic again" button in the note. |

## Rules for all states
- **Tapping always works.** Voice is a shortcut, never a requirement.
- **Never leave her stuck.** If voice fails twice in a row, stop asking her to speak and show only the options.
- Each spoken line is under about 15 words.
