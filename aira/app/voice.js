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

  let statusPromise = null;
  function sarvamReady() {
    if (pref() === 'browser' || !navigator.onLine) return Promise.resolve(false);
    if (!statusPromise) {
      statusPromise = fetch('api/voice-status', { cache: 'no-store' })
        .then(r => (r.ok ? r.json() : { sarvam: false }))
        .then(j => !!j.sarvam)
        .catch(() => false);
    }
    return statusPromise;
  }

  // ---------- speak ----------
  const ttsCache = new Map(); // same sentence is never paid for twice in one session
  let current = null;

  function stopAll() {
    if (current) { try { current.pause(); } catch (e) {} current = null; }
    try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) {}
  }

  function playB64(b64) {
    return new Promise(resolve => {
      const a = new Audio('data:audio/wav;base64,' + b64);
      current = a;
      a.onended = a.onerror = () => { if (current === a) current = null; resolve(); };
      a.play().catch(() => resolve());
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
      u.onend = u.onerror = () => resolve();
      speechSynthesis.speak(u);
      setTimeout(resolve, Math.min(30000, 1500 + text.length * 120)); // never hang the UI
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
          const r = await fetch('api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, lang: locale })
          });
          if (!r.ok) throw new Error('tts ' + r.status);
          b64 = (await r.json()).audio;
          if (!b64) throw new Error('tts empty');
          ttsCache.set(key, b64);
        }
        return playB64(b64);
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
        try { ctx && ctx.close(); } catch (e) {}
        if (rec.state !== 'inactive') rec.stop();
      };
      rec.ondataavailable = e => e.data && e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        resolve(new Blob(chunks, { type: (rec.mimeType || type || 'audio/webm').split(';')[0] }));
      };
      rec.onerror = e => { finish(); reject(e.error || e); };
      rec.start();
      // Stop after ~1.2 s of quiet once the student has spoken, or at maxMs.
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
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
    const blob = await recordUntilSilence(9000);
    if (!blob.size) return { text: '' };
    const r = await fetch('api/stt?lang=' + encodeURIComponent(locale), {
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
      r.onend = () => { if (!got) resolve({ text: '' }); };
      r.start();
    });
  }

  async function listen(locale) {
    locale = locale || 'en-IN';
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
    engine: async () => ((await sarvamReady()) ? 'sarvam' : 'browser')
  };
})();
