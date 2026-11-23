# Engineering changelog: product logic (23 Nov 2026)

All work is in `aira/` (plus the root README, on request). Commits are on `main`, and Vercel deploys `aira/app` automatically on push. Every change below was **tested locally** (`node aira/app/tests/run-all.js`, 52 tests) and **checked on the live site** (raasta-poc.vercel.app) unless it says otherwise.

## Completed

| # | Change | Why it matters | Commit | Live check |
|---|---|---|---|---|
| 1 | **Interests need the student's own words.** Bare or unquoted interests from the model are dropped, and the raw keyword merge on the client is removed. | "study" no longer turns into `computers`, and "I don't like computers" no longer adds `computers`. | `30feaf7` | ✅ live `/api/chat` |
| 2 | **Skills reach matching.** Free-text skills are mapped to tags by `skillTags()`. | A dancer, footballer or fan-repairer now gets relevant routes, including offline. | `30feaf7`, `29c74e2` | ✅ dancer gets Music/Dance in Tamil |
| 3 | **Matching without bias.** No guessing with no skills known; unknown education gets no penalty; ties broken by matches rather than list order. | Students were being pushed towards garment careers. | `30feaf7` | ✅ tests |
| 4 | **New skill families (9 careers):** electrical, appliance repair, music/dance, sports, driving, beauty, accounts, care, animals. Official links only, no salaries. | Covers common rural skills that the 8-career catalogue missed. | `30feaf7`, `29c74e2` | ✅ tests |
| 5 | **Central Sector rule label** now says *approx. 80%* and explains that the scheme uses the top 20 percentile. | The label said "percentile" but the rule checked percent, a factual contradiction. | `30feaf7` | ✅ tests |
| 6 | **Tamil everywhere:** career reasons, scheme names and benefits, every rule, type labels, pathway steps, tab bar, Radar title, Parent label. Hindi and Malayalam for the same items. | Tamil, the primary language, was falling back to English. | `30feaf7`, `c28f4c2` | ✅ every screen swept in ta/hi/ml |
| 7 | **Answer recovery:** a fact that wasn't caught is asked once more in simpler words with an example and "fine to skip". A second miss, or a refusal in any of the 4 languages, means move on. The stage is decided in code by `decide()`. | Facts were silently lost, or the student was nagged. | `cfa7f93` | ✅ Tamil re-ask; "I don't want to say" respected |
| 8 | **Fallback is announced:** if the AI is unreachable, the student is told "network is slow, let's continue by tapping; nothing is lost". | The switch to tapping used to be silent and jarring. | `cfa7f93` | ✅ tests (502 path) |
| 9 | **Radar explains itself:** each scheme says *Looks like a match*, *Need more information: family income, marks*, or *Not a match: rule*. | "Maybe" used to give no next step. | `875bedc` | ✅ Tamil |
| 10 | **No unsourced salary figures** on route cards. | The "never invent salaries" rule. | `875bedc` | ✅ no ₹ on routes |
| 11 | **Per-IP rate limit** on every Sarvam endpoint (40/min by default, `RATE_PER_MIN`), returning 429. | One client could drain the voice/AI credits. | `01b86dc` | ✅ tests; normal use unaffected live |
| 12 | **Tests:** `engine`, `skills`, `chat` (Sarvam mocked) and `api`, plus `run-all.js`. 52 tests, no network needed. | Regression safety for demo-day changes. | `30feaf7` … `01b86dc` | ✅ all passing |
| 13 | **README and GitHub page:** product README, architecture diagram, try-it guide; repo description and topics. | First impression for judges and reviewers. | `1df5a3a` | ✅ renders on GitHub |

Earlier the same day (UX, before the audit): Stop button for voice, chat end card, job photos and links, phone back button and Back buttons, real student names in the School view, no "Kavya" leaks for other users.

## Remaining blockers and external dependencies

| Item | Blocked on | Notes |
|---|---|---|
| **Verify the 7 schemes** (rules, amounts, deadlines, deep links) | A person checking each official page | Everything stays labelled "unverified" until then. Add `verified_by`, `last_checked` and `deadline` to `data.js` per scheme. |
| **One API contract** | **Gautam** | The live app uses `/api/chat` and `/api/routes`; the README contract uses `/api/profile/chat` and the rest. Proposal: keep the live endpoints and add contract-shaped adapters in `aira/app/api/` once Gautam agrees on the field names. |
| **`nandana/conversation.json`** | **Nandana** | Not loaded by the app. The AI conversation is adaptive by design, but the tap-through fallback could read its questions from that file. |
| **Skill chip labels are English** (G-2) | Product decision | The extractor returns English labels. A translated label needs a model change (extra tokens per turn). |
| **iPhone voice** | Out of scope (team decision) | Browser voice fallback still works for reading text aloud. |
| **Data is per phone** | Backend sync | Accounts live in `localStorage`. This is fine for a shared school phone; real deployments need the backend. |
| **Personal parent note** | Sarvam credits / recording | Kavya has a recorded Tamil note. Other students get a generated generic note. |

## How to verify

```bash
node aira/app/tests/run-all.js
```
Then on the live site: Tamil → New student → say *"I train pigeons"*, then give an unclear age, then *"I don't want to say"* for income → check Routes, Radar ("Need more information: …") and Path (steps in Tamil).
