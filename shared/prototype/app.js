// Raasta POC UI. Vanilla JS, no build step. Swap mock logic for API calls later:
// see API_BASE + api() below; every screen already uses the API contract's shapes.

const API_BASE = null; // e.g. "http://localhost:8000/api" once Gautam's FastAPI is up
const S = { lang: null, profile: { state: "TN", disability: false }, step: 0, msgs: [], careerId: null,
            recommended: (() => { try { return JSON.parse(localStorage.getItem("raasta_rec") || "{}"); } catch { return {}; } })(), view: "talk" };

const $ = sel => document.querySelector(sel);
const L = (o, k = "") => (S.lang === "ta" ? o.ta ?? o[k + "ta"] : o.en ?? o[k + "en"]);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ---------- voice ----------
function speak(text, lang = S.lang) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "ta" ? "ta-IN" : "en-IN";
  const v = speechSynthesis.getVoices().find(v => v.lang === u.lang);
  if (v) u.voice = v;
  u.rate = 0.95;
  speechSynthesis.speak(u);
}
const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
function listen(onText) {
  if (!Rec) { alert("Voice input needs Chrome. Tap an option or type instead."); return; }
  const r = new Rec(); r.lang = S.lang === "ta" ? "ta-IN" : "en-IN"; r.interimResults = false;
  const mic = $("#mic"); mic && mic.classList.add("live");
  r.onresult = e => onText(e.results[0][0].transcript);
  r.onend = () => mic && mic.classList.remove("live");
  r.onerror = () => mic && mic.classList.remove("live");
  r.start();
}

// ---------- conversation (POC: keyword extraction; backend swaps in the LLM) ----------
function ask() {
  const q = QUESTIONS[S.step];
  if (!q) {
    const done = S.lang === "ta" ? "நன்றி! உங்களுக்கான வழிகள் தயார்." : "Thank you! Your routes are ready.";
    S.msgs.push({ who: "bot", text: done }); speak(done); render(); return;
  }
  S.msgs.push({ who: "bot", text: L(q) }); speak(L(q)); render();
}
function answer(opt, heard) {
  const q = QUESTIONS[S.step];
  S.msgs.push({ who: "me", text: heard || `${opt.icon} ${L(opt)}` });
  S.profile[q.key] = q.key === "interests" ? [opt.v] : opt.v;
  S.step++; ask();
}
function fromSpeech(text) {
  const q = QUESTIONS[S.step]; if (!q) return;
  const t = text.toLowerCase();
  const opt = q.options.find(o => o.kw.some(k => t.includes(k.toLowerCase())));
  if (opt) answer(opt, text);
  else { S.msgs.push({ who: "me", text }); S.msgs.push({ who: "bot", text: S.lang === "ta" ? "புரியவில்லை, கீழே ஒன்றைத் தொடவும்." : "Sorry, please tap one below." }); render(); }
}
function fillKavya() {
  S.profile = { ...KAVYA };
  S.msgs = [{ who: "me", text: "நான் அக்கம்பக்கத்தினருக்கு துணி தைத்துக் கொடுப்பேன் (I stitch clothes for my neighbours)" },
            { who: "bot", text: S.lang === "ta" ? "அருமை! உங்கள் சுயவிவரம் தயார்." : "Lovely! Your profile is ready." }];
  S.step = QUESTIONS.length; render();
}

// ---------- screens ----------
const chipLabels = () => QUESTIONS.filter(q => S.profile[q.key] !== undefined).map(q => {
  const v = S.profile[q.key]; const o = q.options.find(o => (Array.isArray(v) ? v.includes(o.v) : o.v === v));
  return o ? `${o.icon} ${L(o)}` : "";
});
const profileChips = () => `<div class="chips">${chipLabels().map(c => `<span class="chip">${esc(c)}</span>`).join("")}</div>`;
const profileDone = () => S.step >= QUESTIONS.length;

