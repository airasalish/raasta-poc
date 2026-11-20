# nandana/: Voice mode (Nandana)

## Task
Own the **voice mode experience** of "Talk, Don't Type": **what Raasta says, asks and replies** during the ~10-minute voice chat, and how the voice mode behaves. Akshaj builds the voice engine (BHASHINI); Aira builds the screens; **you design the conversation and test it.**

## Deliverables by Sat 21 Nov, 6 PM
1. **`conversation.json`:** the full conversation script, in **English and Tamil** (Hindi and Malayalam if time allows).
   - Use the same `key`s as `QUESTIONS` in `shared/prototype/data.js`: `interests, age, education, gender, govt_school, category, family_income_lakh, marks_percent`.
   - For each question:
     - the question
     - a simpler re-ask if she doesn't understand
     - a friendly confirmation ("Got it, you're in Class 12!")
     - the answer options and the words she might say for each (keywords)
   - Also add:
     - a greeting
     - an encouragement line in the middle
     - "I didn't catch that, please tap one below"
     - "You're offline, you can still tap"
     - a closing line
   - Format:
   ```json
   {
     "greeting": {"en": "...", "ta": "..."},
     "questions": [
       {"key": "education",
        "ask": {"en": "Which class are you in?", "ta": "..."},
        "reask": {"en": "...", "ta": "..."},
        "confirm": {"en": "Got it!", "ta": "..."},
        "options": [{"v": "c11_12", "en": "Class 11-12", "ta": "11-12 வகுப்பு", "kw": ["12", "twelve", "பன்னிரண்டு"]}]}
     ],
     "not_understood": {"en": "...", "ta": "..."},
     "offline": {"en": "...", "ta": "..."},
     "closing": {"en": "...", "ta": "..."}
   }
   ```
2. **`voice-mode-states.md`:** what the screen and voice do in each state:
   - idle
   - listening
   - thinking
   - speaking
   - didn't understand
   - no internet
   - mic permission denied

   Keep it short: a table with columns state / what she sees / what she hears / what she can do.
3. **`test-personas.md`:** 5 test students (Kavya, a dropout, an ITI learner, a boy from Kerala, an SC girl), with the exact answers to give and what we expect to see. Run them through the app and write down anything wrong in `test-log.md`.

## Tips
- Write how a kind older sister would talk: short, warm, no English jargon.
- Keep each line under about 15 words, because it will be spoken aloud.
- **Don't invent scholarship facts.** Only conversation lines.
