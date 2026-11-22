const API = location.port === "8000" ? "" : "http://127.0.0.1:8000";
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const S = {
  view: "start",
  session: null,
  screen: null,
  msgs: [],
  jobs: null,
  job: null,
  road: null,
  facts: [],
  busy: false,
  error: "",
  listening: false,
};

const COST = { free: "Free", low: "Low cost", medium: "Medium cost", high: "High cost" };

const AiLog = (() => {
  const box = document.createElement("aside");
  box.id = "ai-log";
  box.innerHTML = `<strong>AI calls</strong><div class="ai-rows"><p class="ai-empty">No AI call yet.</p></div>`;
  document.body.appendChild(box);
  const rows = box.querySelector(".ai-rows");
  const items = [];
  const quiet = {
    "/api/start": "English start. These questions are already on the server.",
    "/api/answer": "Your choice was saved on the server.",
    "/api/job": "Job saved. The next questions are already on the server.",
    "/api/jobs": "Jobs were already generated.",
    "/api/retry": "Nothing new to ask the model.",
  };
  const clock = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  function paint() {
    rows.innerHTML = items.length
      ? items.slice(0, 8).map((item) => {
        if (item.pending) return `<p class="ai-wait">${item.time} Checking the server…</p>`;
        if (item.none) return `<p class="ai-off"><b>No AI</b> ${esc(item.purpose)}<small>${item.time}</small></p>`;
        const mark = item.ok === false ? "AI failed" : "AI";
        return `<p class="ai-on"><b>${mark}</b> ${esc(item.purpose)}<small>${esc(item.model || "")} · ${item.time}</small></p>`;
      }).join("")
      : `<p class="ai-empty">No AI call yet.</p>`;
  }
  return {
    wait() { items.unshift({ pending: true, time: clock() }); paint(); },
    done(calls, path, failed) {
      if (items[0] && items[0].pending) items.shift();
      const time = clock();
      let next;
      if (failed && !Array.isArray(calls)) next = [{ ok: false, purpose: "Server error before the model replied." }];
      else if (!calls || !calls.length) next = [{ none: true, purpose: quiet[path] || "No model call." }];
      else next = calls;
      items.unshift(...next.map((item) => ({ ...item, time })));
      items.splice(12);
      paint();
    },
  };
})();

