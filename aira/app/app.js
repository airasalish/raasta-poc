// ============================================================================
// RAASTA APPLICATION CORE (Kaveri Dawn Design System)
// Complete Redesign for Citi India Hackathon (Ada Lovelace Day)
// Lead Designer & Frontend Engineer: Aira K Salish
// ============================================================================

const S = {
  lang: "ta", // Tamil-first default
  profile: { state: "TN", disability: false },
  step: 0,
  msgs: [],
  careerId: null,
  recommended: (() => {
    try { return JSON.parse(localStorage.getItem("raasta_rec") || "{}"); } catch { return {}; }
  })(),
  view: "start",
  isListening: false,
  isPlayingAudio: false,
  facilitatorFilter: "all"
};

const $ = sel => document.querySelector(sel);
const L = (o, k = "") => (S.lang === "ta" ? (o.ta ?? o[k + "ta"] ?? o.en) : (o.en ?? o[k + "en"]));
const esc = s => String(s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ============================================================================
// 1. VOICE ABSTRACTION (Akshaj interface ready, Web Speech fallback)
// ============================================================================
const Voice = {
  speak(text, lang = S.lang) {
    if (window.RaastaVoice && typeof window.RaastaVoice.speak === "function") {
      return window.RaastaVoice.speak(text, lang);
    }
    if (!("speechSynthesis" in window)) return Promise.resolve();
    return new Promise(resolve => {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === "ta" ? "ta-IN" : (lang === "hi" ? "hi-IN" : (lang === "ml" ? "ml-IN" : "en-IN"));
      const voices = speechSynthesis.getVoices();
      const v = voices.find(voice => voice.lang === u.lang || voice.lang.startsWith(lang));
      if (v) u.voice = v;
      u.rate = 0.92;
      u.onend = () => { S.isPlayingAudio = false; updateAudioUI(); resolve(); };
      u.onerror = () => { S.isPlayingAudio = false; updateAudioUI(); resolve(); };
      S.isPlayingAudio = true;
      updateAudioUI();
      speechSynthesis.speak(u);
    });
  },

  stopSpeak() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    S.isPlayingAudio = false;
    updateAudioUI();
  },

  listen(onText, lang = S.lang) {
    if (window.RaastaVoice && typeof window.RaastaVoice.listen === "function") {
      return window.RaastaVoice.listen(lang).then(onText);
    }
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) {
      alert(S.lang === "ta" ? "குரல் பதிவு செய்ய Chrome உலாவியைப் பயன்படுத்தவும்." : "Voice input works best in Google Chrome. Tap an option or type below.");
      return;
    }
    const r = new Rec();
    r.lang = lang === "ta" ? "ta-IN" : (lang === "hi" ? "hi-IN" : (lang === "ml" ? "ml-IN" : "en-IN"));
    r.interimResults = false;
    
    setMicState(true);

    r.onresult = e => {
      const text = e.results[0][0].transcript;
      setMicState(false);
      onText(text);
    };
    r.onend = () => setMicState(false);
    r.onerror = () => setMicState(false);
    try { r.start(); } catch (err) { setMicState(false); }
  }
};

function setMicState(listening) {
  S.isListening = listening;
  const orb = $("#micOrb");
  const status = $("#micStatusText");
  if (orb) orb.classList.toggle("recording", listening);
  if (status) {
    status.textContent = listening 
      ? (S.lang === "ta" ? "கேட்கிறது... பேசுங்கள்" : "Listening... speak now")
      : (S.lang === "ta" ? "பேச மைக் தொடவும்" : "Tap mic to speak");
  }
}

function updateAudioUI() {
  const playBtn = $("#parentPlayBtn");
  if (playBtn) {
    playBtn.innerHTML = S.isPlayingAudio
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> ${S.lang === "ta" ? "நிறுத்து (Stop)" : "Stop Audio"}`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> ${S.lang === "ta" ? "பெற்றோருக்கு ஒலிக்கவும் (Play for Family)" : "Play for Family"}`;
  }
}

// ============================================================================
// 2. CONVERSATIONAL PROFILING (Talk, Don't Type)
// ============================================================================
function askQuestion() {
  const q = QUESTIONS[S.step];
  if (!q) {
    const doneText = S.lang === "ta" 
      ? "அருமை! உங்கள் திறன்கள் அனைத்தும் வெற்றிகரமாகப் பதிவு செய்யப்பட்டன. உங்களுக்கான வழிகளைப் பார்க்கவும்." 
      : "Excellent! Your Skill Genome is complete. Let's explore your tailored career routes.";
    S.msgs.push({ who: "bot", text: doneText });
    Voice.speak(doneText);
    render();
    return;
  }
  const text = L(q);
  S.msgs.push({ who: "bot", text });
  Voice.speak(text);
  render();
}

function answerQuestion(opt, heardText) {
  const q = QUESTIONS[S.step];
  if (!q) return;
  const label = heardText || `${opt.icon} ${L(opt)}`;
  S.msgs.push({ who: "me", text: label });
  S.profile[q.key] = q.key === "interests" ? [opt.v] : opt.v;
  S.step++;
  askQuestion();
}

