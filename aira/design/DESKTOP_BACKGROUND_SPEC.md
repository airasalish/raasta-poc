# RAASTA — Desktop Field Atlas Background Specification

**Scope:** Background environment around the existing live phone/tablet/desktop simulator  
**Integration target:** `aira/app/presenter.html` and `aira/app/presenter.css`  
**Constraint:** The phone remains the visual hero; all controls and the embedded app remain real frontend elements.  
**Status:** Specification only; no presenter UI code changed in this document task

## 1. Composition

The desktop presentation is a three-part field atlas:

1. **Story margin:** a quiet editorial statement and Kavya context.
2. **Live route viewport:** the actual app inside the device bezel.
3. **Control margin:** stage controls that move the actual embedded app.

The background should support this composition with depth and direction, not become a fourth interface. It must remain readable behind the existing grid at laptop widths and collapse to a calmer single-column surface on small screens.

## 2. Layer model

Build the environment from independent CSS/SVG layers so the phone, route controls, and app remain interactive:

```text
atlas-bg (fixed, pointer-events: none)
  base ivory/sage field
  low-contrast contour paths
  one or two dotted route paths
  small geographic nodes
  optional atmospheric wash
presentation-grid (interactive)
  story panel
  live device stage + iframe
  presenter controls
```

Never flatten the phone, stage controls, or UI into a background image. The existing `atlas-bg`, contour elements, route line, and nodes are the correct integration boundary for this concept.

## 3. Visual recipe

### Base field

- Start with warm ivory on the left and a restrained sage/emerald tint toward the right.
- Keep the base surface matte; avoid a saturated hero gradient.
- The right side may carry slightly more topographic density because it frames the device without competing with its screen.

### Contours

- Use 1px lines with approximately 8–14% opacity against the local surface.
- Use large, partial ellipses or organic curves; never place a full map grid behind text.
- Keep contour intersections away from Tamil copy and the device screen.
- Two to four visible contour groups are enough at laptop width.

### Route lines

- One primary dashed route may arc through the lower or right background.
- Use a small amber start/destination marker and jade supporting node.
- Route line opacity should be lower than the live-status and primary action colours.
- Do not animate the route continuously. If motion is later added, use a one-time low-speed reveal and disable it for reduced motion.

### Rural Tamil Nadu cues

Use abstract cues rather than literal landscape stock imagery:

- contour-like crop rows;
- a restrained horizon or field boundary;
- small, unlabelled destination marks;
- gentle route bends suggesting a local journey.

Do not add temples, maps, uniforms, flags, or regional landmarks unless the product has a verified reason to reference them. The background is an atmosphere, not a claim about Kavya’s exact surroundings.

## 4. Spatial and responsive rules

### Wide desktop: 1200px and above

- Keep the device centred as the highest-contrast object.
- Let contours live mostly in the outer 20–25% margins.
- Keep the presenter top bar and footer structurally quiet.
- Maintain generous but intentional spacing; do not create a large empty hole around the phone.

### Laptop: 761–1199px

- Reduce contour count and route opacity.
- Preserve the device as the largest single focal point.
- Allow the control panel to move below or alongside the stage according to the existing responsive layout.
- Avoid decorative nodes near buttons or focus outlines.

### Mobile: 360–760px

- Treat the background as a flat or softly tinted canvas.
- Hide or simplify nonessential contours.
- Keep the live device width and the actual app readable before any decorative layer.
- Do not rely on background route lines to explain navigation; the app must remain understandable on its own.

## 5. Implementation notes for the current presenter

The current presenter already exposes the following safe hooks:

- `.atlas-bg` for the non-interactive environment;
- `.contour`, `.contour-a`, `.contour-b` for contour geometry;
- `.route-line` for the main background route;
- `.route-node`, `.node-a`, `.node-b` for landmarks;
- `.device-stage` and `.device-bezel` for the live product hero.

Preserve these behaviours:

- `pointer-events: none` on background layers;
- visible focus states on every control;
- the same-origin iframe as the actual application surface;
- reduced-motion fallbacks;
- the existing mobile/tablet/desktop device switcher;
- no debug telemetry panel in the product view.

If the background is upgraded from CSS shapes to SVG, place the SVG as an inline decorative layer or a CSS background inside `.atlas-bg`; do not use it as a wrapper around interactive content.

## 6. Contrast and performance budget

- Background decorative lines should remain visually subordinate to the phone and controls.
- Prefer CSS geometry or one small SVG over a large raster board.
- If a raster atmospheric plate is introduced, provide WebP/AVIF variants and keep the first-load asset lightweight; do not block the live iframe on it.
- Avoid blur-heavy filters on low-end devices. A flat opacity wash is preferable to multiple large `filter: blur()` layers.
- Keep decorative assets cacheable by the existing service worker only after they are actually used by the presenter.

## 7. Validation checklist

Before integrating any new background asset:

- Open the presenter at 360px, laptop width, and a wide desktop width.
- Confirm the phone screen is still the first visual focus.
- Tab through all controls and verify focus rings remain visible over the background.
- Check Tamil labels in the embedded app at the narrowest device mode.
- Disable motion and transparency preferences; confirm the background still reads as a calm surface.
- Confirm the background never intercepts pointer events.
- Confirm no route line crosses a button, iframe control, or source link.
- Confirm the new asset is included in the offline cache only if the presenter depends on it.
