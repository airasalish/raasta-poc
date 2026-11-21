// Raasta UI/UX Engine (Kaveri Dawn Design System)
// Designed for rural students, low literacy, offline resilience, and Tamil-first interaction.

const S = {
  lang: null,
  profile: { state: "TN", disability: false },
  step: 0,
  msgs: [],
  careerId: null,
  recommended: (() => {
    try { return JSON.parse(localStorage.getItem("raasta_rec") || "{}"); } catch { return {}; }
  })(),
  view: "start",
  isListening: false
};

const $ = sel => document.querySelector(sel);
const L = (o, k = "") => (S.lang === "ta" ? (o.ta ?? o[k + "ta"] ?? o.en) : (o.en ?? o[k + "en"]));
const esc = s => String(s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ==========================================
// 1. VOICE ABSTRACTION (Akshaj interface ready)
// ==========================================
const Voice = {
  speak(text, lang = S.lang) {
    if (window.RaastaVoice && typeof window.RaastaVoice.speak === "function") {
      return window.RaastaVoice.speak(text, lang);
    }
    if (!("speechSynthesis" in window)) return Promise.resolve();
    return new Promise(resolve => {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === "ta" ? "ta-IN" : "en-IN";
      const voices = speechSynthesis.getVoices();
      const v = voices.find(v => v.lang === u.lang || v.lang.startsWith(lang));
      if (v) u.voice = v;
      u.rate = 0.92;
      u.onend = resolve;
      u.onerror = resolve;
      speechSynthesis.speak(u);
    });
  },

  listen(onText, lang = S.lang) {
    if (window.RaastaVoice && typeof window.RaastaVoice.listen === "function") {
      return window.RaastaVoice.listen(lang).then(onText);
    }
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) {
      alert(S.lang === "ta" ? "குரல் வழி பதிவு செய்ய Chrome உலாவியைப் பயன்படுத்தவும்." : "Voice input works best in Google Chrome. Tap an icon below or type.");
      return;
    }
    const r = new Rec();
    r.lang = lang === "ta" ? "ta-IN" : "en-IN";
    r.interimResults = false;
    
    const mic = $("#mic");
    const micStatus = $("#micStatus");
    if (mic) mic.classList.add("listening");
    if (micStatus) micStatus.textContent = S.lang === "ta" ? "கேட்கிறது... பேசுங்கள்" : "Listening... speak now";
    S.isListening = true;

    r.onresult = e => {
      const text = e.results[0][0].transcript;
      onText(text);
    };
    r.onend = () => {
      if (mic) mic.classList.remove("listening");
      if (micStatus) micStatus.textContent = S.lang === "ta" ? "பேச தட்டவும்" : "Tap to speak";
      S.isListening = false;
    };
    r.onerror = () => {
      if (mic) mic.classList.remove("listening");
      if (micStatus) micStatus.textContent = S.lang === "ta" ? "பேச தட்டவும்" : "Tap to speak";
      S.isListening = false;
    };
    try { r.start(); } catch (e) { console.error(e); }
  }
};

// ==========================================
// 2. CONVERSATIONAL PROFILING (Talk, Don't Type)
// ==========================================
function askQuestion() {
  const q = QUESTIONS[S.step];
  if (!q) {
    const doneText = S.lang === "ta" 
      ? "அருமை! உங்கள் திறன்கள் பதிவு செய்யப்பட்டன. உங்களுக்கான வழிகள் தயாராக உள்ளன." 
      : "Excellent! Your Skill Genome is complete. Your career routes are ready.";
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
    const retryText = S.lang === "ta" ? "புரியவில்லை, கீழே உள்ளவற்றில் ஒன்றைத் தொடவும்." : "I didn't quite catch that. Please tap an option below.";
    S.msgs.push({ who: "bot", text: retryText });
    Voice.speak(retryText);
    render();
  }
}

// Presenter 1-tap fail-safe shortcut
function fillKavya() {
  S.profile = { ...KAVYA };
  S.msgs = [
    { who: "me", text: "நான் அக்கம்பக்கத்தினருக்கு துணி தைத்துக் கொடுப்பேன் (I stitch clothes for my neighbours)" },
    { who: "bot", text: S.lang === "ta" ? "அருமை! உங்கள் சுயவிவரம் தயாராக உள்ளது." : "Splendid! Your profile is ready." }
  ];
  S.step = QUESTIONS.length;
  render();
}