function speak(text) {
  if (!text || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-IN";
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

async function post(path, body) {
  AiLog.wait();
  const res = await fetch(API + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || data.detail || res.statusText);
    err.ai = data.ai;
    AiLog.done(err.ai, path, true);
    throw err;
  }
  AiLog.done(data.ai, path);
  return data;
}

function topbar(title, eyebrow, desc = "") {
  return `<div class="page-heading"><div class="eyebrow">${eyebrow}</div><h1>${title}</h1>${desc ? `<p>${desc}</p>` : ""}</div>`;
}

function welcome() {
  return `<section class="welcome"><div class="atlas-mark" aria-hidden="true"><svg viewBox="0 0 120 120"><path d="M12 92C42 92 34 36 68 36s18 48 42 48" fill="none" stroke="#176f50" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 10"/><circle cx="12" cy="92" r="8" fill="#c78b3e"/><circle cx="68" cy="36" r="8" fill="#176f50"/><path d="M94 82l16 2-10 13z" fill="#176f50"/></svg></div><div class="eyebrow">RAASTA · THE FIELD ATLAS</div><h1>Find your way forward</h1><p>Start with your voice, or tap an answer. Raasta will find a route, the money help that fits, and a note for your family.</p><button class="primary-action" data-act="start">Talk, Don’t Type <span aria-hidden="true">→</span></button></section>`;
}

function talk() {
  const q = S.screen && S.screen.type === "question" ? S.screen : null;
  const waiting = S.busy ? `<div class="message bot">Thinking…</div>` : "";
  const err = S.error ? `<div class="notice-block"><strong>Something went wrong</strong><p>${esc(S.error)}</p><button class="secondary-action" data-act="retry">Try again</button></div>` : "";
  const options = q && !S.busy ? `<p class="prompt-hint">${q.intro ? esc(q.intro) : "Choose the answer that feels right"}</p><div class="answer-list">${q.options.map((o, i) => `<button class="answer-option" data-act="opt" data-i="${i}"><span>${esc(o)}</span><span aria-hidden="true">→</span></button>`).join("")}</div><button class="mic-action ${S.listening ? "is-listening" : ""}" data-act="mic" aria-pressed="${S.listening}"><span class="mic-glyph" aria-hidden="true">${S.listening ? "Ⅱ" : "●"}</span><span>${S.listening ? "Listening…" : "Speak instead"}</span></button>` : "";
  return `<div class="talk-view">${topbar("Talk, Don’t Type", "IN YOUR OWN WORDS", "Tap an answer to continue. Speak if the microphone is available.")}<div class="chat-stream" aria-live="polite">${S.msgs.map((m) => `<div class="message ${m.who}">${esc(m.text)}${m.who === "bot" ? `<button class="listen-link" data-act="read" data-t="${esc(m.text)}">Listen</button>` : ""}</div>`).join("")}${waiting}</div>${err}${options}</div>`;
}

function routes() {
  const jobs = S.jobs || [];
  if (!jobs.length) {
    return `${topbar("Your routes", "POSSIBLE CAREER ROUTES", "Finish the conversation first. Routes appear when a field fits you.")}`;
  }
  return `<section class="atlas-intro"><div class="eyebrow">POSSIBLE CAREER ROUTES</div><h1>A route that starts with you</h1><p>These are different ways into the same kind of work. Vocational routes are shown with the same respect as longer ones.</p><div class="route-map" aria-hidden="true"><svg viewBox="0 0 340 92"><path d="M14 68 C90 68 77 22 150 22 S220 72 326 30" fill="none" stroke="#9db7a5" stroke-width="3" stroke-dasharray="5 7"/><circle cx="18" cy="68" r="7" fill="#d69742"/><circle cx="150" cy="22" r="7" fill="#177755"/><circle cx="326" cy="30" r="7" fill="#177755"/></svg><div class="map-labels"><span>Today</span><span>Learn</span><span>First pay</span></div></div></section>${jobs.map((j, i) => `<article class="route-item"><div class="route-index">0${i + 1}</div><div class="route-content"><div class="route-type">${esc(j.emoji || "Route")}</div><h2>${esc(j.title)}</h2><p>${esc(j.what)}</p><div class="route-meta">${esc(j.time_to_earn || "Time varies")} · indicative</div><button class="text-action" data-act="job" data-i="${i}">Explore this route <span aria-hidden="true">→</span></button></div></article>`).join("")}`;
}

function schemesOnRoad() {
  const steps = S.road && S.road.steps ? S.road.steps : [];
  const seen = new Set();
  const list = [];
  steps.forEach((step) => (step.schemes || []).forEach((scheme) => {
    if (seen.has(scheme.id)) return;
    seen.add(scheme.id);
    list.push({ ...scheme, step: step.title });
  }));
  return list;
}

function radar() {
  const items = schemesOnRoad();
  if (!S.road) {
    return `${topbar("Opportunity Radar", "OPPORTUNITIES TO CHECK", "Schemes appear after you pick a route and answer the family questions.")}`;
  }
  if (!items.length) {
    return `${topbar("Opportunity Radar", "OPPORTUNITIES TO CHECK")}<div class="notice-block"><strong>No scheme matched this road</strong><p>The checked list had nothing that fits this route and this family. Plan the cost together.</p></div>`;
  }
  return `${topbar("Opportunity Radar", "OPPORTUNITIES TO CHECK", "Amounts come from the checked list on the server. Open the official page before you apply.")}${items.map((m) => `<article class="opportunity"><div class="opportunity-top"><div class="eyebrow">${esc(m.step)}</div><span class="status-label">${m.best ? "Best match" : "Possible"}</span></div><h2>${esc(m.name)}</h2><div class="benefit">${esc(m.line || m.pays)}</div><ul><li><span class="rule-mark">✓</span>${esc(m.who)}</li>${(m.notes || []).map((n) => `<li><span class="rule-mark">?</span>${esc(n)}</li>`).join("")}</ul><a class="source-action" href="${esc(m.url)}" target="_blank" rel="noopener">Open official source <span aria-hidden="true">↗</span></a><p class="route-meta">Checked ${esc(m.checked)} · ${esc(m.source)}</p></article>`).join("")}`;
}

function roadBox(st, i) {
  const here = i === 0;
  const kicker = `${here ? "You are here" : "Step " + (i + 1)} · ${esc(st.duration)} · ${esc(COST[st.cost_level] || st.cost_level)}`;
  const slots = [];
  if (st.places && st.places.length) slots.push(`<div class="road-box-slot"><span>Where</span><strong>${st.places.map(esc).join(" · ")}</strong></div>`);
  if (st.exams && st.exams.length) slots.push(`<div class="road-box-slot"><span>Exam</span><strong>${st.exams.map(esc).join(" · ")}</strong></div>`);
  if (st.prepare && st.prepare.length) slots.push(`<div class="road-box-slot"><span>Learn</span><strong>${st.prepare.map((p) => `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.name)} ↗</a>`).join("")}</strong></div>`);
  (st.schemes || []).slice(0, 1).forEach((m) => slots.push(`<div class="road-box-slot road-box-money"><span>Money help</span><strong>${esc(m.name)}</strong><em>${esc(m.line || m.pays)}</em></div>`));
  return `<article class="road-box${here ? " is-here" : ""}"><div class="road-box-head"><span class="road-box-num">${i + 1}</span><span class="road-box-kicker">${kicker}</span></div><h2>${esc(st.title)}</h2><p>${esc(st.what)}</p>${slots.join("")}</article>`;
}

