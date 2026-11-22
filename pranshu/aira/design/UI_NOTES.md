# Raasta: UI/UX Notes for Hackathon Judges & Mentors
**Product:** RAASTA ("Google Maps for Careers")  
**Theme:** Reimagining Education & Economic Empowerment for Rural India  
**Team:** Absolute Zero (SRMIST Chennai)  
**Lead Designer:** Aira K Salish  

---

## Why This UI Suits Rural, Low-Literacy Users & Cheap Devices

### 1. "Talk, Don't Type" & Zero Form Anxiety
* **The Rural Reality:** ASER 2023 reports that 1 in 4 rural youth (14–18) struggle to fluently read Standard 2 text in their regional language. Bureaucratic input forms and dropdown menus cause test anxiety and immediate drop-off.
* **Our Design:** No forms, no typing required. A conversational voice companion speaks in native Tamil (or English/Hindi/Malayalam). Every question can be answered via voice (Web Speech / Sarvam AI / VoicERA) or by tapping large, tactile icon cards ($\ge$48px touch targets) with zero English literacy needed.

### 2. Tamil-First Typography Hierarchy (No Vowel Clipping)
* **The Rural Reality:** Tamil characters have tall vowel markers (கொ, தை, ளி) that get clipped or squished by standard English line-heights (1.2–1.3), causing eye strain and legibility degradation in outdoor sunlight.
* **Our Design:** Custom typography using `Mukta Malar` and `Noto Sans Tamil` with a baseline line-height of `1.55`. Button labels and card containers grow dynamically to accommodate long Tamil phrasing without text truncation.

### 3. "Kaveri Dawn" Palette: Sunlight Legibility & Non-Bureaucratic Dignity
* **The Rural Reality:** White-label e-governance portals default to sterile corporate blues and clinical white backgrounds that cause harsh glare in rural outdoor sunlight and feel intimidatingly administrative.
* **Our Design:** The "Kaveri Dawn" palette uses Forest Emerald (`#0D5C46`) symbolizing growth and livelihood, Temple Sun Gold (`#D97706`) marking progress and financial milestones, and soft Jasmine Parchment (`#F8F9F7`) that eliminates harsh glare while maintaining strict WCAG AA contrast.

### 4. "Parent Mode": Bridging the Inter-Generational Trust Gap
* **The Rural Reality:** In rural families, particularly for young women like Kavya (17, Villupuram), parents make the ultimate decision on whether study continues. Unfamiliar modern careers are often rejected simply because parents cannot read English leaflets.
* **Our Design:** A dedicated one-tap "Parent Mode" produces a respectful, high-contrast audio brief in spoken Tamil explaining cost, duration, safety, verified scholarships, and expected starting earnings. Transparency builds family trust.

### 5. Deterministic Trust Signals & Offline Reliability
* **The Rural Reality:** Rural families cannot afford false scholarship information. Furthermore, network connectivity in rural blocks is notoriously patchy.
* **Our Design:** 
  * The LLM **never** decides eligibility. A deterministic on-device rules engine evaluates each scheme, providing explicit `✅` passed and `❌` failed reasons and direct links to official government gazettes.
  * The sub-15KB lightweight PWA caches the entire opportunity rulebook in local service worker storage, enabling 100% full career discovery, eligibility evaluation, and parent playback even in total airplane mode.