const views = {
  start: () => `
    <div class="card" style="text-align:center">
      <div style="font-size:56px">🧭</div>
      <h2>Raasta · ராஸ்தா</h2>
      <p class="muted">Google Maps for careers. Choose your language.</p>
    </div>
    <button class="btn" data-act="lang" data-v="ta">தமிழ்</button>
    <button class="btn ghost" data-act="lang" data-v="en">English</button>`,

  talk: () => {
    const q = QUESTIONS[S.step];
    return `
    <div class="chat">${S.msgs.map(m => `<div class="bubble ${m.who === "bot" ? "bot" : "me"}">${esc(m.text)}</div>`).join("")}</div>
    ${profileChips()}
    ${q ? `<div class="grid">${q.options.map((o, i) => `<button class="opt" data-act="opt" data-i="${i}"><span>${o.icon}</span>${esc(L(o))}</button>`).join("")}</div>
      <div class="row" style="align-items:center">
        <button class="mic" id="mic" data-act="mic" title="Speak">🎙️</button>
        <input type="text" id="typed" placeholder="${S.lang === "ta" ? "அல்லது தட்டச்சு செய்யவும்" : "or type here"}">
      </div>
      <button class="btn ghost" data-act="kavya">▶ Demo: Kavya's answers</button>`
    : `<button class="btn" data-act="go" data-v="careers">🧭 ${S.lang === "ta" ? "என் வழிகளைப் பார்" : "See my routes"}</button>`}`;
  },

  careers: () => `
    <h2>${S.lang === "ta" ? "உங்களுக்கான வழிகள்" : "Routes for you"}</h2>${profileChips()}
    ${matchCareers(S.profile).map(c => `
      <div class="card">
        <span class="tag">${c.type}</span>
        <h2>${esc(L(c.title))}</h2>
        <div class="muted">💡 ${esc(c.why)}</div>
        <div style="margin:6px 0">💰 ${esc(c.earn)}</div>
        <button class="btn ghost" data-act="career" data-v="${c.id}">🗺️ ${S.lang === "ta" ? "பாதையைப் பார்" : "See pathway"}</button>
      </div>`).join("")}`,

  radar: () => `
    <h2>🎯 Opportunity Radar</h2>
    <div class="muted">Eligibility is decided by a rules engine on this phone, not by AI. Every result links to its official source.</div>
    ${eligibility(S.profile).map(o => `
      <div class="card">
        <div class="row" style="justify-content:space-between;align-items:center">
          <b>${esc(o.name)}</b><span class="status ${o.status}">${{ eligible: "✅ Eligible", maybe: "❔ Maybe", not_eligible: "✖ Not eligible" }[o.status]}</span>
        </div>
        <div class="muted">${esc(o.benefit)}</div>
        <ul class="reasons">${o.reasons.map(r => `<li>${r.passed === true ? "✅" : r.passed === false ? "❌" : "❔"} ${esc(r.text)}</li>`).join("")}</ul>
        <a href="${o.source_url}" target="_blank" rel="noopener">🔗 Official source</a>
        ${o.verified ? "" : `<div class="verify">⚠ Demo rule, not yet verified</div>`}
      </div>`).join("")}`,

  pathway: () => {
    const c = CAREERS.find(c => c.id === S.careerId) || matchCareers(S.profile)[0];
    if (!c) return `<div class="card">Finish the Talk step first.</div>`;
    S.careerId = c.id;
    return `
    <h2>🗺️ ${esc(L(c.title))}</h2>
    <div class="card">${c.path.map((p, i) => `<div class="week"><b>Week ${i * 2 + 1}-${i * 2 + 2}</b><div>${esc(p[0])}<br>${p[2] ? `<a href="${p[2]}" target="_blank" rel="noopener">${esc(p[1])}</a>` : `<span class="muted">${esc(p[1])}</span>`}</div></div>`).join("")}</div>
    <div class="card"><b>📝 Exams:</b> ${c.exams.map(esc).join(", ")}</div>
    <button class="btn" data-act="parent">👨‍👩‍👧 Parent Mode: play for family</button>
    <div class="card muted" id="parentText" style="display:none"></div>`;
  },

  facilitator: () => {
    const rows = STUDENTS.map(s => ({ ...s, ...(s.name === "Kavya" && profileDone() ? S.profile : {}) })).map(s => ({
      s, top: matchCareers(s)[0], n: eligibility(s).filter(e => e.status === "eligible").length, flag: talentFlag(s) }));
    return `
    <h2>👩‍🏫 Facilitator Mode</h2>
    <div class="muted">Govt HSS, Villupuram · ${rows.length} students</div>
    <div class="card"><table>
      <tr><th>Student</th><th>Top route</th><th>Eligible</th><th></th></tr>
      ${rows.map(({ s, top, n, flag }) => `<tr>
        <td>${esc(s.name)} ${flag ? `<span class="flag" title="Talent flag">⭐</span>` : ""}</td>
        <td>${top ? esc(top.title.en) : "-"}</td><td>${n}</td>
        <td>${S.recommended[s.student_id] ? "✅" : `<button class="opt" style="padding:6px" data-act="rec" data-v="${s.student_id}">Recommend</button>`}</td>
      </tr>`).join("")}
    </table></div>
    <div class="muted">⭐ = AI talent flag (strong marks or multiple skills). The teacher decides.</div>`;
  }
};

function parentScript() {
  const c = CAREERS.find(c => c.id === S.careerId);
  const n = eligibility(S.profile).filter(e => e.status === "eligible").length;
  const name = S.profile.name || (S.lang === "ta" ? "உங்கள் பிள்ளை" : "Your child");
  return S.lang === "ta"
    ? `வணக்கம். ${name} ${c.title.ta} துறையில் படிக்க விரும்புகிறார். இதற்கு ${n} உதவித்தொகைகள் கிடைக்க வாய்ப்பு உள்ளது. எதிர்பார்க்கப்படும் வருமானம் ${c.earn}. ஆசிரியர் உதவியுடன் விண்ணப்பிக்கலாம்.`
    : `Hello. ${name} wants to pursue ${c.title.en}. ${n} scholarships may be available. Expected earnings: ${c.earn}. The teacher can help you apply.`;
}

// ---------- render + events ----------
function render() {
  const v = S.lang ? S.view : "start";
  $("#view").innerHTML = views[v]();
  $("#nav").style.display = S.lang ? "grid" : "none";
  document.querySelectorAll("nav button").forEach(b => {
    b.classList.toggle("on", b.dataset.v === v);
    b.disabled = b.dataset.v !== "talk" && b.dataset.v !== "facilitator" && !profileDone();
  });
  const typed = $("#typed");
  if (typed) typed.onkeydown = e => { if (e.key === "Enter" && typed.value.trim()) fromSpeech(typed.value.trim()); };
  window.scrollTo(0, document.body.scrollHeight);
}
function go(v) { S.view = v; render(); window.scrollTo(0, 0); }

document.addEventListener("click", e => {
  const b = e.target.closest("[data-act], nav button"); if (!b) return;
  if (!b.dataset.act) return go(b.dataset.v);
  const a = b.dataset.act;
  if (a === "lang") { S.lang = b.dataset.v; S.view = "talk"; ask(); }
  if (a === "opt") answer(QUESTIONS[S.step].options[+b.dataset.i]);
  if (a === "mic") listen(fromSpeech);
  if (a === "kavya") fillKavya();
  if (a === "go") go(b.dataset.v);
  if (a === "career") { S.careerId = b.dataset.v; go("pathway"); }
  if (a === "parent") { const t = parentScript(); const box = $("#parentText"); box.style.display = "block"; box.textContent = "🔊 " + t; speak(t); }
  if (a === "rec") { S.recommended[b.dataset.v] = true; try { localStorage.setItem("raasta_rec", JSON.stringify(S.recommended)); } catch {} render(); }
});

function netStatus() { $("#net").textContent = navigator.onLine ? "online" : "✈ offline: still works"; }
addEventListener("online", netStatus); addEventListener("offline", netStatus); netStatus();
try { if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {}); } catch {}
render();
