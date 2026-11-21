# Test log (Nandana)

"Found by" says how it was found. Items from "engine" were found by running the rules in Node, **not yet confirmed in the app**. Fill in the "App result" column when you test. Add new rows below.

| # | Persona | What I did | Expected | App result | Where it goes |
|---|---|---|---|---|---|
| 1 | All 5 | Tapped each persona's 8 answers in the app (Sat 21 Nov, night) and checked the Radar screen | Same eligible / not eligible lists as `test-personas.md` | **Matched for all 5.** Careers screen not checked yet. | none |
| 2 | Selvam (dropout) | **Confirmed in the app** (Careers tab shows Agri-Drone Operator). Also seen in engine: career matcher | Only careers a dropout can start | Agri-Drone Operator appears (needs Class 11-12+). It still scores above 0 (+10 for the farming interest, -8 for education), so the "always show one emerging career" rule adds it. | Gautam / Aira (`matchCareers` in `engine.js`) |
| 3 | Karthik (ITI) | **Confirmed in the app** (Agri-Drone Operator listed before Mobile Phone Technician). Also seen in engine: career matcher | Mobile Phone Technician first | Agri-Drone Operator is first. Mobile Phone Technician's `min_edu` does not include `iti_diploma`, so it loses 8 points. | Pranshu (data: add `iti_diploma` to vocational careers' `min_edu`) |
| 4 | Arjun (Kerala) | Read `app.js` | A Kerala student is treated as Kerala | Every profile gets `state: "TN"`. No question asks for the state. | Aira / Gautam |
| 5 | Any | Read the keyword matcher (`app.js` line 52) | Spoken answers map correctly | Matching uses "contains". `"sc"`, `"st"`, `"bc"` can match inside longer words. "I passed 12th" matches Class 11-12 first. | Aira (matching), me (`conversation.json` uses safer keywords) |
| 6 | All | Voice | Tamil voice works on the demo device | *(fill in)* | Akshaj |
