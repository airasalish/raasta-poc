# Raasta knowledge base: what we have, what the app uses, and why

Read this before the finale on 30 Nov 2026. It explains how Pranshu's knowledge base fits into the app, what we left out on purpose, and how we answer hosting questions.

## 1. What Pranshu built (`raasta-local-db.zip`, 1.74 GB zipped, ~4.5 GB unzipped)

An offline knowledge base built from Citi's own data references. It contains no API keys. It was built on 23 Nov 2026.

| Source (Citi data reference) | Records | What it gives us |
|---|---:|---|
| NCO 2015 (National Classification of Occupations) | 3,450 | Official job titles and codes, plus NSQF level and qualification pack where published |
| National Scholarship Portal | 168 schemes, 18,274 guideline text chunks | Scheme names, ministries, open/close dates, guideline PDFs |
| NAPS (National Apprenticeship Promotion Scheme) | 73,030 openings, 1,253 courses | Real apprenticeship vacancies with employer, city, stipend and qualification |
| SWAYAM + NPTEL | 306 + 3,484 courses | Free online courses with week-by-week outlines |
| Skill India Digital | 2,061 courses | Skill course catalog (includes some test entries) |
| AISHE | 71,750 institutions, 321 statistical tables | College directory by state and district, and national education statistics |
| DIKSHA | 925,122 items | School e-content metadata (board, medium, grade, subject) |

**About 1.1 million records in total.**

It has two parts:
- `db/raasta.db`: a SQLite database with keyword search (1.6 GB).
- `db/chroma/`: semantic-search indexes (2.8 GB). These need Python, PyTorch and a 90 MB embedding model.

Pranshu's `local_db/query.py` searches both.

## 2. What the live app uses now

The app runs on a low-end phone and on Vercel, so it carries a **small slice**: `aira/app/kb_slice.js`, about 15 KB. The slice is cached by the service worker, so it works offline.

It is built by `aira/kb/build_slice.py` straight from `raasta.db`. Nothing is typed in by hand. For each of 12 trade families (stitching/textile, electrical, phone/electronics, appliance repair, food, beauty, health, driving, accounts, computers, dairy/animal, agriculture), it holds:

- **Up to 6 real NAPS apprenticeship openings in Tamil Nadu.** These are:
  - posted in 2026 and still marked open;
  - the newest first;
  - one per employer and job title.
- **Counts:** how many openings there are in Tamil Nadu and across India for 2026.
- **The official NCO 2015 occupation codes** for that trade, with NSQF level where published.

On screen, each route's pathway shows "Real apprenticeships hiring now". This lists the top 3 openings (employer, town, stipend range, minimum qualification and the NAPS opening code to search on the portal), followed by the NCO codes and the source line.

Example for the demo route (textile): **Sewing Machine Operator at Techno Activewear, Perundurai, Erode, ₹6,800–₹12,300 a month**, and Computerized Pattern Stitching Machine Junior Technician in Tiruppur, ₹6,800–₹15,000.

**Deadline on the Radar.** The Central Sector Scholarship (CSSS) card shows "Apply on NSP by 30 Nov 2026". This date comes from the NSP listing in the knowledge base (scheme 28). **87 of the 168 NSP schemes close on 30 Nov 2026, the day of the finale.** Missed deadlines are one way students lose money they were eligible for.

**Scholarship Radar.** The Radar uses Pranshu's 11 hand-checked schemes (`pranshu/server/schemes.py`, checked 21 Nov 2026), not the 168 raw NSP entries. The hand-checked ones have verified amounts and eligibility rules; the raw NSP list does not (see section 3).

## 3. What we left out, and why

