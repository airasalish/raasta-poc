const Counselor = (() => {
  const API = location.port === "8000" ? "" : "http://127.0.0.1:8000";
  const state = { session: null, ui: null, speech: "en-IN", screen: null, last: null };
  let root = null;

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const EN = {
    thinking: "Thinking of your next question…",
    error: "Something went wrong. Please try again.",
    retry: "Try again",
    start_over: "Start again",
  };
  const t = (key) => (state.ui && state.ui[key]) || EN[key] || key;

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
      wait() {
        items.unshift({ pending: true, time: clock() });
        paint();
      },
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
  const speaker = () => '<svg class="ico" viewBox="0 0 24 24"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4zm11 3a4 4 0 0 0-2-3.5v7A4 4 0 0 0 15 12z"/></svg>';

  function speak(lines, onLine) {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    const list = Array.isArray(lines) ? lines : [lines];
    list.forEach((text, i) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = state.speech;
      const voice = speechSynthesis.getVoices().find((v) => v.lang.replace("_", "-") === state.speech);
      if (voice) u.voice = voice;
      if (onLine) u.onstart = () => onLine(i);
      if (onLine && i === list.length - 1) u.onend = () => onLine(-1);
      speechSynthesis.speak(u);
    });
  }

  async function post(path, body) {
    const res = await fetch(API + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || data.detail || res.statusText);
      err.ai = data.ai;
      throw err;
    }
    return data;
  }

  function thinking(message) {
    root.innerHTML = `<div class="c-dots"><i></i><i></i><i></i></div><p class="c-wait">${esc(message)}</p>`;
  }

  function showError(err) {
    root.innerHTML = `
      <div class="c-err">${esc(t("error"))}<br><small>${esc(err.message)}</small></div>
      <button class="c-btn press" data-c="retry">${esc(t("retry"))}</button>
      <button class="c-btn ghost press" data-c="restart">${esc(t("start_over"))}</button>`;
  }

  async function run(path, body, waitText) {
    state.last = { path, body, waitText };
    thinking(waitText);
    AiLog.wait();
    try {
      const data = await post(path, body);
      AiLog.done(data.ai, path);
      if (data.session) {
        state.session = data.session;
        state.ui = data.ui;
        state.speech = data.speech;
      }
      render(data.screen);
    } catch (err) {
      AiLog.done(err.ai, path, true);
      showError(err);
    }
  }

  function retry() {
    const last = state.last;
    if (!last || last.path === "/api/start" || !state.session) return startEnglish();
    return run("/api/retry", { session: state.session }, last.waitText);
  }

  function startEnglish() {
    if (window.speechSynthesis) speechSynthesis.cancel();
    closeSheet();
    state.session = null;
    state.ui = null;
    state.screen = null;
    state.speech = "en-IN";
    return run("/api/start", { lang: "en" }, EN.thinking);
  }

  function render(screen) {
    state.screen = screen;
    if (screen.type === "question") return renderQuestion(screen);
    if (screen.type === "jobs") return renderJobs(screen);
    if (screen.type === "road") return renderRoad(screen.road);
  }

  function renderQuestion(q) {
    const letters = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
    root.innerHTML = `
      ${q.intro ? `<p class="c-intro">${esc(q.intro)}</p>` : ""}
      <div class="c-top" style="align-items:flex-start">
        <p class="c-q" style="flex:1">${esc(q.text)}</p>
        <button class="speak" data-c="hear-q" aria-label="Hear question">${speaker()}</button>
      </div>
      <div class="c-opts">${q.options.map((o, i) =>
        `<button class="c-opt press" data-c="opt" data-v="${i}"><i>${letters[i]}</i><span>${esc(o)}</span></button>`).join("")}
      </div>`;
  }

  function renderJobs(s) {
    root.innerHTML = `
      <div class="c-top"><h3>${esc(t("jobs_title"))}</h3>
        <button class="speak" data-c="hear-jobs" aria-label="Hear jobs">${speaker()}</button></div>
      ${s.jobs.map((j, i) => `
        <button class="c-job press" data-c="job" data-v="${i}">
          <span class="em">${esc(j.emoji || "⭐")}</span>
          <span style="flex:1;margin:0;color:inherit">
            <b>${esc(j.title)}</b>
            <span>${esc(j.what)}</span>
            ${j.time_to_earn ? `<em>${esc(j.time_to_earn)}</em>` : ""}
          </span>
        </button>`).join("")}
      <button class="c-btn ghost press" data-c="restart">${esc(t("start_over"))}</button>`;
  }

  const costText = (level) => t("cost_" + level);

  function renderRoad(road) {
    const steps = road.steps;
    const parent = road.parent || {};
    const parentKeys = ["wants", "cost", "time", "pay", "safety", "help", "scheme"].filter((k) => parent[k]);
    root.innerHTML = `
      <div class="c-top">
        <span style="font-size:34px">${esc(road.job.emoji || "⭐")}</span>
        <h3>${esc(road.job.title)}</h3>
        <button class="speak" data-c="hear-road" aria-label="Hear road">${speaker()}</button>
      </div>
      ${road.summary ? `<p class="c-summary">${esc(road.summary)}</p>` : ""}
      <p class="c-hint">${esc(t("tap_step"))}</p>
      <div class="c-road">
        ${steps.map((st, i) => `
          ${i > 0 && st.prepare.length ? `<div class="c-link">${st.prepare.map((p, k) =>
            `<button class="c-portal press" data-c="portal" data-v="${i}:${k}">🔗 ${esc(p.name)}</button>`).join("")}</div>`
            : i > 0 ? `<div class="c-link"></div>` : ""}
          <button class="c-stop press ${i === 0 ? "first" : ""} ${i === steps.length - 1 ? "last" : ""}" data-c="step" data-v="${i}">
            <span class="n">${i + 1}</span>
            <span style="flex:1">
              <b>${esc(st.title)}</b>
              <small>${esc(st.duration)}${i === 0 ? " · " + esc(t("you_are_here")) : ""}</small>
              <span class="c-tags">
                <span class="c-tag ${st.cost_level === "free" ? "free" : ""}">${esc(costText(st.cost_level))}</span>
                ${st.schemes && st.schemes.length ? `<span class="c-tag money">💰 ${esc(st.schemes[0].name)}</span>` : ""}
                ${st.exams.length ? `<span class="c-tag">📝 ${esc(st.exams[0])}</span>` : ""}
              </span>
            </span>
          </button>`).join("")}
      </div>
      <section class="c-parent">
        <div class="c-top" style="margin:0">
          <h4>👪 ${esc(t("for_family"))}</h4>
          <button class="speak" data-c="hear-parent" aria-label="${esc(t("play"))}">${speaker()}</button>
        </div>
        <dl>${parentKeys.map((k) => `<dt>${esc(t(k === "wants" ? "wants" : "parent_" + k))}</dt><dd data-pk="${k}">${esc(parent[k])}</dd>`).join("")}</dl>
      </section>
      <button class="c-btn ghost press" data-c="jobs">${esc(t("other_jobs"))}</button>
      <button class="c-btn ghost press" data-c="restart">${esc(t("start_over"))}</button>`;
    state.parentKeys = parentKeys;
  }

  function sheet(html) {
    closeSheet();
    const bg = document.createElement("div");
    bg.className = "c-sheet-bg";
    bg.id = "c-sheet";
    bg.innerHTML = `<div class="c-sheet">${html}<button class="c-btn ghost press" data-c="close">${esc(t("close"))}</button></div>`;
    bg.addEventListener("click", (e) => {
      if (e.target === bg || e.target.closest('[data-c="close"]')) closeSheet();
    });
    root.closest(".phone").appendChild(bg);
  }

  function closeSheet() {
    document.getElementById("c-sheet")?.remove();
  }

  function portalCard(p) {
    return `<div class="c-card"><b>🔗 ${esc(p.name)}</b>
      ${p.tip ? `<p style="margin:4px 0;font-weight:700">${esc(p.tip)}</p>` : ""}
      <small>${esc(p.about)}</small><br>
      <a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(t("apply"))} ↗</a></div>`;
  }

  function stepSheet(i) {
    const st = state.screen.road.steps[i];
    const schemesHtml = st.schemes && st.schemes.length
      ? st.schemes.map((m) => `
        <div class="c-scheme ${m.best ? "best" : ""}">
          ${m.best ? `<span class="badge">⭐ ${esc(t("best"))}</span>` : ""}
          <b>${esc(m.name)}</b>
          <div class="amt">${esc(m.line || m.pays)}</div>
          <small><b style="display:inline">${esc(t("who"))}:</b> ${esc(m.who)}</small>
          ${m.notes.map((n) => `<small>⚠ ${esc(n)}</small>`).join("")}
          <small>${esc(t("checked"))} ${esc(m.checked)} · ${esc(m.source)}</small>
          <a href="${esc(m.url)}" target="_blank" rel="noopener">${esc(t("apply"))} ↗</a>
        </div>`).join("")
      : `<p>${esc(t("no_scheme"))}</p>`;
    sheet(`
      <div class="c-top" style="margin-top:0">
        <h4>${i + 1}. ${esc(st.title)}</h4>
        <button class="speak" data-c="hear-step" data-v="${i}" aria-label="Hear step">${speaker()}</button>
      </div>
      <p>${esc(st.what)}</p>
      <p><b>${esc(t("time"))}:</b> ${esc(st.duration)} · <b>${esc(t("cost"))}:</b> ${esc(costText(st.cost_level))}</p>
      ${st.places.length ? `<h5>🏫 ${esc(t("places"))}</h5><ul>${st.places.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
      ${st.exams.length ? `<h5>📝 ${esc(t("exams"))}</h5><ul>${st.exams.map((e) => `<li>${esc(e)}</li>`).join("")}</ul>` : ""}
      ${st.prepare.length ? `<h5>📚 ${esc(t("prepare"))}</h5>${st.prepare.map(portalCard).join("")}` : ""}
      <h5>💰 ${esc(t("money_help"))}</h5>${schemesHtml}`);
  }

  function onClick(e) {
    const el = e.target.closest("[data-c]");
    if (!el || !root.closest(".phone").contains(el)) return;
    const v = el.dataset.v;
    const s = state.screen;
    switch (el.dataset.c) {
      case "opt":
        return run("/api/answer", { session: state.session, choice: Number(v) }, s.fact === "category" ? t("making_road") : t("thinking"));
      case "job":
        return run("/api/job", { session: state.session, choice: Number(v) }, t("thinking"));
      case "jobs":
        return run("/api/jobs", { session: state.session }, t("finding_jobs"));
      case "retry":
        return retry();
      case "restart":
        return startEnglish();
      case "hear-q":
        return speak([s.text, ...s.options.map((o, i) => `${i + 1}. ${o}`)]);
      case "hear-jobs":
        return speak([t("jobs_title"), ...s.jobs.map((j) => `${j.title}. ${j.what}`)]);
      case "hear-road":
        return speak([s.road.job.title, s.road.summary, ...s.road.steps.map((st, i) => `${i + 1}. ${st.title}. ${st.duration}`)]);
      case "hear-step": {
        const st = s.road.steps[Number(v)];
        return speak([st.title, st.what, ...(st.schemes || []).map((m) => `${m.name}. ${m.line || m.pays}`)]);
      }
      case "hear-parent": {
        const keys = state.parentKeys || [];
        const dds = [...root.querySelectorAll("[data-pk]")];
        return speak(keys.map((k) => s.road.parent[k]), (i) => {
          dds.forEach((d, j) => d.classList.toggle("lit", j === i));
        });
      }
      case "step":
        return stepSheet(Number(v));
      case "portal": {
        const [si, pi] = v.split(":").map(Number);
        return sheet(portalCard(s.road.steps[si].prepare[pi]));
      }
    }
  }

  function open() {
    if (!root) {
      root = document.getElementById("counselor");
      root.closest(".phone").addEventListener("click", onClick);
    }
    if (state.screen) return render(state.screen);
    if (!root.innerHTML.trim()) startEnglish();
  }

  return { open };
})();