function pathway() {
  if (!S.road) {
    return `${topbar("My Pathway", "YOUR RAASTA", "Pick a route first. The road is drawn from where you are now to the first pay.")}`;
  }
  const road = S.road;
  const join = `<div class="road-join" aria-hidden="true"></div>`;
  const last = road.steps[road.steps.length - 1];
  const end = last && last.title === road.job.title ? "" : `${join}<article class="road-box is-end"><div class="road-box-head"><span class="road-box-num">✓</span><span class="road-box-kicker">First pay</span></div><h2>${esc(road.job.title)}</h2><p>${esc(road.job.what || "This is the work the road leads to.")}</p></article>`;
  return `${topbar(esc(road.job.title), "MY PATHWAY", esc(road.summary || road.job.what || ""))}<section class="parent-note"><div class="eyebrow">Parent Mode · family guide</div><p>A note your family can hear on this phone. Scheme amounts are from the checked list.</p><button class="secondary-action" data-act="parent">Hear the family note →</button><div id="parentTranscriptText" class="transcript" hidden></div></section><section class="path-section"><div class="section-kicker"><span>Your map</span></div><div class="road-map">${road.steps.map((st, i) => roadBox(st, i)).join(join)}${end}</div></section><button class="secondary-action" data-act="go" data-v="radar">Opportunity Radar →</button>`;
}

function profile() {
  const rows = S.facts.length
    ? S.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")
    : `<div><dt>About you</dt><dd>Nothing saved yet</dd></div>`;
  return `${topbar("About me", "STUDENT PROFILE", "These are the answers saved in this conversation.")}<dl class="profile-list">${rows}</dl>`;
}

function facilitator() {
  return `<div class="facilitator-view">${topbar("Facilitator Mode", "SCHOOL", "One teacher, many students. This list connects when student roads are saved.")}<div class="metrics"><div><strong>0</strong><span>Students</span></div><div><strong>0</strong><span>To review</span></div><div><strong>0</strong><span>Referred</span></div></div><div class="notice-block"><strong>No class list yet</strong><p>When a student finishes a road on this phone, the teacher can recommend the next step from here.</p></div></div>`;
}

const views = { start: welcome, talk, careers: routes, radar, pathway, profile, facilitator };