| Left out of the phone | Why | When it comes back |
|---|---|---|
| Semantic search (Chroma, 2.8 GB + PyTorch) | Far too big for a phone, and it can't run on Vercel functions (about 250 MB limit) | Server API (section 4) |
| Openings outside Tamil Nadu and before 2026 | The demo student is in Tamil Nadu and the app has no state question yet. Old postings are likely filled. | Per-state slices served by the API |
| The 168 raw NSP schemes (only the CSSS deadline is used) | The raw data has names and dates but no structured eligibility or amounts. Our rules engine must never invent those, so we only use hand-checked schemes. | Each scheme is checked by hand, then added to the rules engine |
| DIKSHA (925k items) | School content for Class 9–10 learning. The demo flow is about careers after Class 12. | "Learn" step: 2–3 DIKSHA resources per route, by grade and Tamil medium |
| SWAYAM / NPTEL (3,790 courses) | Mostly degree-level and in English | "Learn" step for college students |
| Skill India catalog (2,061) | Contains test entries (for example "test course 123") and needs cleaning before students see it | After cleaning |
| AISHE institutions (71,750) | A "nearest college" feature isn't in the demo. The directory dump is older. | "Colleges near you" by district |
| Dairy/animal openings | There are 0 open 2026 NAPS openings in Tamil Nadu for this family | The route still shows the NCO codes |

**How the "best part" was chosen.** We picked the data that changes what the student does next and that we can show truthfully:
- **Real openings** go with the routes the app recommends.
- **Official occupation codes** prove that each route is a recognised job.
- **Checked scheme amounts** show the money the student can get.

Everything else is either too big for a phone, not yet clean enough to show a student, or for a feature the demo doesn't have.

## 4. Hosting

Hosting isn't limited to Vercel. Here is the plan by stage.

| Stage | Where it runs | What runs there |
|---|---|---|
| **Finale (now)** | Vercel, functions in Mumbai (`bom1`) | The app (PWA), the Sarvam voice/chat proxy and the on-device slice. This is proven and fast, and the app already works this way. |
| **Pilot** | One small Linux VM in an Indian region (for example AWS Mumbai, Azure Central India or Oracle Cloud Mumbai) | Pranshu's `LocalKB` behind a read-only API: `/search`, `/openings?state=&family=`, `/slice?state=`. Keyword search needs only SQLite (1.6 GB) and no GPU. Semantic search adds about 2–3 GB RAM. |
| **Government scale** | A MeitY-empanelled cloud or NIC, with voice through BHASHINI or Sarvam behind the same adapter | Nightly refresh from the portals, plus per-state slices pushed to phones when they reconnect |

How the parts fit together:
- **Phone:** a small offline slice for the student's state and interests.
- **Server:** the full 1.1M-record base.
- **Sync:** the phone fetches a fresh slice whenever it is online.

This is the brief's "offline-first with sync" requirement.

**Why we are not running the server live at the finale.** It would be a new component, set up and wired in days before the finale. If it fails on stage, we lose the demo. The slice shows the same real data with no live risk.

## 5. Rebuilding the slice

The slice is a snapshot, so rebuild it whenever there is fresh data.

1. Unzip `raasta-local-db.zip`. Only `db/raasta.db` is needed.
2. Run:

   ```
   python -I aira/kb/build_slice.py <path>/raasta-local-db/db/raasta.db aira/app/kb_slice.js
   ```

3. Bump the `raasta-vNN` cache name in `aira/app/sw.js` and push.

To change the state, the number of openings or the trade families, edit `STATE`, `PER_FAMILY` and `FAMILIES` at the top of the script.

## 6. One-line answers for judges

- **"Is your AI grounded in real data?"** Yes. About 1.1 million records from all of Citi's data references, indexed by our team. The phone carries the slice this student needs: real openings, official occupation codes and checked scholarship amounts, each with its source and date.
- **"Is the data live?"** It's a snapshot from 22–23 Nov 2026. In a pilot, the server refreshes it from the portals and phones sync when online.
- **"Why not put everything on the phone?"** A low-end phone can't hold 4.5 GB, and the student doesn't need it. They need the right 15 KB.
