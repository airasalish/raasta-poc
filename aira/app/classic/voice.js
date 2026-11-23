// RaastaVoice: the only voice interface the UI uses.
//   RaastaVoice.listen(locale) -> Promise<{ text }>
//   RaastaVoice.speak(text, locale) -> Promise<void>
// Engine order: Sarvam (through our own /api/stt and /api/tts, key stays on the server)
// then the browser's Web Speech API. If neither is available, speak resolves quietly
// and listen rejects, so the UI falls back to tapping.
// Force the browser engine while testing (saves Sarvam credits): add ?voice=browser to the URL once.
(function () {
  const PREF_KEY = 'raasta_voice';
  try {
    const p = new URLSearchParams(location.search).get('voice');
    if (p === 'browser' || p === 'sarvam') localStorage.setItem(PREF_KEY, p);
  } catch (e) {}
  const pref = () => { try { return localStorage.getItem(PREF_KEY) || 'sarvam'; } catch (e) { return 'sarvam'; } };

  // Credit guard: each device gets a daily allowance of Sarvam audio (listening + speaking).
  // Default 5 minutes. Change for this device with ?voiceminutes=2 (or any number) once.
  // When it runs out, the app quietly switches to the browser's own voice until tomorrow.
  const BUDGET_KEY = 'raasta_sarvam_budget', USED_KEY = 'raasta_sarvam_used';
  try {
    const m = parseFloat(new URLSearchParams(location.search).get('voiceminutes'));
    if (m > 0 && m <= 30) localStorage.setItem(BUDGET_KEY, String(m));
  } catch (e) {}
  const today = () => new Date().toISOString().slice(0, 10);
  const budgetSec = () => { try { return (parseFloat(localStorage.getItem(BUDGET_KEY)) || 5) * 60; } catch (e) { return 300; } };
  function usedSec() {
    try { const u = JSON.parse(localStorage.getItem(USED_KEY) || '{}'); return u.day === today() ? u.sec || 0 : 0; } catch (e) { return 0; }
  }
  function addUsage(sec) {
    try { localStorage.setItem(USED_KEY, JSON.stringify({ day: today(), sec: Math.round((usedSec() + sec) * 10) / 10 })); } catch (e) {}
  }
  const withinBudget = () => usedSec() < budgetSec();

  let statusPromise = null;
  function sarvamReady() {
    if (pref() === 'browser' || !navigator.onLine || !withinBudget()) return Promise.resolve(false);
    if (!statusPromise) {
      statusPromise = fetch('/api/voice-status', { cache: 'no-store' })
        .then(r => (r.ok ? r.json() : { sarvam: false }))
        .then(j => !!j.sarvam)
        .catch(() => false);
    }
    return statusPromise;
  }

  // ---------- iPhone/Safari audio unlock ----------
  // Safari only lets audio play if the element was first started during a tap. We unlock one shared
  // <audio> element, one AudioContext and speechSynthesis on the first tap, then reuse them.
  const player = new Audio();
  player.setAttribute('playsinline', '');
  let sharedCtx = null, unlocked = false;
  function getCtx() {
    try {
      if (!sharedCtx) sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (sharedCtx.state === 'suspended') sharedCtx.resume();
    } catch (e) {}
    return sharedCtx;
  }
  function unlock() {
    if (unlocked) return; unlocked = true;
    try { player.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA='; player.play().catch(() => {}); } catch (e) {}
    getCtx();
    try { if ('speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } } catch (e) {}
  }
  ['touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, unlock, { capture: true, passive: true }));

  // ---------- speak ----------
  const ttsCache = new Map(); // same sentence is never paid for twice in one session
  let current = null;

  let stopListening = null;
  function stopAll() {
    if (current) { try { current.pause(); } catch (e) {} current = null; }
    try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) {}
    try { if (window.__note && !window.__note.paused) window.__note.pause(); } catch (e) {}
    if (stopListening) { try { stopListening(); } catch (e) {} stopListening = null; }
    busy(false);
  }
  // One floating Stop button, shown while Raasta is speaking or listening.
  let stopBtn = null;
  function busy(on) {
    if (!stopBtn && on) {
      stopBtn = document.createElement('button');
      stopBtn.type = 'button'; stopBtn.className = 'voice-stop'; stopBtn.textContent = '■ Stop';
      stopBtn.setAttribute('aria-label', 'Stop voice');
      stopBtn.style.cssText = 'position:fixed;left:50%;bottom:88px;transform:translateX(-50%);z-index:9999;padding:10px 22px;border-radius:999px;border:0;background:#b3261e;color:#fff;font:600 15px Inter,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer';
      stopBtn.addEventListener('click', e => { e.stopPropagation(); stopAll(); });
      document.body.appendChild(stopBtn);
    }
    if (stopBtn) stopBtn.style.display = on ? 'block' : 'none';
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(); });

  function playB64(b64) {
    return new Promise((resolve, reject) => {
      const a = player;
      current = a;
      a.onended = () => { if (current === a) current = null; busy(false); resolve(); };
      a.onpause = () => { if (current !== a) resolve(); };
      a.onerror = () => { if (current === a) current = null; reject(new Error('play')); };
      a.src = 'data:audio/wav;base64,' + b64;
      a.play().catch(reject); // blocked or unsupported -> caller falls back to the browser voice
    });
  }

  function browserSpeak(text, locale) {
    return new Promise(resolve => {
      if (!('speechSynthesis' in window)) return resolve();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = locale;
      const v = speechSynthesis.getVoices().find(x => x.lang === locale) ||
        speechSynthesis.getVoices().find(x => x.lang && x.lang.slice(0, 2) === locale.slice(0, 2));
      if (v) u.voice = v;
      const done = () => { busy(false); resolve(); };
      u.onend = u.onerror = done;
      busy(true);
      speechSynthesis.speak(u);
      setTimeout(() => { try { speechSynthesis.cancel(); } catch (e) {} done(); }, Math.min(150000, 3000 + text.length * 110)); // hard stop
    });
  }

  async function speak(text, locale) {
    text = String(text || '').trim();
    if (!text) return;
    locale = locale || 'en-IN';
    stopAll();
    if (await sarvamReady()) {
      const key = locale + '|' + text;
      try {
        let b64 = ttsCache.get(key);
        if (!b64) {
          const r = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, lang: locale })
          });
          if (!r.ok) throw new Error('tts ' + r.status);
          b64 = (await r.json()).audio;
          if (!b64) throw new Error('tts empty');
          ttsCache.set(key, b64);
          addUsage(Math.max(0.5, (b64.length * 0.75 - 44) / (22050 * 2))); // WAV, 22.05 kHz mono 16-bit
        }
        busy(true);
        return await playB64(b64);
      } catch (e) { /* fall through to the browser voice */ }
    }
    return browserSpeak(text, locale);
  }

  // ---------- listen ----------
  function recordUntilSilence(maxMs) {
    return navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => new Promise((resolve, reject) => {
      const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
        .find(t => window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
      const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      const chunks = [];
      let ctx, raf, done = false;
      const finish = () => {
        if (done) return; done = true;
        cancelAnimationFrame(raf);

        if (rec.state !== 'inactive') rec.stop();
        busy(false);
      };
      stopListening = finish; busy(true);
      rec.ondataavailable = e => e.data && e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        resolve(new Blob(chunks, { type: (rec.mimeType || type || 'audio/webm').split(';')[0] }));
      };
      rec.onerror = e => { finish(); reject(e.error || e); };
      rec.start();
      // Stop after ~1.2 s of quiet once the student has spoken, or at maxMs.
      try {
        ctx = getCtx();
        const an = ctx.createAnalyser(); an.fftSize = 1024;
        ctx.createMediaStreamSource(stream).connect(an);
        const buf = new Uint8Array(an.fftSize);
        let spoke = false, quietSince = 0;
        const t0 = performance.now();
        const tick = () => {
          an.getByteTimeDomainData(buf);
          let peak = 0; for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i] - 128));
          const now = performance.now();
          if (peak > 12) { spoke = true; quietSince = 0; } else if (spoke && !quietSince) quietSince = now;
          if ((spoke && quietSince && now - quietSince > 1200) || now - t0 > maxMs || (!spoke && now - t0 > 6000)) return finish();
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch (e) { setTimeout(finish, Math.min(maxMs, 6000)); }
      setTimeout(finish, maxMs);
    }));
  }

  async function sarvamListen(locale) {
    const t0 = Date.now();
    const blob = await recordUntilSilence(9000);
    addUsage((Date.now() - t0) / 1000);
    if (!blob.size) return { text: '' };
    const r = await fetch('/api/stt?lang=' + encodeURIComponent(locale), {
      method: 'POST',
      headers: { 'Content-Type': blob.type || 'audio/webm' },
      body: blob
    });
    if (!r.ok) throw new Error('stt ' + r.status);
    const j = await r.json();
    return { text: j.transcript || '' };
  }

  function browserListen(locale) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return Promise.reject(new Error('unsupported'));
    return new Promise((resolve, reject) => {
      const r = new SR();
      r.lang = locale; r.interimResults = false; r.maxAlternatives = 3;
      let got = false;
      r.onresult = e => {
        got = true;
        const alts = [...e.results[0]].map(a => a.transcript);
        resolve({ text: alts[0] || '', alts });
      };
      r.onerror = e => reject(new Error(e.error || 'error'));
      r.onend = () => { busy(false); if (!got) resolve({ text: '' }); };
      stopListening = () => { try { r.abort(); } catch (e) {} };
      busy(true);
      r.start();
      setTimeout(() => { try { r.stop(); } catch (e) {} }, 10000); // never listen for ever
    });
  }

  async function listen(locale) {
    locale = locale || 'en-IN';
    unlock(); getCtx(); // still inside the tap: wake audio before any await (needed on iPhone)
    stopAll();
    const canRecord = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
    if (canRecord && await sarvamReady()) {
      try { return await sarvamListen(locale); }
      catch (e) {
        if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) throw e; // mic denied: don't retry
      }
    }
    return browserListen(locale);
  }

  window.RaastaVoice = {
    listen, speak, stop: stopAll,
    engine: async () => ((await sarvamReady()) ? 'sarvam' : 'browser'),
    usage: () => ({ usedSeconds: usedSec(), limitSeconds: budgetSec() })
  };
})();