function render() {
  document.documentElement.lang = "en";
  const root = $("#viewContainer");
  root.innerHTML = (views[S.view] || welcome)();
  const chat = root.querySelector(".talk-view .chat-stream");
  if (chat) chat.scrollTop = chat.scrollHeight;
  const started = Boolean(S.session);
  $("#appNavbar").style.display = S.view === "start" ? "none" : "grid";
  $("#profileHeaderBtn").style.display = started ? "inline-flex" : "none";
  document.querySelectorAll(".app-navbar [data-v]").forEach((b) => {
    b.classList.toggle("active", b.dataset.v === S.view);
    const needsRoad = b.dataset.v === "radar" || b.dataset.v === "pathway";
    const needsJobs = b.dataset.v === "careers";
    b.disabled = (needsRoad && !S.road) || (needsJobs && !S.jobs);
  });
  const ind = $("#netIndicator");
  const lab = $("#netLabel");
  if (ind && lab) {
    ind.classList.toggle("offline", !navigator.onLine);
    lab.textContent = navigator.onLine ? "ONLINE" : "OFFLINE";
  }
}

function go(view) {
  S.view = views[view] ? view : "start";
  render();
  $("#viewContainer").scrollTop = 0;
}

function applyScreen(screen) {
  S.screen = screen;
  S.error = "";
  if (screen.type === "question") {
    if (screen.intro) S.msgs.push({ who: "bot", text: screen.intro });
    S.msgs.push({ who: "bot", text: screen.text });
    S.view = "talk";
  } else if (screen.type === "jobs") {
    S.jobs = screen.jobs;
    S.msgs.push({ who: "bot", text: "These routes fit you. Open Routes and pick one." });
    S.view = "careers";
  } else if (screen.type === "road") {
    S.road = screen.road;
    S.job = screen.road.job;
    S.msgs.push({ who: "bot", text: "Your road is ready. Open Path to walk it, or Radar for money help." });
    S.view = "pathway";
  }
  render();
}

async function call(path, body) {
  S.busy = true;
  S.error = "";
  if (S.view === "talk") render();
  try {
    const data = await post(path, body);
    if (data.session) S.session = data.session;
    S.busy = false;
    applyScreen(data.screen);
  } catch (err) {
    S.busy = false;
    S.error = err.message || "Try again.";
    S.view = "talk";
    render();
  }
}

function parentNote() {
  const parent = S.road && S.road.parent;
  if (!parent) return;
  const lines = [parent.wants, parent.cost, parent.time, parent.pay, parent.safety, parent.help, parent.scheme].filter(Boolean);
  const box = $("#parentTranscriptText");
  if (box) {
    box.hidden = false;
    box.textContent = lines.join(" ");
  }
  speak(lines.join(". "));
}

function listen() {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const q = S.screen && S.screen.type === "question" ? S.screen : null;
  if (!Rec || !q) return;
  const rec = new Rec();
  rec.lang = "en-IN";
  S.listening = true;
  render();
  rec.onresult = (ev) => {
    const said = ev.results[0][0].transcript;
    const i = q.options.findIndex((o) => said.toLowerCase().includes(o.toLowerCase().slice(0, 12)));
    S.listening = false;
    if (i >= 0) choose(i);
    else {
      S.msgs.push({ who: "me", text: said }, { who: "bot", text: "I heard you. Tap the closest answer." });
      render();
    }
  };
  rec.onerror = rec.onend = () => { S.listening = false; render(); };
  rec.start();
}

function choose(i) {
  const q = S.screen;
  if (!q || q.type !== "question" || S.busy) return;
  const label = q.options[i];
  S.facts.push([q.text, label]);
  S.msgs.push({ who: "me", text: label });
  const path = "/api/answer";
  call(path, { session: S.session, choice: i });
}

document.addEventListener("click", (e) => {
  const x = e.target.closest("[data-act], .app-navbar button, #headerBrand, #profileHeaderBtn");
  if (!x) return;
  if (x.id === "headerBrand") {
    e.preventDefault();
    return;
  }
  if (x.closest(".app-navbar")) {
    if (!x.disabled) go(x.dataset.v);
    return;
  }
  switch (x.dataset.act) {
    case "start":
      S.msgs = [];
      S.facts = [];
      S.jobs = null;
      S.road = null;
      S.view = "talk";
      call("/api/start", { lang: "en" });
      break;
    case "opt":
      choose(Number(x.dataset.i));
      break;
    case "mic":
      listen();
      break;
    case "read":
      speak(x.dataset.t || "");
      break;
    case "job":
      call("/api/job", { session: S.session, choice: Number(x.dataset.i) });
      break;
    case "go":
      go(x.dataset.v);
      break;
    case "parent":
      parentNote();
      break;
    case "retry":
      call("/api/retry", { session: S.session });
      break;
    default:
      break;
  }
});