function processSpeechInput(text) {
  const q = QUESTIONS[S.step];
  if (!q) return;
  const lower = text.toLowerCase();
  const matched = q.options.find(o => (o.kw || []).some(k => lower.includes(k.toLowerCase())));
  if (matched) {
    answerQuestion(matched, text);
  } else {
    S.msgs.push({ who: "me", text });
    const retryText = S.lang === "ta" 
      ? "புரியவில்லை, கீழே உள்ளவற்றில் பொருத்தமான ஒன்றைத் தொடவும்." 
      : "I couldn't quite catch that. Please tap an option below.";
    S.msgs.push({ who: "bot", text: retryText });
    Voice.speak(retryText);
    render();
  }
}

// Fail-safe one-tap presenter demo shortcut
function fillKavya() {
  S.profile = { ...KAVYA };
  S.msgs = [
    { who: "me", text: "நான் அக்கம்பக்கத்தினருக்கு துணி தைத்துக் கொடுப்பேன் (I stitch clothes for my neighbours)" },
    { who: "bot", text: S.lang === "ta" ? "அருமை! காவ்யா அவர்களின் சுயவிவரம் தயாராக உள்ளது." : "Splendid! Kavya's Skill Genome is ready." }
  ];
  S.step = QUESTIONS.length;
  render();
}

// ============================================================================
// 3. UI RENDERING & DATA ADAPTERS
// ============================================================================
const isProfileComplete = () => S.step >= QUESTIONS.length;

const getCollectedChips = () => {
  return QUESTIONS.filter(q => S.profile[q.key] !== undefined).map(q => {
    const v = S.profile[q.key];
    const o = q.options.find(opt => (Array.isArray(v) ? v.includes(opt.v) : opt.v === v));
    return o ? { key: q.key, label: `${o.icon} ${L(o)}`, raw: o } : null;
  }).filter(Boolean);
};

const renderGenomeDrawer = () => {
  const chips = getCollectedChips();
  if (!chips.length) return "";
  return `
    <div class="genome-card" style="margin-bottom:4px;">
      <div class="row-between" style="margin-bottom:8px;">
        <div style="font-size:12.5px; font-weight:700; color:var(--brand-primary); display:flex; align-items:center; gap:6px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          ${S.lang === "ta" ? "சேகரிக்கப்பட்ட திறன் வரைபடம் (Skill Genome)" : "Live Skill Genome"}
        </div>
        <button class="ui-button btn-ghost btn-sm" data-act="go" data-v="profile" style="padding:2px 8px; font-size:11px;">
          ${S.lang === "ta" ? "விவரம் / Edit" : "Inspect"}
        </button>
      </div>
      <div style="display:flex; flex-wrap:wrap; gap:6px;">
        ${chips.map(c => `
          <span style="background:var(--brand-surface); color:var(--brand-primary); border:1px solid var(--brand-border); padding:3px 10px; border-radius:var(--radius-full); font-size:12px; font-weight:700;">
            ${esc(c.label)}
          </span>
        `).join("")}
      </div>
    </div>`;
};

function parentScriptText() {
  const c = CAREERS.find(c => c.id === S.careerId) || matchCareers(S.profile)[0] || CAREERS[0];
  const eligibleCount = eligibility(S.profile).filter(e => e.status === "eligible").length;
  const name = S.profile.name || (S.lang === "ta" ? "உங்கள் மகள் காவ்யா" : "Your daughter Kavya");
  const careerTitle = L(c.title);
  
  return S.lang === "ta"
    ? `வணக்கம். ${name} ${careerTitle} துறையில் படிக்க விரும்புகிறார். இதற்கு அரசு மற்றும் அங்கீகரிக்கப்பட்ட மூலம் ${eligibleCount} உதவித்தொகைகள் கிடைக்க வாய்ப்பு உள்ளது. எதிர்பார்க்கப்படும் ஆரம்ப வருமானம் ${c.earn}. இந்த படிப்பு பாதுகாப்பானது மற்றும் பள்ளி ஆசிரியர் வழிகாட்டலில் விண்ணப்பிக்கலாம்.`
    : `Hello. ${name} aspires to pursue ${careerTitle}. Up to ${eligibleCount} verified government and merit scholarships are available to support this education. Expected starting earnings: ${c.earn}. This pathway is recognized, safe, and the school facilitator will assist with all applications.`;
}

