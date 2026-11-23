// Parent Mode script builder by Nandana (from nandana/parent-mode/parentMode.js, copied unchanged below).
// The app adapter at the end of this file is the only addition.

// Parent Mode (plain globals, same style as data.js / engine.js).
// Load order in the page: data.js, engine.js, parentMode.js
//
// It builds a ~60-second script from YOUR data:
//   careers   -> CAREERS      (title, earn, path)
//   schemes   -> eligibility(profile)  (the rules engine decides, never an AI)
// A fact that is missing is skipped, never guessed.

const PARENT_MAX_WORDS = { ta: 110, en: 140 }; // ESTIMATES for ~60s. Time a real playback and adjust.

// Tamil wording for the 7 demo schemes + names. NEEDS REVIEW BY A NATIVE TAMIL SPEAKER.
const PARENT_TA = {
  names: { Kavya: "காவ்யா", Murugan: "முருகன்", Divya: "திவ்யா", Selvam: "செல்வம்", Anitha: "அனிதா" },
  opps: {
    pudhumai_penn: "புதுமைப் பெண் திட்டம்",
    central_sector: "மத்திய அரசின் கல்வி உதவித்தொகை",
    post_matric_obc: "பிற்படுத்தப்பட்டோருக்கான மேற்படிப்பு உதவித்தொகை",
    post_matric_sc: "ஆதிதிராவிடர் மேற்படிப்பு உதவித்தொகை",
    nmms: "என்.எம்.எம்.எஸ் உதவித்தொகை",
    naps: "பயிற்சிப் பணி திட்டம்",
    pmkvy: "இலவச திறன் பயிற்சி திட்டம்"
  }
};

const PARENT_T = {
  ta: {
    intro: "வணக்கம்! உங்கள் பிள்ளை {name} முன்னேற, {career} ஒரு நல்ல வழி. இதைப் பற்றி ஒரு நிமிடத்தில் சொல்கிறோம்.",
    duration: "படிப்புக் காலம்: {duration}.",
    cost: "மொத்த செலவு சுமார் {cost}.",
    step: "முதல் படி: {step}.",
    schol: "இந்த உதவித்தொகைகளுக்கு உங்கள் பிள்ளை தகுதி பெறலாம்: {list}. அதிகாரப்பூர்வ இணையதளத்தில் உறுதி செய்யுங்கள்.",
    earn: "படித்த பிறகு மாதம் சுமார் {earning} சம்பாதிக்கலாம். இவை தோராயமான அளவுகள்.",
    close: "மேலும் உதவிக்கு உங்கள் ஆசிரியரைச் சந்தியுங்கள். நன்றி!",
    and: " மற்றும் "
  },
  en: {
    intro: "Hello! {career} can be a good path for your child {name}. Here is the plan in one minute.",
    duration: "The course takes {duration}.",
    cost: "The total cost is about {cost}.",
    step: "The first step is: {step}.",
    schol: "Your child may qualify for these scholarships: {list}. Please confirm on the official website.",
    earn: "After finishing, one can earn about {earning} a month. These are approximate figures.",
    close: "Please meet your teacher for more help. Thank you!",
    and: " and "
  }
};

// "₹15,000-30,000/month (indicative)" -> "15 ஆயிரம் முதல் 30 ஆயிரம் ரூபாய்". Returns null if it can't parse (then the line is skipped).
function parentSpokenEarning(earn, lang) {
  const m = /₹\s*([\d,]+)\s*[-–]\s*([\d,]+)\s*\/\s*month/i.exec(earn || "");
  if (!m) return null;
  const one = n => {
    let v, unit;
    if (n >= 100000) { v = n / 100000; unit = lang === "ta" ? "லட்சம்" : "lakh"; }
    else if (n >= 1000) { v = n / 1000; unit = lang === "ta" ? "ஆயிரம்" : "thousand"; }
    else { v = n; unit = ""; }
    return (Number.isInteger(v) ? String(v) : v.toFixed(1)) + (unit ? " " + unit : "");
  };
  const lo = +m[1].replace(/,/g, ""), hi = +m[2].replace(/,/g, "");
  return lang === "ta" ? `${one(lo)} முதல் ${one(hi)} ரூபாய்` : `${one(lo)} to ${one(hi)} rupees`;
}

/**
 * @param profile  a student object (e.g. KAVYA or STUDENTS[i])
 * @param career   an entry from CAREERS (e.g. from matchCareers(profile))
 * @param lang     "ta" | "en"
 * @param opts     { onlyVerified: false }  -> set true once Pranshu has verified the rules
 */
