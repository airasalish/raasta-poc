# RAASTA — Field Atlas Visual Guide

**Scope:** Visual asset system for the existing RAASTA application and live presenter environment  
**Owner:** Aira UI/UX  
**Status:** Integration guide; no existing UI components or data contracts are changed  
**Last updated:** 23 November 2026

## 1. The visual idea

RAASTA is a field atlas: a student does not browse a catalogue of abstract possibilities; she finds a route from what she already knows to a next step she can explain to her family. The visual language should therefore feel **editorial, navigational, Indian, and quietly premium**.

The interface must not look like a chatbot, a worksheet, or a stock-photo education portal. It should feel like a dependable map printed for a real journey: clear landmarks, honest source notes, enough warmth to invite a first step, and no decoration that competes with the route.

The phone simulator remains the hero in the desktop presentation. The surrounding Field Atlas environment is a calm, layered context—not a second product.

## 2. Brand palette

Use colour by semantic role rather than as decoration. Keep large surfaces quiet and reserve the strongest contrast for route decisions, primary actions, focus states, and verified source treatment.

| Token | Hex | Role | Use |
|---|---:|---|---|
| `--atlas-forest` | `#0B382B` | Primary forest | Brand mark, primary action, device bezel accents, high-emphasis route elements |
| `--atlas-emerald` | `#145640` | Deep emerald | Headings, active route, selected states, desktop environment depth |
| `--atlas-jade` | `#3F805C` | Jade signal | Progress, active nodes, supportive links, live state |
| `--atlas-sage` | `#DCE9D9` | Muted sage | Quiet route surfaces, illustration fields, selected-but-not-primary backgrounds |
| `--atlas-ivory` | `#F8F2E5` | Warm ivory | Primary presentation canvas and light reading surfaces |
| `--atlas-ink` | `#15271F` | Near-black green | Body text and strongest headings |
| `--atlas-muted` | `#66756B` | Secondary ink | Supporting copy, metadata, captions |
| `--atlas-amber` | `#C9A65B` | Restrained marker | Route destination, attention state, focus ring companion, not a general highlight colour |
| `--atlas-line` | `#C8D5C9` | Structural line | Dividers, contour lines, illustration construction lines |

### Contrast rules

- Body copy must remain near-black green or a tested equivalent on ivory/sage surfaces.
- Amber is a marker, not body text. Never use it for small text on ivory.
- Jade and emerald must not be the only indicator of status; pair them with a label, route position, icon, or shape.
- Keep the desktop background lower contrast than the phone UI. The device screen must win immediately in a screen share.
- A visible `:focus-visible` treatment must remain at least 3px and clearly distinguishable from the component edge.

## 3. Typography

Use **Inter** for English and interface metadata, with **Mukta Malar** or **Noto Sans Tamil** for Tamil. The current presenter uses Inter and Mukta Malar; keep that pairing consistent unless the app’s font-loading strategy changes.

| Level | English | Tamil guidance | Character |
|---|---:|---|---|
| Display route statement | 42–70px desktop | 30–42px mobile | Tight but never compressed; use for one short idea |
| Screen title | 22–28px | 22–28px | Strong, editorial, one clear destination |
| Section title | 16–20px | 18–22px | Use a comfortable line-height |
| Body | 14–16px | 15–17px | Minimum 1.5 line-height |
| Caption / source note | 11–13px | 12–14px | Never rely on colour alone |

Tamil needs room for vowel markers and stacked glyph shapes. Let labels wrap naturally; do not use fixed heights that can clip text. For Tamil, prefer `line-height: 1.5–1.65`, `overflow-wrap: anywhere` where necessary, and vertical padding that can grow with content.

## 4. Route vocabulary

Use a small, repeatable set of visual primitives:

- **Start point:** a small amber or jade node with a quiet ring.
- **Route:** one continuous stroke or dashed line; it may bend, but it should never become a decorative maze.
- **Landmark:** a compact outlined marker paired with a text label.
- **Destination:** a stronger node, arrow, or framed endpoint.
- **Evidence note:** a source line that explains where a claim came from; never style an unverified opportunity as confirmed.
- **Terrain:** low-contrast contour lines, never a noisy illustration behind readable text.

A route should usually have one active segment. Avoid turning every card into a badge, every label into a pill, or every section into a rounded container.

## 5. Illustration direction

Career illustrations should be **editorial object studies**, not mascots and not generic stock imagery. Use a consistent perspective and construction language:

- 1–2 main objects per scene.
- Simplified, recognisable silhouettes with restrained detail.
- Forest/emerald linework, sage or ivory field, muted gold for one functional accent.
- Slight asymmetry is welcome; avoid glossy 3D, childish cartoon faces, and random AI styles.
- Do not embed words, numbers, flags, qualifications, or claims inside an illustration.
- Keep the original Raahi explorer character separate. It is a brand companion, not a career illustration.

## 6. Interface integration rules

The asset system supports the existing screens; it does not replace them.

- **Talk, Don’t Type:** use a route-start marker and a single listening focal point. The visual should say “speak here,” not “chat with a bot.”
- **Career Routes:** use one relevant object illustration per route, anchored to the same baseline and aspect ratio.
- **Opportunity Radar:** use source/evidence markers only. Do not use decorative illustrations to imply eligibility.
- **My Pathway:** use a continuous vertical route with milestone nodes; keep milestone assets optional and lightweight.
- **Parent Mode:** use a calm destination or shared-route motif. Audio controls must remain the main action.
- **Facilitator Mode:** use compact student markers and skill/category symbols; prioritise scanability over illustration.

The exact feature names remain unchanged: **Talk, Don't Type · Someone Like Me · Parent Mode · Opportunity Radar · Apply-Assist · Connect & Earn · My Pathway · Earn While You Learn · Facilitator Mode.**

## 7. Accessibility and low-end device rules

- Provide a text label for every meaningful icon. Decorative SVGs use `aria-hidden="true"`.
- Keep tap targets at least 48×48px, including close, back, audio, and source controls.
- Do not communicate status with colour alone.
- Prefer inline SVG for simple route diagrams and icons; avoid icon-font dependency.
- Keep individual raster assets small and lazy-load below-the-fold illustrations.
- Use responsive images with explicit dimensions to prevent layout shift.
- Honour `prefers-reduced-motion` and `prefers-reduced-transparency`.
- Do not require animation to understand a route or eligibility decision.
- Test Tamil at 360px wide with large system text before approving an asset placement.

## 8. Naming and handoff

All new visual assets live under `aira/app/assets/` in purpose-specific folders. Design documentation remains under `aira/design/`.

Recommended folders:

```text
app/assets/
  illustrations/careers/
  illustrations/milestones/
  illustrations/categories/
  route/
  icons/
```

Use lowercase kebab-case for filenames, stable app IDs for career assets, and no visual meaning that depends on filename order. See `CAREER_ILLUSTRATION_LIBRARY.md` for the proposed inventory and mapping contract.