// ==========================================
// 3. UI RENDERING & VIEWS
// ==========================================
const chipLabels = () => QUESTIONS.filter(q => S.profile[q.key] !== undefined).map(q => {
  const v = S.profile[q.key];
  const o = q.options.find(opt => (Array.isArray(v) ? v.includes(opt.v) : opt.v === v));
  return o ? `${o.icon} ${L(o)}` : "";
}).filter(Boolean);

const renderGenomeChips = () => {
  const labels = chipLabels();
  if (!labels.length) return "";
  return `
    <div class="genome-container">
      <div class="genome-header">
        <span>🧬 ${S.lang === "ta" ? "உங்கள் திறன் வரைபடம் (Skill Genome)" : "Skill Genome"}</span>
        <span>${labels.length} / ${QUESTIONS.length}</span>
      </div>
      <div class="chips">
        ${labels.map(c => `<span class="chip">${esc(c)}</span>`).join("")}
      </div>
    </div>`;
};

const isProfileComplete = () => S.step >= QUESTIONS.length;

function parentScriptText() {
  const c = CAREERS.find(c => c.id === S.careerId) || matchCareers(S.profile)[0] || CAREERS[0];
  const eligibleCount = eligibility(S.profile).filter(e => e.status === "eligible").length;
  const name = S.profile.name || (S.lang === "ta" ? "உங்கள் மகள் காவ்யா" : "Your daughter Kavya");
  const careerTitle = L(c.title);
  
  return S.lang === "ta"
    ? `வணக்கம். ${name} ${careerTitle} துறையில் படிக்க விரும்புகிறார். இதற்கு அரசு மற்றும் தனியார் மூலம் ${eligibleCount} உதவித்தொகைகள் கிடைக்க வாய்ப்பு உள்ளது. எதிர்பார்க்கப்படும் ஆரம்ப வருமானம் ${c.earn}. இந்த படிப்பு பாதுகாப்பானது மற்றும் ஆசிரியர் வழிகாட்டலில் விண்ணப்பிக்கலாம்.`
    : `Hello. ${name} aspires to pursue ${careerTitle}. Up to ${eligibleCount} verified scholarships are available to support this education. Expected earnings: ${c.earn}. This pathway is recognized, safe, and the school facilitator will assist with applications.`;
}

