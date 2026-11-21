# Test personas (Nandana)

Five test students. Answers are the **exact options to tap**, in question order. "Expected" is what the **rules engine in `data.js` / `engine.js` gives today** (run in Node, not yet in the app). **All 7 scheme rules are still unverified**, so these results will change when Pranshu verifies them. Run each one through the app and write differences in `test-log.md`.

Question order: 1 What do you enjoy? · 2 Age · 3 Class · 4 Girl/Boy · 5 Government school? · 6 Community · 7 Family income · 8 Marks

---
## 1. Kavya (the demo student)
**Answers:** Stitching · 17 · Class 11-12 · Girl · Yes · BC/OBC · ₹1-2.5 lakh · 75-90%
**Say it aloud (optional):** "I stitch clothes for my neighbours."
**Expected scholarships and schemes**
- Eligible: Pudhumai Penn, Central Sector Scheme, Post-Matric (BC/OBC), NAPS, PMKVY
- Not eligible: Post-Matric (SC), NMMS
**Expected careers:** Fashion Technology, Garment Unit Supervisor, ITI Sewing Technology, Digital Textile & Print Designer (includes vocational and emerging). **Talent flag:** yes.

## 2. Selvam (a dropout)
**Answers:** Farming · 19 · Left school · Boy · Yes · General · ₹1-2.5 lakh · Below 50%
**Expected:** Eligible: NAPS, PMKVY. Not eligible: all 5 scholarships. **Talent flag:** no.
**Expected careers:** Food Processing Technician, Garment Unit Supervisor, ITI Sewing Technology, Mobile Phone Technician, Agri-Drone Operator.
⚠ **Looks wrong:** Agri-Drone Operator needs Class 11-12 or above, but a dropout is shown it. See test-log #2.

## 3. Karthik (an ITI learner)
**Answers:** Phone repair · 18 · ITI / Diploma · Boy · Yes · BC/OBC · Below ₹1 lakh · 50-75%
**Expected:** Eligible: Post-Matric (BC/OBC), NAPS, PMKVY. Not eligible: Pudhumai Penn, Central Sector, Post-Matric (SC), NMMS. **Talent flag:** no.
**Expected careers (engine today):** Agri-Drone Operator, then Mobile Phone Technician.
⚠ **Looks wrong:** a phone-repair student should see Mobile Phone Technician first. See test-log #3.

## 4. Arjun (a boy from Kerala)
**Answers:** Computers · 16 · Class 9-10 · Boy · Yes · General · ₹1-2.5 lakh · 75-90%
**Expected:** Eligible: NMMS, NAPS, PMKVY. Not eligible: Pudhumai Penn, Central Sector, Post-Matric (BC/OBC and SC). **Talent flag:** yes.
**Expected careers:** Mobile Phone Technician, Garment Unit Supervisor, ITI Sewing Technology, Food Processing Technician, Digital Textile & Print Designer.
⚠ **Cannot be tested properly:** the app never asks for a state, and `app.js` sets it to Tamil Nadu for every student. Arjun is treated as a Tamil Nadu student. His results are the same either way here (Pudhumai Penn is for girls), but a Kerala state check can't be tested. See test-log #4.

## 5. Divya (an SC girl)
**Answers:** Computers · 18 · Passed 12 · Girl · Yes · SC · ₹1-2.5 lakh · Above 90%
**Expected:** Eligible: Pudhumai Penn, Central Sector, Post-Matric (SC), NAPS, PMKVY. Not eligible: Post-Matric (BC/OBC), NMMS. **Talent flag:** yes.
**Expected careers:** Digital Textile & Print Designer, Mobile Phone Technician, Agri-Drone Operator, Teacher.

---
## Voice phrases to try (the app matches keywords inside what she says)
| Say | Should give | Risk |
|---|---|---|
| "I am SC" / "scheduled caste" | SC | Short words like "sc", "st", "bc" can match inside other words |
| "I passed 12th" | Passed 12 | May become Class 11-12, because "12" matches first |
| "I stopped studying" | Left school | |
| "boy" / "girl" | Boy / Girl | |
| "seventeen" (in words) | 17 | Probably not matched, so she must tap |