window.addEventListener("online", render);
window.addEventListener("offline", render);
try {
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
} catch { /* offline cache is optional */ }

const logStyle = document.createElement("style");
logStyle.textContent = "#ai-log{position:fixed;top:12px;right:12px;z-index:80;width:min(300px,calc(100vw - 24px));max-height:42vh;overflow:auto;background:#10261e;color:#f6f5ef;border-radius:16px;padding:10px 12px 4px;box-shadow:0 16px 40px rgba(16,38,30,.28);font-size:13px;line-height:1.35}#ai-log strong{display:block;font-size:12px;letter-spacing:.04em;text-transform:uppercase;margin-bottom:6px}#ai-log p{margin:0 0 8px}#ai-log small{display:block;color:#b7c4bb;font-weight:600}#ai-log .ai-on b{color:#e2b15a}#ai-log .ai-off b{color:#b7c4bb}#ai-log .ai-wait{color:#f3e7d2;font-weight:800}#ai-log .ai-empty{color:#b7c4bb}.page-heading{overflow:visible!important;height:auto!important;min-height:0!important;flex:0 0 auto!important}.page-heading p{clear:both}main#viewContainer>*{flex:0 0 auto}main#viewContainer:has(.talk-view){overflow:hidden}main#viewContainer:has(.talk-view) .talk-view{display:flex;flex-direction:column;flex:1 1 auto;min-height:0;gap:12px}.talk-view .page-heading,.talk-view .prompt-hint,.talk-view .mic-action,.talk-view .notice-block{flex:0 0 auto}.talk-view .chat-stream{flex:1 1 auto;min-height:72px;overflow:auto}.talk-view .answer-list{flex:0 0 auto;min-height:168px;max-height:min(38vh,280px);overflow:auto;padding-right:4px}.road-map{display:flex;flex-direction:column;align-items:stretch}.road-box{background:#fff;border:1px solid #d7ddd4;border-radius:16px;padding:14px 14px 10px;box-shadow:0 3px 0 #d9e2d7}.road-box.is-here{border-color:#176f50;box-shadow:0 3px 0 #176f50}.road-box.is-end{background:#123d2e;color:#f6f5ef;border-color:#123d2e}.road-box.is-end p{color:#d7e3d8}.road-box-head{display:flex;align-items:center;gap:10px;margin-bottom:8px}.road-box-num{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:#176f50;color:#fff;font-size:13px;font-weight:800;flex:0 0 auto}.road-box.is-here .road-box-num{background:#bd8132}.road-box.is-end .road-box-num{background:#f6f5ef;color:#123d2e}.road-box-kicker{font-size:11px;font-weight:750;letter-spacing:.04em;text-transform:uppercase;color:#176f50;line-height:1.35}.road-box.is-end .road-box-kicker{color:#e2b15a}.road-box h2{font-size:18px;line-height:1.25;margin:0 0 6px}.road-box p{margin:0 0 8px;font-size:14px;line-height:1.55}.road-box-slot{border-top:1px solid #e3e8df;padding:8px 0 4px;display:grid;gap:2px}.road-box-slot span{font-size:11px;font-weight:750;letter-spacing:.06em;text-transform:uppercase;color:#68756d}.road-box-slot strong{font-size:14px;font-weight:650;line-height:1.45}.road-box-slot a{color:#176f50;font-weight:750;margin-right:12px;text-decoration:none}.road-box-money strong{color:#176f50}.road-box-money em{font-style:normal;font-size:13px;line-height:1.45;color:#44554a}.road-join{width:2px;height:22px;margin:0 auto;background:repeating-linear-gradient(to bottom,#176f50 0 5px,transparent 5px 9px)}";
document.head.appendChild(logStyle);

render();
