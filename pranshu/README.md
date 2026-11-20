# pranshu/: Roadmap (Pranshu)

## Task
Own Raasta's **roadmap**: where it goes after this POC, and how it runs for real at scale. This feeds slides 5 and 8 of the deck and the Q&A ("What would you build in Round 3?", "How does this scale?").

## Deliverables by Sat 21 Nov, 6 PM
1. **`roadmap.md`:** phases with goals, features and success measures:
   - **Now (Round 2 POC):** what's built, honestly.
   - **Round 3 (24-29 Nov):** Someone Like Me, Apply-Assist, partner listings, Hindi and Malayalam, full BHASHINI.
   - **Pilot (6 months):** 5,000 students, 100 facilitators, 2 Tamil Nadu districts; targets from the Round 1 submission (First Rupee 25% in 90 days, 70% profile completion, 40% apply in 60 days, 35% active at 30 days, 30% of facilitators publish a module).
   - **Scale:** more states and languages, B2G rollout, Earn While You Learn, UPI teacher modules, DigiLocker, ONEST/Beckn.
2. **`architecture.md` plus a diagram (PNG or SVG):** the production architecture:
   - PWA (offline pack) ↔ API ↔ LLM / rules engine / knowledge base
   - voice via BHASHINI and **VoicERA** (the government's open-source voice stack: https://github.com/COSS-India/voicera_mono_repository)
   - partner APIs
   - Mark clearly what's **built now** versus **planned**.
3. **`roadmap-slides.md`:** the exact text for (a) a roadmap slide and (b) the "next steps" part of the Outcomes slide. Short bullets.
4. **`risks.md`:** the top risks per phase and their mitigations (hallucination, dialect accuracy, connectivity, stale scheme data, minors' privacy under the DPDP Act, adoption, cost).

## Rules
- Business numbers from Round 1 are **estimates**; label them "estimated".
- Don't invent statistics. Cite a source or leave it out.
- Keep it realistic. Judges reward honest, achievable plans.