// ============================================================================
// 4. SCREEN VIEWS (8 POLISHED SCREENS)
// ============================================================================
const views = {
  // --------------------------------------------------------------------------
  // SCREEN A: WELCOME & LANGUAGE PICK
  // --------------------------------------------------------------------------
  start: () => `
    <div class="welcome-hero">
      <!-- Custom SVG Path & Sunrise Illustration -->
      <svg class="hero-illustration" viewBox="0 0 320 140" fill="none">
        <defs>
          <linearGradient id="sunGrad" x1="160" y1="20" x2="160" y2="90" gradientUnits="userSpaceOnUse">
            <stop stop-color="#F59E0B" />
            <stop offset="1" stop-color="#D97706" />
          </linearGradient>
          <linearGradient id="roadGrad" x1="160" y1="60" x2="160" y2="140" gradientUnits="userSpaceOnUse">
            <stop stop-color="#0A5C44" />
            <stop offset="1" stop-color="#063829" />
          </linearGradient>
        </defs>
        <circle cx="160" cy="65" r="42" fill="url(#sunGrad)" opacity="0.9" />
        <path d="M0 110 Q80 85 160 85 T320 110 L320 140 L0 140 Z" fill="#E8F5F1" />
        <path d="M125 140 L152 75 L168 75 L195 140 Z" fill="url(#roadGrad)" />
        <path d="M160 80 L160 92 M160 102 L160 118 M160 128 L160 140" stroke="#FDE68A" stroke-width="2.5" stroke-dasharray="2 3" />
      </svg>

      <h1 class="welcome-title">Raasta · ராஸ்தா</h1>
      <p class="welcome-tagline">
        ${S.lang === "ta" 
          ? "கிராமப்புற மாணவர்களுக்கான தொழில் வழிகாட்டி. 'எனக்கு என்ன வரும்?' என்பதில் இருந்து 'முதல் வருமானம்' வரை." 
          : "Google Maps for Careers. From 'What am I good at?' to your first rupee."}
      </p>

      <!-- Language Selection -->
      <div style="width:100%; text-align:left; font-size:13px; font-weight:700; color:var(--ink-muted); margin-bottom:8px;">
        ${S.lang === "ta" ? "மொழியைத் தேர்ந்தெடுக்கவும் / Select Language:" : "Select your language:"}
      </div>
      <div class="lang-grid">
        <div class="lang-card featured" data-act="lang" data-v="ta">
          <div>
            <div class="native-name">தமிழ்</div>
            <div class="en-sub">Tamil (Default)</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A5C44" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div class="lang-card" data-act="lang" data-v="en">
          <div>
            <div class="native-name">English</div>
            <div class="en-sub">English</div>
          </div>
        </div>
        <div class="lang-card" data-act="lang" data-v="hi">
          <div>
            <div class="native-name">हिन्दी</div>
            <div class="en-sub">Hindi</div>
          </div>
        </div>
        <div class="lang-card" data-act="lang" data-v="ml">
          <div>
            <div class="native-name">മലയാളം</div>
            <div class="en-sub">Malayalam</div>
          </div>
        </div>
      </div>

      <!-- Main Action -->
      <button class="ui-button btn-primary" data-act="start-chat" style="font-size:17px; margin-top:4px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
        ${S.lang === "ta" ? "குரல் மூலம் தொடங்குங்கள் (Talk)" : "Start with Voice (Talk)"}
      </button>

      <!-- Presenter Shortcut -->
      <div class="demo-fail-safe-bar" style="width:100%; margin-top:14px;">
        <span style="color:var(--ink-muted);">🎯 Citi Hackathon Demo:</span>
        <button class="ui-button btn-ghost btn-sm" data-act="kavya">
          ▶ Demo: Kavya (17, Villupuram)
        </button>
      </div>
    </div>
  `,

  // --------------------------------------------------------------------------
  // SCREEN B: TALK, DON'T TYPE (CONVERSATIONAL AUDIO)
  // --------------------------------------------------------------------------
  talk: () => {
    const q = QUESTIONS[S.step];
    const progress = Math.min(100, Math.round((S.step / QUESTIONS.length) * 100));

    return `
      <div class="talk-header-bar">
        <div>
          <span style="font-size:12px; font-weight:700; color:var(--ink-muted); text-transform:uppercase;">
            ${S.lang === "ta" ? "சுயவிவர உரையாடல்" : "Conversational Profiling"}
          </span>
          <h2 style="font-size:18px; font-weight:800; color:var(--ink-hero); margin-top:1px;">
            ${S.lang === "ta" ? "பேசுங்கள், தட்டச்சு வேண்டாம்" : "Talk, Don't Type"}
          </h2>
        </div>
        <span class="step-milestone-pill">${S.step} / ${QUESTIONS.length} (${progress}%)</span>
      </div>

      <!-- Chat Stream -->
      <div class="chat-stream">
        ${S.msgs.map(m => `
          <div class="chat-msg ${m.who === 'bot' ? 'bot' : 'me'}">
            ${esc(m.text)}
            ${m.who === 'bot' ? `
              <div>
                <button class="audio-listen-inline" data-act="read" data-t="${esc(m.text)}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                  ${S.lang === "ta" ? "கேளுங்கள்" : "Listen"}
                </button>
              </div>` : ''}
          </div>
        `).join("")}
      </div>

      <!-- Live Skill Genome Drawer -->
      ${renderGenomeDrawer()}

      <!-- Question Answer Section -->
      ${q ? `
        <!-- Tactile Options -->
        <div style="margin-top:2px;">
          <div style="font-size:13px; font-weight:700; color:var(--ink-muted); margin-bottom:8px;">
            👇 ${S.lang === "ta" ? "பொருத்தமான ஒன்றைத் தொடவும் அல்லது மைக் மூலம் பேசவும்:" : "Tap an option or speak via microphone:"}
          </div>
          <div class="tactile-options-grid">
            ${q.options.map((o, idx) => `
              <button class="tactile-opt-btn" data-act="opt" data-i="${idx}">
                <div class="opt-icon-circle">${o.icon}</div>
                <div class="opt-label-main">${esc(L(o))}</div>
              </button>
            `).join("")}
          </div>
        </div>

        <!-- Voice Interaction Dock -->
        <div class="voice-interaction-dock">
          <div class="mic-button-wrapper">
            <button class="mic-orb" id="micOrb" data-act="mic" title="Tap to Speak">
              <svg viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
            </button>
          </div>

          <div class="voice-waves">
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
          </div>

          <div class="voice-status-text" id="micStatusText">
            ${S.lang === "ta" ? "பேச மைக் தொடவும் (Tap mic to speak)" : "Tap mic to speak"}
          </div>

          <div style="width:100%; display:flex; gap:8px;">
            <input type="text" id="typedInput" placeholder="${S.lang === 'ta' ? 'அல்லது இங்கே எழுதவும்...' : 'or type here...'}" style="flex:1; padding:10px 14px; border:1px solid var(--border-hairline); border-radius:var(--radius-md); font-size:14px; background:var(--bg-page); color:var(--ink-hero);">
            <button class="ui-button btn-ghost btn-sm" id="typedSendBtn" style="width:auto; padding:0 14px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
        </div>
      ` : `
        <button class="ui-button btn-gold" data-act="go" data-v="careers" style="font-size:17px; padding:16px;">
          🧭 ${S.lang === "ta" ? "உங்களுக்கான வழிகளைப் பார்க்கவும் (See Routes)" : "See My Matched Routes"} →
        </button>
      `}
    `;
  },

  // --------------------------------------------------------------------------
  // SCREEN D: CAREER ROUTES (HIGH DIGNITY CARDS)
  // --------------------------------------------------------------------------
  careers: () => {
    const matched = matchCareers(S.profile);
    return `
      <div>
        <span style="font-size:12px; font-weight:700; color:var(--ink-muted); text-transform:uppercase;">
          ${S.lang === "ta" ? "திறன் வரைபடம் முடிவுகள்" : "Career Recommendations"}
        </span>
        <h1 style="font-size:22px; font-weight:800; color:var(--ink-hero); margin-top:2px;">
          ${S.lang === "ta" ? "உங்களுக்கான தொழில் வழிகள்" : "Career Routes for You"}
        </h1>
        <p style="font-size:13.5px; color:var(--ink-muted); margin-top:2px;">
          ${S.lang === "ta" ? "தொழிற்கல்வி மற்றும் வளரும் துறைகள் சமமான மரியாதையுடன் பரிந்துரைக்கப்பட்டுள்ளன." : "Vocational, emerging, and degree tracks evaluated with equal prestige."}
        </p>
      </div>

      ${renderGenomeDrawer()}

      <div style="display:flex; flex-direction:column; gap:14px;">
        ${matched.map(c => `
          <div class="career-card-elevated">
            <div class="career-header-row">
              <span class="ui-badge badge-${c.type}">${c.type}</span>
              <button class="audio-listen-inline" data-act="read" data-t="${esc(L(c.title))}. ${esc(c.why)}. ${esc(c.earn)}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
              </button>
            </div>

            <div class="career-title">${esc(L(c.title))}</div>

            <div class="career-why-block">
              💡 ${esc(c.why)}
            </div>

            <div class="row-between" style="margin-top:2px;">
              <div class="career-salary-box">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 18V6"></path></svg>
                <span>${esc(c.earn)}</span>
              </div>
            </div>

            <button class="ui-button btn-primary" data-act="career" data-v="${c.id}" style="margin-top:4px;">
              🗺️ ${S.lang === "ta" ? "கல்விப் பாதையைக் காண்க (Pathway)" : "Explore Learning Pathway"} →
            </button>
          </div>
        `).join("")}
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // SCREEN E: OPPORTUNITY RADAR (AUDITABLE SCHOLARSHIPS)
  // --------------------------------------------------------------------------
  radar: () => {
    const opps = eligibility(S.profile);
    const eligibleCount = opps.filter(o => o.status === "eligible").length;

    return `
      <div>
        <span style="font-size:12px; font-weight:700; color:var(--ink-muted); text-transform:uppercase;">
          ${S.lang === "ta" ? "அரசு உதவித்தொகை ரேடார்" : "Financial Support Radar"}
        </span>
        <h1 style="font-size:22px; font-weight:800; color:var(--ink-hero); margin-top:2px;">
          🎯 Opportunity Radar
        </h1>
        <p style="font-size:13px; color:var(--ink-muted); margin-top:2px;">
          ${S.lang === "ta" 
            ? "அரசு விதிகளின்படி நீங்கள் பெறக்கூடிய உதவித்தொகைகள். (AI முடிவு செய்யாது, விதிகள் முடிவு செய்யும்)." 
            : "Deterministic rules engine evaluation. The LLM never decides eligibility."}
        </p>
      </div>

      <!-- Stat Banner -->
      <div class="radar-stat-banner">
        <div>
          <div style="font-size:12px; font-weight:700; opacity:0.85; text-transform:uppercase;">
            ${S.lang === "ta" ? "உறுதிசெய்யப்பட்ட பலன்" : "Financial Aid Unlocked"}
          </div>
          <div style="font-size:22px; font-weight:800; margin-top:2px;">
            ${eligibleCount} ${S.lang === "ta" ? "திட்டங்களுக்கு தகுதி" : "Eligible Opportunities"}
          </div>
        </div>
        <div style="width:44px; height:44px; border-radius:12px; background:rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        </div>
      </div>

      <!-- Scheme Cards -->
      <div style="display:flex; flex-direction:column; gap:12px;">
        ${opps.map(o => `
          <div class="scheme-card ${o.status}">
            <div class="row-between">
              <h3 style="font-size:16px; font-weight:800; color:var(--ink-hero); flex:1;">${esc(o.name)}</h3>
              <span class="ui-badge ${o.status === 'eligible' ? 'badge-govt' : (o.status === 'not_eligible' ? 'badge-vocational' : 'badge-emerging')}">
                ${{ eligible: "✔ Eligible", maybe: "❔ Needs Info", not_eligible: "✖ Not Eligible" }[o.status]}
              </span>
            </div>

            <div class="scheme-benefit-badge">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 18V6"></path></svg>
              <span>${esc(o.benefit)}</span>
            </div>

            <ul class="rule-checklist">
              ${o.reasons.map(r => `
                <li>
                  <span style="color:${r.passed === true ? 'var(--status-eligible-ink)' : (r.passed === false ? 'var(--status-not-eligible-ink)' : 'var(--status-maybe-ink)')}; font-weight:800;">
                    ${r.passed === true ? '✔' : (r.passed === false ? '✖' : '❔')}
                  </span>
                  <span style="${r.passed === false ? 'color:var(--status-not-eligible-ink); font-weight:600;' : ''}">${esc(r.text)}</span>
                </li>
              `).join("")}
            </ul>

            <div class="row-between" style="margin-top:6px; padding-top:8px; border-top:1px solid var(--border-hairline);">
              <a href="${o.source_url}" target="_blank" rel="noopener" class="source-link-chip">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                ${S.lang === "ta" ? "அதிகாரப்பூர்வ இணையதளம்" : "Official Gazette / Portal"}
              </a>
              ${o.verified 
                ? `<span style="font-size:11.5px; color:var(--status-eligible-ink); font-weight:700; display:flex; align-items:center; gap:4px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> Verified</span>` 
                : `<span style="font-size:11px; color:var(--gold-primary); font-weight:600;">⚠ Pending Recheck</span>`}
            </div>
          </div>
        `).join("")}
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // SCREEN F: MY PATHWAY ("RAASTA" ROAD TIMELINE)
  // --------------------------------------------------------------------------
  pathway: () => {
    const c = CAREERS.find(c => c.id === S.careerId) || matchCareers(S.profile)[0] || CAREERS[0];
    S.careerId = c.id;

    return `
      <div>
        <div class="row-between">
          <span class="ui-badge badge-${c.type}">${c.type}</span>
          <button class="ui-button btn-ghost btn-sm" data-act="go" data-v="careers">← ${S.lang === 'ta' ? 'அனைத்து வழிகள்' : 'All Routes'}</button>
        </div>
        <h1 style="font-size:22px; font-weight:800; color:var(--ink-hero); margin-top:4px;">
          🗺️ ${esc(L(c.title))}
        </h1>
        <p style="font-size:13.5px; color:var(--ink-muted); margin-top:2px;">💡 ${esc(c.why)}</p>
      </div>

      <!-- PARENT MODE EMOTIONAL HIGHLIGHT -->
      <div class="parent-trust-box">
        <div class="parent-heading">
          <h3>👨‍👩‍👧 Parent Mode · பெற்றோர் வழிகாட்டி</h3>
          <span class="ui-badge" style="background:#FDE68A; color:#78350F; border:1px solid #F59E0B;">Tamil Voice</span>
        </div>
        <p style="font-size:13.5px; color:#78350F; line-height:1.5;">
          ${S.lang === "ta" 
            ? "பெற்றோருக்கு இந்த படிப்பின் பாதுகாப்பு, அரசு உதவித்தொகை மற்றும் ஆரம்ப வருமானம் பற்றி தமிழில் விளக்கும் குரல் பதிவு." 
            : "Spoken Tamil briefing for the family addressing duration, safety, cost relief, and starting income."}
        </p>

        <div class="parent-audio-player-bar">
          <button class="ui-button btn-gold" id="parentPlayBtn" data-act="parent" style="flex:1;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            ${S.lang === "ta" ? "பெற்றோருக்கு ஒலிக்கவும் (Play)" : "Play for Family"}
          </button>
        </div>

        <div class="parent-transcript-sheet" id="parentTranscriptSheet" style="display:none;">
          <div style="font-size:12px; font-weight:800; color:#92400E; margin-bottom:4px; text-transform:uppercase;">Transcript / உரை:</div>
          <div id="parentTranscriptText"></div>
        </div>
      </div>

      <!-- VERTICAL ROAD TIMELINE -->
      <div class="ui-card">
        <h3 style="font-size:16px; font-weight:800; color:var(--ink-hero); margin-bottom:8px;">
          🛣️ ${S.lang === "ta" ? "வாராந்திர கற்றல் பாதை (Raasta Pathway)" : "Week-by-Week Learning Route"}
        </h3>
        
        <div class="road-journey">
          ${c.path.map((p, i) => `
            <div class="journey-station">
              <div class="station-pin"></div>
              <div class="station-time">Milestone ${i + 1} · Week ${i * 2 + 1} - ${i * 2 + 2}</div>
              <div class="station-goal">${esc(p[0])}</div>
              ${p[2] 
                ? `<a href="${p[2]}" target="_blank" rel="noopener" class="source-link-chip">🔗 ${esc(p[1])}</a>` 
                : `<span style="font-size:12.5px; color:var(--ink-muted);">${esc(p[1])}</span>`}
            </div>
          `).join("")}
        </div>
      </div>

      <!-- EXAMS -->
      <div class="ui-card">
        <h3 style="font-size:15px; font-weight:800; color:var(--ink-hero);">
          📝 ${S.lang === "ta" ? "நுழைவுத் தேர்வுகள் & சேர்க்கை" : "Entrance Exams & Admission"}
        </h3>
        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
          ${c.exams.map(e => `
            <span style="background:var(--brand-surface); color:var(--brand-primary); padding:4px 10px; border-radius:var(--radius-full); font-size:12.5px; font-weight:700;">
              📋 ${esc(e)}
            </span>
          `).join("")}
        </div>
      </div>

      <button class="ui-button btn-primary" data-act="go" data-v="radar">
        🎯 ${S.lang === "ta" ? "உதவித்தொகைகளைப் பார்க்கவும் (View Scholarships)" : "View Eligible Scholarships"} →
      </button>
    `;
  },

  // --------------------------------------------------------------------------
  // SCREEN G: PROFILE / "ABOUT ME" (EDITABLE CHIPS)
  // --------------------------------------------------------------------------
  profile: () => {
    const isDone = isProfileComplete();
    const name = S.profile.name || (S.lang === "ta" ? "காவ்யா" : "Kavya");
    const flag = talentFlag(S.profile);

    return `
      <div>
        <div class="row-between">
          <div>
            <span style="font-size:12px; font-weight:700; color:var(--ink-muted); text-transform:uppercase;">
              ${S.lang === "ta" ? "மாணவர் சுயவிவரம்" : "Student Profile"}
            </span>
            <h1 style="font-size:22px; font-weight:800; color:var(--ink-hero); margin-top:2px;">
              👤 ${esc(name)} ${flag ? `<span class="talent-star-badge">⭐</span>` : ""}
            </h1>
          </div>
          <button class="ui-button btn-ghost btn-sm" data-act="go" data-v="talk">← ${S.lang === 'ta' ? 'உரையாடல்' : 'Chat'}</button>
        </div>
        <p style="font-size:13px; color:var(--ink-muted); margin-top:2px;">Villupuram, Tamil Nadu · Govt School Cohort</p>
      </div>

      <div class="ui-card">
        <div class="row-between" style="margin-bottom:12px;">
          <b style="font-size:15px; color:var(--ink-hero);">Skill Genome Attributes</b>
          <span class="ui-badge ${isDone ? 'badge-govt' : 'badge-emerging'}">
            ${isDone ? (S.lang === "ta" ? "முழுமையானது" : "100% Completed") : "In Progress"}
          </span>
        </div>

        <div class="genome-deck">
          <div class="genome-attribute-row">
            <span class="genome-attr-label">🧵 ${S.lang === "ta" ? "ஆர்வங்கள் & திறன்கள்" : "Skills & Interests"}</span>
            <span class="genome-attr-value">${(S.profile.interests || []).join(", ") || "-"}</span>
          </div>
          <div class="genome-attribute-row">
            <span class="genome-attr-label">🎂 ${S.lang === "ta" ? "வயது" : "Age"}</span>
            <span class="genome-attr-value">${S.profile.age || "-"}</span>
          </div>
          <div class="genome-attribute-row">
            <span class="genome-attr-label">📘 ${S.lang === "ta" ? "கல்வி நிலை" : "Education"}</span>
            <span class="genome-attr-value">${S.profile.education || "Class 11-12"}</span>
          </div>
          <div class="genome-attribute-row">
            <span class="genome-attr-label">🏫 ${S.lang === "ta" ? "பள்ளி வகை" : "School Type"}</span>
            <span class="genome-attr-value">${S.profile.govt_school ? (S.lang === "ta" ? "அரசுப் பள்ளி" : "Govt School") : "Private"}</span>
          </div>
          <div class="genome-attribute-row">
            <span class="genome-attr-label">👥 ${S.lang === "ta" ? "சமூகப் பிரிவு" : "Category"}</span>
            <span class="genome-attr-value">${(S.profile.category || "OBC").toUpperCase()}</span>
          </div>
          <div class="genome-attribute-row">
            <span class="genome-attr-label">💰 ${S.lang === "ta" ? "ஆண்டு வருமானம்" : "Income"}</span>
            <span class="genome-attr-value">₹${S.profile.family_income_lakh || 2.0} Lakh/year</span>
          </div>
          <div class="genome-attribute-row">
            <span class="genome-attr-label">📝 ${S.lang === "ta" ? "மதிப்பெண்" : "Marks"}</span>
            <span class="genome-attr-value">${S.profile.marks_percent || 82}%</span>
          </div>
        </div>

        ${flag ? `
          <div style="background:var(--gold-surface); border:1px solid var(--gold-border); border-radius:var(--radius-md); padding:10px 12px; margin-top:12px; font-size:12.5px; color:var(--gold-ink);">
            ⭐ <b>AI Talent Flag Active:</b> Marks $\ge$80% and demonstrated vocational stitching skill. Flagged for Facilitator priority recommendation.
          </div>
        ` : ''}
      </div>

      <button class="ui-button btn-gold" data-act="go" data-v="careers">
        🧭 ${S.lang === "ta" ? "தொழில் வழிகளைக் காண்க" : "View Matched Routes"} →
      </button>
    `;
  },

  // --------------------------------------------------------------------------
  // SCREEN H: FACILITATOR MODE (TEACHER DASHBOARD)
  // --------------------------------------------------------------------------
  facilitator: () => {
    let rows = STUDENTS.map(s => {
      const isDemoKavya = s.name === "Kavya" && isProfileComplete();
      const currentProfile = isDemoKavya ? S.profile : s;
      return {
        s: currentProfile,
        student_id: s.student_id,
        name: s.name,
        top: matchCareers(currentProfile)[0],
        eligibleCount: eligibility(currentProfile).filter(e => e.status === "eligible").length,
        flag: talentFlag(currentProfile),
        isRecommended: !!S.recommended[s.student_id]
      };
    });

    if (S.facilitatorFilter === "flagged") {
      rows = rows.filter(r => r.flag);
    } else if (S.facilitatorFilter === "rec") {
      rows = rows.filter(r => r.isRecommended);
    }

    return `
      <div>
        <span style="font-size:12px; font-weight:700; color:var(--ink-muted); text-transform:uppercase;">
          ${S.lang === "ta" ? "ஆசிரியர் டாஷ்போர்டு" : "Teacher Enablement"}
        </span>
        <h1 style="font-size:22px; font-weight:800; color:var(--ink-hero); margin-top:2px;">
          👩‍🏫 Facilitator Mode
        </h1>
        <p style="font-size:13px; color:var(--ink-muted); margin-top:2px;">
          Govt Higher Secondary School, Villupuram · 60 Students Cohort
        </p>
      </div>

      <!-- KPI Metrics -->
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;">
        <div class="ui-card" style="padding:12px; text-align:center;">
          <div style="font-size:22px; font-weight:800; color:var(--brand-primary);">${STUDENTS.length}</div>
          <div style="font-size:11px; font-weight:600; color:var(--ink-muted);">Enrolled</div>
        </div>
        <div class="ui-card" style="padding:12px; text-align:center;">
          <div style="font-size:22px; font-weight:800; color:var(--gold-primary);">${STUDENTS.filter(s => talentFlag(s)).length}</div>
          <div style="font-size:11px; font-weight:600; color:var(--ink-muted);">⭐ Talent Flags</div>
        </div>
        <div class="ui-card" style="padding:12px; text-align:center;">
          <div style="font-size:22px; font-weight:800; color:var(--status-eligible-ink);">${Object.keys(S.recommended).length}</div>
          <div style="font-size:11px; font-weight:600; color:var(--ink-muted);">Endorsed</div>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="fac-filter-bar">
        <button class="fac-tab-btn ${S.facilitatorFilter === 'all' ? 'active' : ''}" data-act="filter-fac" data-v="all">
          All (${STUDENTS.length})
        </button>
        <button class="fac-tab-btn ${S.facilitatorFilter === 'flagged' ? 'active' : ''}" data-act="filter-fac" data-v="flagged">
          ⭐ Talent Flags (${STUDENTS.filter(s => talentFlag(s)).length})
        </button>
        <button class="fac-tab-btn ${S.facilitatorFilter === 'rec' ? 'active' : ''}" data-act="filter-fac" data-v="rec">
          ✔ Endorsed (${Object.keys(S.recommended).length})
        </button>
      </div>

      <!-- Student Card List -->
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${rows.map(({ s, student_id, name, top, eligibleCount, flag, isRecommended }) => `
          <div class="student-row-card">
            <div>
              <div style="font-size:15px; font-weight:700; color:var(--ink-hero); display:flex; align-items:center;">
                ${esc(name)}
                ${flag ? `<span class="talent-star-badge" title="AI Talent Flag">⭐</span>` : ""}
              </div>
              <div style="font-size:12.5px; color:var(--ink-muted); margin-top:1px;">
                ${top ? esc(top.title.en) : "-"}
              </div>
              <div style="font-size:11.5px; color:var(--brand-primary); font-weight:700; margin-top:2px;">
                ${eligibleCount} Scholarships Eligible
              </div>
            </div>

            <div>
              ${isRecommended 
                ? `<span style="color:var(--status-eligible-ink); font-weight:800; font-size:12px; display:inline-flex; align-items:center; gap:4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> Sent</span>` 
                : `<button class="ui-button btn-primary btn-sm" data-act="rec" data-v="${student_id}">Recommend</button>`}
            </div>
          </div>
        `).join("")}
      </div>

      <p style="font-size:12px; color:var(--ink-muted); margin-top:4px;">
        ⭐ = AI Talent Flag: surfaces learners with high academic marks or diverse vocational skills. The facilitator confirms with one tap.
      </p>
    `;
  }
};

// ============================================================================
// 5. MAIN RENDER LOOP & EVENT HANDLERS
// ============================================================================
function render() {
  const currentView = S.lang ? S.view : "start";
  $("#viewContainer").innerHTML = (views[currentView] || views.start)();
  
  const nav = $("#appNavbar");
  if (nav) nav.style.display = S.lang ? "grid" : "none";
  
  const profileHeaderBtn = $("#profileHeaderBtn");
  if (profileHeaderBtn) {
    profileHeaderBtn.style.display = S.lang && isProfileComplete() ? "inline-flex" : "none";
  }

  document.querySelectorAll("nav.app-navbar button").forEach(b => {
    b.classList.toggle("active", b.dataset.v === currentView);
    b.disabled = b.dataset.v !== "talk" && b.dataset.v !== "facilitator" && !isProfileComplete();
  });

  const typedInput = $("#typedInput");
  if (typedInput) {
    typedInput.onkeydown = e => {
      if (e.key === "Enter" && typedInput.value.trim()) {
        processSpeechInput(typedInput.value.trim());
      }
    };
  }
  
  const typedSendBtn = $("#typedSendBtn");
  if (typedSendBtn) {
    typedSendBtn.onclick = () => {
      if (typedInput && typedInput.value.trim()) {
        processSpeechInput(typedInput.value.trim());
      }
    };
  }

  window.scrollTo(0, 0);
}

function navigateTo(viewName) {
  S.view = viewName;
  Voice.stopSpeak();
  render();
}

// Global click event dispatcher
document.addEventListener("click", e => {
  const target = e.target.closest("[data-act], nav.app-navbar button, #themeToggleBtn, #headerBrand");
  if (!target) return;

  if (target.id === "headerBrand") {
    e.preventDefault();
    if (S.lang) navigateTo("talk");
    return;
  }

  if (target.id === "themeToggleBtn") {
    const doc = document.documentElement;
    const isDark = doc.getAttribute("data-theme") === "dark";
    doc.setAttribute("data-theme", isDark ? "light" : "dark");
    return;
  }

  // Bottom navbar navigation
  if (target.tagName === "BUTTON" && target.closest("nav.app-navbar") && target.dataset.v) {
    return navigateTo(target.dataset.v);
  }

  const action = target.dataset.act;
  if (!action) return;

  if (action === "lang") {
    S.lang = target.dataset.v;
    navigateTo("talk");
    askQuestion();
  }
  else if (action === "start-chat") {
    navigateTo("talk");
    askQuestion();
  }
  else if (action === "opt") {
    const q = QUESTIONS[S.step];
    if (q) answerQuestion(q.options[+target.dataset.i]);
  }
  else if (action === "mic") {
    Voice.listen(processSpeechInput, S.lang);
  }
  else if (action === "kavya") {
    fillKavya();
  }
  else if (action === "go") {
    navigateTo(target.dataset.v);
  }
  else if (action === "career") {
    S.careerId = target.dataset.v;
    navigateTo("pathway");
  }
  else if (action === "parent") {
    if (S.isPlayingAudio) {
      Voice.stopSpeak();
    } else {
      const script = parentScriptText();
      const sheet = $("#parentTranscriptSheet");
      const textBox = $("#parentTranscriptText");
      if (sheet && textBox) {
        sheet.style.display = "block";
        textBox.textContent = script;
      }
      Voice.speak(script, S.lang || "ta");
    }
  }
  else if (action === "rec") {
    const id = target.dataset.v;
    S.recommended[id] = true;
    try { localStorage.setItem("raasta_rec", JSON.stringify(S.recommended)); } catch (err) {}
    render();
  }
  else if (action === "read") {
    const textToRead = target.dataset.t;
    if (textToRead) Voice.speak(textToRead, S.lang || "ta");
  }
  else if (action === "filter-fac") {
    S.facilitatorFilter = target.dataset.v;
    render();
  }
});

// Network status updater
function syncNetwork() {
  const isOnline = navigator.onLine;
  const ind = $("#netIndicator");
  const lbl = $("#netLabel");
  if (ind && lbl) {
    if (isOnline) {
      ind.classList.remove("offline");
      lbl.textContent = "online";
    } else {
      ind.classList.add("offline");
      lbl.textContent = S.lang === "ta" ? "ஆஃப்லைன்: செயல்படும்" : "offline: working";
    }
  }
}

window.addEventListener("online", syncNetwork);
window.addEventListener("offline", syncNetwork);
syncNetwork();

// Service Worker for 100% Offline Capability
try {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
} catch (e) {}

// URL Query Parameter Router for Presentation / Direct Screen Access
try {
  const params = new URLSearchParams(window.location.search);
  const v = params.get("v") || (window.location.hash ? window.location.hash.slice(1) : null);
  const demo = params.get("demo");
  if (demo === "kavya" || (v && v !== "start")) {
    fillKavya();
    if (v && views[v]) S.view = v;
  }
} catch (e) {}

// Initial Render
render();
