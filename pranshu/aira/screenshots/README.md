# Raasta: Screenshots & Wireframe Archive (Round 2 Deck)
**Target:** Slide 5 (Architecture & Wireframe/POC) & Slide 6 (Live Demo)  
**Lead Designer:** Aira K Salish  

This folder documents the visual screens of the redesigned Raasta application for the Citi India Hackathon presentation deck.

---

## Screen Inventory & Direct Links

When running the local server (`python -m http.server 5173 --directory aira/app`):

| # | Screen Name | URL / Router Route | Key Visual Features for Judges |
|---|---|---|---|
| 1 | **Welcome & Language Pick** | `http://localhost:5173/` | Winding Raasta sunrise vector illustration, 4 language cards with Tamil as prominent featured choice, voice CTA, presenter demo preset button. |
| 2 | **Talk, Don't Type (Voice Chat)** | `http://localhost:5173/?v=talk` | Conversational message bubbles with inline speaker, 72px Voice Orb with animated 5-bar equalizer wave, 2-column tactile answer cards with Lucide icons. |
| 3 | **Skill Genome Drawer** | `http://localhost:5173/?demo=kavya` | Dynamic genome card displaying live collected skill chips (`🧵 தையல்`, `🎂 17`, `📗 Class 11-12`, `🏫 Govt School`, `💰 ₹2L`, `📝 82%`). |
| 4 | **Career Routes** | `http://localhost:5173/?demo=kavya&v=careers` | High-dignity career cards: Vocational (Indigo), Emerging (Gold), Professional (Emerald), Public Sector (Green). Starting earnings badge, personalized "Why" insight block, and "Explore Learning Pathway" CTA. |
| 5 | **Opportunity Radar** | `http://localhost:5173/?demo=kavya&v=radar` | Financial aid banner, 5 eligible schemes with passed checklist (`✔ Gender`, `✔ Govt school`), NMMS failed rule explanation (`✖ Requires Class 9-10`), official gazette links, verified government shield. |
| 6 | **My Pathway ("Raasta")** | `http://localhost:5173/?demo=kavya&v=pathway` | Vertical road timeline with milestone station pins (Week 1–2, 3–4, 5–8) linking to SWAYAM, NIFT, ITI; entrance exams card. |
| 7 | **Parent Mode (Tamil Audio)** | `http://localhost:5173/?demo=kavya&v=pathway` | Warm saffron/amber high-trust card with play/stop audio control, wave animation, and 16.5px readable Tamil transcript explaining duration, safety, cost relief, and earnings. |
| 8 | **Student Profile ("About Me")** | `http://localhost:5173/?demo=kavya&v=profile` | Complete Skill Genome inspection deck, status pill, ⭐ AI Talent Flag explanation, tap-to-edit capability. |
| 9 | **Facilitator Mode (Teacher)** | `http://localhost:5173/?demo=kavya&v=facilitator` | Cohort metrics (5 enrolled, 2 talent flagged, 1 endorsed), filter tabs (`All`, `⭐ Talent Flags`, `✔ Endorsed`), responsive student table with 1-tap "Recommend" button. |

---

## Instructions for Presenter to Export High-Res PNGs for Deck

1. Start the server in your terminal:
   ```powershell
   python -m http.server 5173 --directory aira/app
   ```
2. Open Google Chrome at `http://localhost:5173`.
3. Open Chrome DevTools (`F12`), toggle Device Toolbar (`Ctrl+Shift+M`), select **Samsung Galaxy S20 Ultra** (412 $\times$ 915) or **iPhone 14 Pro** (393 $\times$ 852).
4. Navigate to each route above, press `Ctrl+Shift+P` in DevTools, type `Capture screenshot`, and save the PNGs into this directory:
   - `01_welcome.png`
   - `02_talk_dont_type.png`
   - `03_career_routes.png`
   - `04_opportunity_radar.png`
   - `05_my_pathway.png`
   - `06_parent_mode.png`
   - `07_student_profile.png`
   - `08_facilitator_mode.png`
