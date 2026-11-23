# RAASTA — Career Illustration Library

**Scope:** Proposed reusable visual inventory for existing career IDs  
**Important:** This is an asset proposal, not a source of career, salary, admission, or scholarship facts. Existing product copy and `data.js` remain authoritative.  
**Status:** Ready for visual production; no UI code or data shapes changed

## 1. Art direction

Create a family of small editorial object studies. Each illustration should work at approximately 96–160px wide on a 360px phone, and remain legible when enlarged inside the desktop presenter. The common system is:

- warm ivory or transparent background;
- deep forest outline with one emerald/jade secondary tone;
- one restrained muted-gold detail where it helps the eye find the tool or route;
- no embedded text;
- no faces, uniforms, logos, government seals, or unsupported claims;
- one visual anchor plus one supporting object;
- consistent 3/4 or front-facing construction across the set.

The illustration should explain the **kind of work or learning activity**, not promise an outcome.

## 2. Proposed inventory

The IDs below mirror the current `CAREERS` data. The “asset brief” describes what to draw, not what the product should claim.

| Career ID | Product label | Asset brief | Primary objects | Suggested category |
|---|---|---|---|---|
| `fashion_tech` | Fashion Technology | Pattern-making and garment construction study | folded fabric, measuring tape, pattern ruler | making |
| `garment_supervisor` | Garment Unit Supervisor | Quality/checking and production-flow study | garment stack, checklist board, seam sample | making |
| `iti_sewing` | ITI Sewing Technology | Workshop sewing study | domestic sewing machine, thread spool, fabric square | making |
| `textile_design_digital` | Digital Textile & Print Designer | Fabric motif and digital design study | tablet grid, repeating fabric swatch, stylus | creative |
| `mobile_tech` | Mobile Phone Technician | Careful device repair study | opened phone, precision screwdriver, small component tray | technology |
| `agri_drone` | Agri-Drone Operator | Field mapping and remote equipment study | crop rows, compact drone silhouette, route marker | field |
| `food_processing` | Food Processing Technician | Clean preparation and packaging study | ingredient tray, sealed pack, measuring scoop | making |
| `teacher` | Teacher | Learning facilitation study | open notebook, chalkboard line, pointer | people |
| `electrician` | Electrician (ITI trade) | Safe electrical work study | insulated pliers, cable loop, test meter | technology |
| `appliance_tech` | Home Appliance Repair Technician | Household repair study | fan or mixer outline, screwdriver, spare part | technology |
| `performing_arts` | Music / Dance | Practice and performance study | hand drum or ankle-bell cue, stage line | creative |
| `sports_coach` | Sports Coach / Physical Education Teacher | Practice and coaching study | whistle, cones, movement arrows | people |

### Asset variants

Each career may need three variants, but produce them only when a real screen needs them:

1. `card`: compact 1:1 or 4:3 object study for Career Routes.
2. `route`: simplified single-colour landmark for My Pathway.
3. `facilitator`: tiny silhouette or category mark for dense teacher views.

Do not create all variants up front. Start with the Kavya route: `fashion_tech`, `garment_supervisor`, `iti_sewing`, and `textile_design_digital`, plus the shared route markers.

## 3. Reusable mapping convention

The filename is deterministic:

```text
career-{career-id}--{variant}.svg
```

Examples:

```text
career-fashion-tech--card.svg
career-fashion-tech--route.svg
career-iti-sewing--card.svg
career-mobile-tech--facilitator.svg
```

The source ID is the stable key. Display titles, Tamil translations, reasons, and opportunity facts must continue to come from the app data; do not duplicate them in asset metadata.

A small mapping module may be introduced later at an integration boundary, without changing `data.js`:

```js
const CAREER_ASSETS = {
  fashion_tech: {
    card: 'assets/illustrations/careers/career-fashion-tech--card.svg',
    route: 'assets/illustrations/careers/career-fashion-tech--route.svg'
  },
  garment_supervisor: {
    card: 'assets/illustrations/careers/career-garment-supervisor--card.svg',
    route: 'assets/illustrations/careers/career-garment-supervisor--route.svg'
  },
  iti_sewing: {
    card: 'assets/illustrations/careers/career-iti-sewing--card.svg',
    route: 'assets/illustrations/careers/career-iti-sewing--route.svg'
  }
};
```

Until the assets exist, the UI should keep its current fallback behaviour. A missing illustration must never break route rendering.

## 4. SVG production rules

- Use a `viewBox`; do not bake device-specific pixel dimensions into the artwork.
- Keep strokes optically consistent, usually 1.5–2px at a 128px reference size.
- Use `currentColor` or a small documented palette where practical.
- Remove editor metadata, hidden layers, and embedded raster images.
- Keep accessible title/description text outside the SVG when the surrounding component already supplies the label.
- Mark purely decorative instances `aria-hidden="true"`; provide a visible or screen-reader label when the object conveys meaning.
- Avoid filters and heavy masks on the smallest route/facilitator variants.

## 5. Review checklist

Before an asset is integrated, confirm:

- It reads at 96px on a low-density phone screen.
- It belongs to the same family as the other illustrations.
- It does not contain a claim, logo, salary figure, source, or qualification.
- It is not confused with the Raahi explorer character.
- It does not imply that a student is eligible, guaranteed a job, or guaranteed an income.
- It has a stable career ID and filename.
- It has a graceful missing-asset fallback.
- Its placement leaves Tamil labels and 48px controls room to grow.

## 6. Production order

**First:** the Kavya route assets listed above.  
**Second:** `mobile_tech`, `electrician`, and `appliance_tech` for the technology family.  
**Third:** field, food, creative, and people families.  
**Last:** optional milestone and category illustrations after the core route has been visually validated.

This order protects the live demo: the asset system should make Kavya’s stitching-to-route story clearer before expanding the catalogue.