function buildParentScript(profile, career, lang, opts) {
  opts = opts || {};
  lang = PARENT_T[lang] ? lang : "en";
  const t = PARENT_T[lang];
  const warnings = [];

  const name = lang === "ta" ? (profile.name_ta || PARENT_TA.names[profile.name] || profile.name) : profile.name;
  const careerName = (career.title[lang] || career.title.en).replace(/\s*\(.*?\)/g, ""); // drop "(Diploma / B.Des)" for speech

  // Schemes: decided by the rules engine in engine.js
  let eligible = eligibility(profile).filter(o => o.status === "eligible" && o.type === "scholarship");
  const unverified = eligible.filter(o => !o.verified);
  if (opts.onlyVerified) eligible = eligible.filter(o => o.verified);
  else if (unverified.length) warnings.push("UNVERIFIED rules used: " + unverified.map(o => o.name).join(", "));
  const schemeNames = eligible.slice(0, 3).map(o => lang === "ta" ? (PARENT_TA.opps[o.opportunity_id] || o.name) : o.name);

  const earning = parentSpokenEarning(career.earn, lang);
  if (!earning) warnings.push(`No parsable earnings for "${career.title.en}" (earn: "${career.earn}"): earnings line skipped`);

  // Optional fields: add to CAREERS later and they are picked up automatically.
  const duration = career["duration_" + lang] || (lang === "en" ? career.duration : null);
  const cost = career["cost_" + lang] || (lang === "en" ? career.cost : null);
  if (!duration) warnings.push("No duration in data: duration line skipped (add `duration` / `duration_ta` to CAREERS)");
  if (!cost) warnings.push("No cost in data: cost line skipped (add `cost` / `cost_ta` to CAREERS)");

  const firstStep = lang === "ta" ? career.first_step_ta : (career.path && career.path[0] && career.path[0][0]);
  if (lang === "ta" && !firstStep) warnings.push("No Tamil first step: add `first_step_ta` to CAREERS");

  const build = (schemes, withStep) => [
    t.intro.replace("{name}", name).replace("{career}", careerName),
    duration && t.duration.replace("{duration}", duration),
    cost && t.cost.replace("{cost}", cost),
    withStep && firstStep && t.step.replace("{step}", firstStep),
    schemes.length && t.schol.replace("{list}", schemes.length < 2 ? schemes[0] : schemes.slice(0, -1).join(", ") + t.and + schemes[schemes.length - 1]),
    earning && t.earn.replace("{earning}", earning),
    t.close
  ].filter(Boolean).join(" ");

  // Trim to ~60s: drop the last scheme first, then the first-step line.
  let schemes = schemeNames.slice(), withStep = true;
  let text = build(schemes, withStep);
  while (text.split(/\s+/).length > PARENT_MAX_WORDS[lang]) {
    if (schemes.length > 1) schemes.pop();
    else if (withStep) withStep = false;
    else break;
    text = build(schemes, withStep);
  }

  if (lang === "ta") {
    const latin = text.match(/[A-Za-z]{2,}/g);
    if (latin) warnings.push("English words in Tamil script (voice reads them badly): " + latin.join(", "));
  }
  return { text, words: text.split(/\s+/).length, warnings };
}

// ---------- Player: speaks the script (browser only) ----------
let _parentStopped = false;
function stopParentScript() { _parentStopped = true; if ("speechSynthesis" in window) speechSynthesis.cancel(); }

function _parentVoices() {
  return new Promise(res => {
    const v = speechSynthesis.getVoices();
    if (v.length) return res(v);
    speechSynthesis.addEventListener("voiceschanged", () => res(speechSynthesis.getVoices()), { once: true });
    setTimeout(() => res(speechSynthesis.getVoices()), 1500);
  });
}

// Returns "speech" if it spoke, "no-voice" if this device has no voice for the language.
async function playParentScript(text, lang, onState) {
  onState = onState || (() => {});
  stopParentScript(); _parentStopped = false;
  if (!("speechSynthesis" in window)) { onState("no-voice"); return "no-voice"; }
  const tag = lang === "ta" ? "ta-IN" : "en-IN";
  const voices = await _parentVoices();
  const voice = voices.find(v => v.lang === tag) || voices.find(v => v.lang.startsWith(lang));
  if (!voice) { onState("no-voice"); return "no-voice"; }
  onState("playing");
  // Chrome cuts off long utterances, so speak one sentence at a time.
  for (const s of text.split(/(?<=[.!?])\s+/).filter(Boolean)) {
    if (_parentStopped) break;
    await new Promise(done => {
      const u = new SpeechSynthesisUtterance(s);
      u.voice = voice; u.lang = voice.lang; u.rate = 0.9; u.onend = done; u.onerror = done;
      speechSynthesis.speak(u);
    });
  }
  onState("done");
  return "speech";
}

// ---------- Raasta app adapter ----------
// Builds the spoken parent note for the app with Nandana's builder.
// - Tamil first step comes from STEP_I18N (the app's step translations).
// - `earn` is blanked: the app shows no salary figures, so the earnings line is always skipped.
// Returns null when the builder can't be used (other languages, no name, bad career data); the app then uses its own note.
function parentNoteFor(profile, career, lang, stepI18n) {
  if (typeof buildParentScript !== "function" || !PARENT_T[lang] || !career || !career.title) return null;
  if (!profile || !profile.name) return null;
  const title = typeof career.title === "string" ? { en: career.title, [lang]: career.title } : career.title;
  const path = Array.isArray(career.path) ? career.path : [];
  const first = path[0] && path[0][0];
  const c = Object.assign({}, career, { title, path, earn: "", first_step_ta: career.first_step_ta || (stepI18n && first && stepI18n[first] && stepI18n[first].ta) || undefined });
  try { const r = buildParentScript(profile, c, lang); return r && r.text ? r : null; } catch (e) { return null; }
}