const views = {
  // --- 1. Welcome & Language Picker ---
  start: () => `
    <div class="card" style="text-align:center; padding: 24px 16px;">
      <div style="font-size: 56px; margin-bottom: 8px;">🧭</div>
      <h1>Raasta · ராஸ்தா</h1>
      <p class="muted" style="font-size: 15px; margin: 8px 0 16px;">
        Google Maps for Careers · கிராமப்புற மாணவர்களுக்கான வழிகாட்டி
      </p>
      <div style="background: var(--brand-surface); border-radius: var(--radius-md); padding: 12px; margin-bottom: 16px;">
        <span style="font-size: 14px; font-weight:600; color: var(--brand-primary);">
          🗣️ பேசுங்கள், தட்டச்சு செய்ய வேண்டாம் (Talk, Don't Type)
        </span>
      </div>
      <p style="font-size: 14px; font-weight: 600; color: var(--ink-secondary); margin-bottom: 12px;">
        மொழியைத் தேர்ந்தெடுக்கவும் / Choose your language:
      </p>
      <div class="grid-2" style="margin-bottom: 12px;">
        <button class="btn gold" data-act="lang" data-v="ta" style="min-height: 54px; font-size: 18px;">தமிழ்</button>
        <button class="btn ghost" data-act="lang" data-v="en" style="min-height: 54px; font-size: 17px;">English</button>
      </div>
      <div class="grid-2">
        <button class="btn ghost" data-act="lang" data-v="hi" style="min-height: 48px; font-size: 16px;">हिन्दी</button>
        <button class="btn ghost" data-act="lang" data-v="ml" style="min-height: 48px; font-size: 16px;">മലയാളം</button>
      </div>
    </div>
    
    <div class="demo-cue">
      <span>💡 Demo Presentation Shortcut:</span>
      <button class="btn sm ghost" data-act="kavya" style="width: auto; padding: 4px 10px;">▶ Quick Kavya</button>
    </div>`,

  // --- 2. Talk, Don't Type (Conversational Chat) ---
  talk: () => {
    const q = QUESTIONS[S.step];
    const progress = Math.min(100, Math.round((S.step / QUESTIONS.length) * 100));

    return `
      <!-- Progress Bar -->
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; font-weight:600; color:var(--ink-secondary);">
        <span>${S.lang === "ta" ? "சுயவிவரப் பதிவு" : "Building Skill Genome"}</span>
        <span>${S.step} / ${QUESTIONS.length} (${progress}%)</span>
      </div>
      <div style="height:6px; background:var(--border-subtle); border-radius:var(--radius-full); overflow:hidden;">
        <div style="width:${progress}%; height:100%; background:var(--brand-primary); transition:width 0.3s ease;"></div>
      </div>

      <!-- Chat Feed -->
      <div class="chat-feed">
        ${S.msgs.map(m => `
          <div class="bubble ${m.who === 'bot' ? 'bot' : 'me'}">
            ${esc(m.text)}
            ${m.who === 'bot' ? `<button class="audio-read-btn" data-act="read" data-t="${esc(m.text)}" title="Listen aloud">🔊</button>` : ''}
          </div>
        `).join("")}
      </div>

      <!-- Collected Genome Chips -->
      ${renderGenomeChips()}

      <!-- Question Answer Options (if question active) -->
      ${q ? `
        <div style="margin-top: 4px;">
          <div style="font-size: 13.5px; font-weight: 600; color: var(--ink-secondary); margin-bottom: 8px;">
            👇 ${S.lang === "ta" ? "பொருத்தமான ஒன்றைத் தொடவும் அல்லது பேசவும்:" : "Tap an option or speak below:"}
          </div>
          <div class="${q.options.length > 4 ? 'grid-3' : 'grid-2'}">
            ${q.options.map((o, idx) => `
              <button class="opt-btn" data-act="opt" data-i="${idx}">
                <span class="icon">${o.icon}</span>
                <span>${esc(L(o))}</span>
              </button>
            `).join("")}
          </div>
        </div>

        <!-- Voice & Type Bar -->
        <div class="card" style="padding: 10px 14px; margin-top: 6px;">
          <div class="voice-controls">
            <button class="mic-btn" id="mic" data-act="mic" title="${S.lang === 'ta' ? 'குரல் மூலம் பேசவும்' : 'Speak'}">
              <svg viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
            </button>
            <div class="text-input-wrap">
              <input type="text" id="typed" placeholder="${S.lang === 'ta' ? 'அல்லது இங்கே எழுதவும்...' : 'or type your answer...'}">
              <div id="micStatus" style="font-size: 11px; color: var(--ink-tertiary); margin-top: 4px;">
                ${S.lang === "ta" ? "பேச மைக் பட்டனைத் தொடவும்" : "Tap mic to speak"}
              </div>
            </div>
          </div>
        </div>

        <!-- Presenter Shortcut -->
        <div class="demo-cue" style="margin-top:4px;">
          <span>🎯 Live Demo Preset:</span>
          <button class="btn sm ghost" data-act="kavya" style="width:auto; padding:3px 8px;">▶ Demo: Kavya's Answers</button>
        </div>
      ` : `
        <button class="btn gold" data-act="go" data-v="careers" style="margin-top: 12px; font-size: 17px; padding: 16px;">
          🧭 ${S.lang === 'ta' ? 'உங்களுக்கான வழிகளைப் பார்க்கவும்' : 'See My Matched Routes'} →
        </button>
      `}
    `;
  },

  // --- 3. Careers ("Your Routes") ---
  careers: () => {
    const matched = matchCareers(S.profile);
    return `
      <div>
        <h1>${S.lang === "ta" ? "உங்களுக்கான தொழில் வழிகள்" : "Career Routes for You"}</h1>
        <p class="muted">
          ${S.lang === "ta" ? "உங்கள் திறன்கள் மற்றும் ஆர்வங்களின் அடிப்படையில் அமைந்தவை" : "Personalized paths based on your Skill Genome"}
        </p>
      </div>

      ${renderGenomeChips()}

      <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 4px;">
        ${matched.map(c => `
          <div class="career-card">
            <div class="row between">
              <span class="tag-badge tag-${c.type}">${c.type}</span>
              <button class="audio-read-btn" data-act="read" data-t="${esc(L(c.title))}. ${esc(c.why)}. ${esc(c.earn)}">🔊</button>
            </div>
            <h2>${esc(L(c.title))}</h2>
            <div class="muted" style="color: var(--ink-secondary);">💡 ${esc(c.why)}</div>
            <div class="earn-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 18V6"></path></svg>
              <span>${esc(c.earn)}</span>
            </div>
            <button class="btn" data-act="career" data-v="${c.id}">
              🗺️ ${S.lang === "ta" ? "கல்விப் பாதையைப் பார்" : "See Pathway"}
            </button>
          </div>
        `).join("")}
      </div>
    `;
  },

  // --- 4. Opportunity Radar (Deterministic Rules) ---
  radar: () => {
    const opps = eligibility(S.profile);
    const eligibleCount = opps.filter(o => o.status === "eligible").length;

    return `
      <div>
        <h1>🎯 Opportunity Radar</h1>
        <p class="muted">
          ${S.lang === "ta" 
            ? "அரசு விதிகளின்படி நீங்கள் பெறக்கூடிய உதவித்தொகைகள். (AI முடிவு செய்யாது)" 
            : "Evaluated by deterministic rules engine, not AI. Every scheme links to official gazette."}
        </p>
      </div>

      <div class="card-highlight" style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size: 13px; font-weight: 600; color: var(--brand-primary);">${S.lang === "ta" ? "உங்களுக்குக் கிடைக்கும் உதவி" : "Verified Opportunities"}</div>
          <div style="font-size: 20px; font-weight: 700;">${eligibleCount} ${S.lang === "ta" ? "திட்டங்களுக்கு தகுதி" : "Eligible Schemes"}</div>
        </div>
        <div style="font-size: 32px;">🎓</div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 4px;">
        ${opps.map(o => `
          <div class="card" style="border-left: 4px solid ${{ eligible: "var(--status-eligible-ink)", maybe: "var(--status-maybe-ink)", not_eligible: "var(--status-not-eligible-ink)" }[o.status]};">
            <div class="row between">
              <h3 style="flex:1;">${esc(o.name)}</h3>
              <span class="status-pill ${o.status}">
                ${{ eligible: "✅ Eligible", maybe: "❔ Maybe", not_eligible: "✖ Not Eligible" }[o.status]}
              </span>
            </div>

            <div class="benefit-callout">💰 ${esc(o.benefit)}</div>

            <ul class="reasons-list">
              ${o.reasons.map(r => `
                <li>
                  <span>${r.passed === true ? "✅" : r.passed === false ? "❌" : "❔"}</span>
                  <span style="${r.passed === false ? 'color: var(--status-not-eligible-ink); font-weight: 600;' : ''}">${esc(r.text)}</span>
                </li>
              `).join("")}
            </ul>

            <div class="row between" style="margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--border-subtle);">
              <a href="${o.source_url}" target="_blank" rel="noopener" class="official-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                ${S.lang === "ta" ? "அதிகாரப்பூர்வ இணையதளம்" : "Official portal"}
              </a>
              ${o.verified ? `<span style="font-size:11px; color:var(--status-eligible-ink); font-weight:600;">🛡️ Verified</span>` : `<span class="verify-notice">⚠ Demo rule</span>`}
            </div>
          </div>
        `).join("")}
      </div>
    `;
  },

  // --- 5. My Pathway & Parent Mode ---
  pathway: () => {
    const c = CAREERS.find(c => c.id === S.careerId) || matchCareers(S.profile)[0] || CAREERS[0];
    S.careerId = c.id;

    return `
      <div>
        <div class="row between">
          <span class="tag-badge tag-${c.type}">${c.type}</span>
          <button class="btn sm ghost" data-act="go" data-v="careers" style="width:auto;">← ${S.lang === 'ta' ? 'அனைத்து வழிகள்' : 'All Routes'}</button>
        </div>
        <h1 style="margin-top:4px;">🗺️ ${esc(L(c.title))}</h1>
        <p class="muted">💡 ${esc(c.why)}</p>
      </div>

      <!-- Parent Mode Golden Moment -->
      <div class="parent-box">
        <div class="row between">
          <b style="color: #92400E; font-size: 15px;">👨‍👩‍👧 Parent Mode · பெற்றோர் வழிகாட்டி</b>
          <span style="font-size: 12px; background: rgba(217, 119, 6, 0.2); padding: 2px 8px; border-radius: var(--radius-full); font-weight: 600;">Tamil Audio</span>
        </div>
        <p style="font-size: 13.5px; color: #78350F; margin: 0;">
          ${S.lang === "ta" 
            ? "உங்கள் குடும்பத்தினருக்கு இந்த படிப்பின் பாதுகாப்பு, உதவித்தொகை மற்றும் வருமான விவரங்களை தமிழில் ஒலிவடிவில் கேட்கச் செய்யுங்கள்." 
            : "Play a respectful audio summary in regional dialect for family covering safety, cost, and earnings."}
        </p>
        <button class="btn gold" data-act="parent" style="min-height: 52px; font-size: 16px;">
          🔊 ${S.lang === "ta" ? "பெற்றோருக்கு ஒலிக்கவும் (Play Audio)" : "Play for Family 🔊"}
        </button>
        <div id="parentTextWrap" style="display:none;" class="parent-transcript">
          <div id="parentText"></div>
        </div>
      </div>

      <!-- Vertical Roadmap ("Raasta") -->
      <div class="card">
        <h3>🛣️ ${S.lang === "ta" ? "படிப்பு மற்றும் வேலைவாய்ப்பு வழி (Raasta)" : "Week-by-Week Learning Pathway"}</h3>
        <div class="pathway-timeline">
          ${c.path.map((p, i) => `
            <div class="timeline-step">
              <div class="step-week">Week ${i * 2 + 1} - ${i * 2 + 2}</div>
              <div class="step-goal">${esc(p[0])}</div>
              ${p[2] 
                ? `<a href="${p[2]}" target="_blank" rel="noopener" class="official-link">🔗 ${esc(p[1])}</a>` 
                : `<span class="muted">${esc(p[1])}</span>`}
            </div>
          `).join("")}
        </div>
      </div>

      <!-- Entrance Exams -->
      <div class="card">
        <h3>📝 ${S.lang === "ta" ? "தேவையான நுழைவுத் தேர்வுகள்" : "Required Exams & Admissions"}</h3>
        <div style="margin-top: 8px;">
          ${c.exams.map(e => `<span class="chip" style="margin-right: 6px; margin-bottom: 6px;">📋 ${esc(e)}</span>`).join("")}
        </div>
      </div>

      <button class="btn" data-act="go" data-v="radar">
        🎯 ${S.lang === "ta" ? "இவர்களுக்கான உதவித்தொகைகளைப் பார்" : "View Eligible Scholarships"} →
      </button>
    `;
  },

  // --- 6. Facilitator Mode (Teacher Dashboard) ---
  facilitator: () => {
    const rows = STUDENTS.map(s => {
      const isDemoKavya = s.name === "Kavya" && isProfileComplete();
      const currentProfile = isDemoKavya ? S.profile : s;
      return {
        s: currentProfile,
        student_id: s.student_id,
        name: s.name,
        top: matchCareers(currentProfile)[0],
        eligibleCount: eligibility(currentProfile).filter(e => e.status === "eligible").length,
        flag: talentFlag(currentProfile)
      };
    });

    return `
      <div>
        <h1>👩‍🏫 Facilitator Mode</h1>
        <p class="muted">Govt Higher Secondary School, Villupuram · 60+ Students Cohort</p>
      </div>

      <div class="card" style="padding:12px; display:flex; justify-content:space-around; text-align:center;">
        <div>
          <div style="font-size:22px; font-weight:700; color:var(--brand-primary);">${rows.length}</div>
          <div class="muted" style="font-size:12px;">Active Students</div>
        </div>
        <div style="border-right:1px solid var(--border-subtle);"></div>
        <div>
          <div style="font-size:22px; font-weight:700; color:var(--accent-gold);">${rows.filter(r => r.flag).length}</div>
          <div class="muted" style="font-size:12px;">⭐ Talent Flags</div>
        </div>
        <div style="border-right:1px solid var(--border-subtle);"></div>
        <div>
          <div style="font-size:22px; font-weight:700; color:var(--status-eligible-ink);">${Object.keys(S.recommended).length}</div>
          <div class="muted" style="font-size:12px;">Recommended</div>
        </div>
      </div>

      <div class="card" style="padding: 10px; overflow-x: auto;">
        <table class="students-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Top Route</th>
              <th>Eligible</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(({ s, student_id, name, top, eligibleCount, flag }) => `
              <tr>
                <td>
                  <b>${esc(name)}</b>
                  ${flag ? `<span class="talent-star" title="AI Talent Flag (High marks / multiple skills)">⭐</span>` : ""}
                  <div class="muted" style="font-size:11px;">${esc(s.district || "Villupuram")}</div>
                </td>
                <td style="font-size:12.5px;">${top ? esc(top.title.en) : "-"}</td>
                <td style="font-weight:700; color:var(--brand-primary);">${eligibleCount}</td>
                <td>
                  ${S.recommended[student_id] 
                    ? `<span style="color:var(--status-eligible-ink); font-weight:700; font-size:12px;">✅ Sent</span>` 
                    : `<button class="btn sm" data-act="rec" data-v="${student_id}" style="padding:4px 8px; font-size:12px;">Recommend</button>`}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <p class="muted" style="font-size: 12px; margin-top: 4px;">
        ⭐ = AI Talent Flag (Marks $\ge$80% or multiple practical skills). The teacher verifies and endorses.
      </p>
    `;
  }
};

// ==========================================
// 4. MAIN RENDER LOOP & EVENT DISPATCHER
// ==========================================
function render() {
  const currentView = S.lang ? S.view : "start";
  $("#view").innerHTML = (views[currentView] || views.start)();
  
  const nav = $("#nav");
  if (nav) nav.style.display = S.lang ? "grid" : "none";
  
  document.querySelectorAll("nav button").forEach(b => {
    b.classList.toggle("on", b.dataset.v === currentView);
    // Allow navigation if profile is complete or for facilitator mode
    b.disabled = b.dataset.v !== "talk" && b.dataset.v !== "facilitator" && !isProfileComplete();
  });

  const typedInput = $("#typed");
  if (typedInput) {
    typedInput.onkeydown = e => {
      if (e.key === "Enter" && typedInput.value.trim()) {
        processSpeechInput(typedInput.value.trim());
      }
    };
  }
  window.scrollTo(0, 0);
}

function navigateTo(viewName) {
  S.view = viewName;
  render();
}

// Global click event handler
document.addEventListener("click", e => {
  const target = e.target.closest("[data-act], nav button, #themeToggle, #brandLink");
  if (!target) return;

  if (target.id === "brandLink") {
    e.preventDefault();
    if (S.lang) navigateTo("talk");
    return;
  }

  if (target.id === "themeToggle") {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    document.documentElement.setAttribute("data-theme", isDark ? "light" : "dark");
    return;
  }

  // Bottom navigation tab click
  if (target.tagName === "BUTTON" && target.closest("nav") && target.dataset.v) {
    return navigateTo(target.dataset.v);
  }

  const action = target.dataset.act;
  if (!action) return;

  if (action === "lang") {
    S.lang = target.dataset.v;
    S.view = "talk";
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
    const script = parentScriptText();
    const wrap = $("#parentTextWrap");
    const textBox = $("#parentText");
    if (wrap && textBox) {
      wrap.style.display = "block";
      textBox.textContent = "🔊 " + script;
    }
    Voice.speak(script, S.lang || "ta");
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
});

// Network status listener
function updateNetworkStatus() {
  const isOnline = navigator.onLine;
  const netBadge = $("#net");
  const netText = $("#netText");
  if (netBadge && netText) {
    if (isOnline) {
      netBadge.classList.remove("offline");
      netText.textContent = "online";
    } else {
      netBadge.classList.add("offline");
      netText.textContent = S.lang === "ta" ? "ஆஃப்லைன்: செயல்படும்" : "offline: working";
    }
  }
}

window.addEventListener("online", updateNetworkStatus);
window.addEventListener("offline", updateNetworkStatus);
updateNetworkStatus();

// Service Worker Registration for Offline First
try {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
} catch (e) {}

// Initial Render
render();
