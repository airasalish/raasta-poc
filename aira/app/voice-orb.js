/* voice-orb.js — Raasta Field Atlas v3.0
   Gemini-style liquid voice orb: Canvas 2D, Web Audio API, 4 states, 4 plasma layers.
   64-point catmull-rom spline, screen-blend on dark glass stage.
   Exports: window.VoiceOrb = { mount(container), setState(state), setAmplitude(0-1), setCaption(text), destroy() }
   States: 'idle' | 'listening' | 'thinking' | 'speaking'
*/
(function () {
  'use strict';

  /* ── Spring physics ──────────────────────────────────────────────── */
  function makeSpring(stiffness, damping) {
    return {
      value: 1, velocity: 0, target: 1,
      update(dt) {
        const force = -stiffness * (this.value - this.target) - damping * this.velocity;
        this.velocity += force * dt;
        this.value += this.velocity * dt;
      }
    };
  }

  /* ── Colour helpers ─────────────────────────────────────────────── */
  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  }
  function lerpColor(a, b, t) {
    const ra = hexToRgb(a), rb = hexToRgb(b);
    return `rgb(${Math.round(ra[0] + (rb[0] - ra[0]) * t)},${Math.round(ra[1] + (rb[1] - ra[1]) * t)},${Math.round(ra[2] + (rb[2] - ra[2]) * t)})`;
  }
  function hexAlpha(hex, a) {
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  }

  /* ── 64-point blob generation (harmonic spline) ─────────────────── */
  function blobPoints(cx, cy, r, n, seed, time, ampMod) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const baseAngle = (i / n) * Math.PI * 2;
      /* Multi-frequency noise for organic silhouette */
      const f1 = Math.sin(time * 1.3  + seed         + i * 2.1 * (Math.PI * 2 / n)) * 0.14;
      const f2 = Math.sin(time * 0.7  + seed * 1.5   + i * 3.7 * (Math.PI * 2 / n)) * 0.09;
      const f3 = Math.sin(time * 2.1  + seed * 0.8   + i * 1.4 * (Math.PI * 2 / n)) * 0.06;
      const f4 = Math.sin(time * 0.41 + seed * 2.1   + i * 5.3 * (Math.PI * 2 / n)) * 0.04;
      const f5 = Math.sin(time * 3.7  + seed * 0.4   + i * 0.8 * (Math.PI * 2 / n)) * 0.03;
      const totalNoise = f1 + f2 + f3 + f4 + f5;
      const rad = r * (1 + totalNoise * (1 + ampMod * 1.8));
      pts.push({
        x: cx + Math.cos(baseAngle) * rad,
        y: cy + Math.sin(baseAngle) * rad
      });
    }
    return pts;
  }

  /* ── Smooth catmull-rom spline blob ─────────────────────────────── */
  function drawSmoothBlob(ctx, pts, fillStyle, alpha, compositeOp) {
    const n = pts.length;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (compositeOp) ctx.globalCompositeOperation = compositeOp;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % n];
      const p3 = pts[(i + 2) % n];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      if (i === 0) ctx.moveTo(p1.x, p1.y);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.restore();
  }

  /* ── State colour maps (4 plasma layers per state) ──────────────── */
  const COLORS = {
    idle:      { a: '#10B981', b: '#34D399', c: '#059669', d: '#06B6D4' },
    listening: { a: '#10B981', b: '#34D399', c: '#6EE7B7', d: '#22D3EE' },
    thinking:  { a: '#059669', b: '#D47234', c: '#F59E0B', d: '#0D9488' },
    speaking:  { a: '#10B981', b: '#34D399', c: '#059669', d: '#06B6D4' }
  };

  /* idle: slow breathe 0.97→1.03; listening: expand; thinking: tighten; speaking: mid */
  const STATE_SCALE   = { idle: 1.0, listening: 1.14, thinking: 0.88, speaking: 1.06 };

  /* ── Acoustic ring for listening ────────────────────────────────── */
  let rings = [];
  function spawnRing(cx, cy, r) {
    rings.push({ cx, cy, r, maxR: r * 2.4, alpha: 0.42, age: 0 });
  }
  function updateRings(ctx, dt) {
    rings = rings.filter(ring => ring.alpha > 0.01);
    rings.forEach(ring => {
      ring.age += dt;
      ring.r   += 58 * dt;
      ring.alpha -= 0.46 * dt;
      ctx.save();
      ctx.globalAlpha   = Math.max(0, ring.alpha);
      ctx.globalCompositeOperation = 'screen';
      ctx.beginPath();
      ctx.arc(ring.cx, ring.cy, ring.r, 0, Math.PI * 2);
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth   = 1.8;
      ctx.stroke();
      ctx.restore();
    });
  }

  /* ── Session progress SVG arc ───────────────────────────────────── */
  function buildSessionArc(container) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg   = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class',   'orb-session-arc');
    svg.setAttribute('viewBox', '0 0 44 44');
    svg.setAttribute('aria-hidden', 'true');

    const bg = document.createElementNS(svgNS, 'circle');
    bg.setAttribute('cx', '22'); bg.setAttribute('cy', '22'); bg.setAttribute('r', '20');
    bg.setAttribute('fill', 'none'); bg.setAttribute('stroke', 'rgba(16,185,129,0.18)');
    bg.setAttribute('stroke-width', '2.5');

    const fg = document.createElementNS(svgNS, 'circle');
    fg.setAttribute('cx', '22'); fg.setAttribute('cy', '22'); fg.setAttribute('r', '20');
    fg.setAttribute('fill', 'none'); fg.setAttribute('stroke', '#10B981');
    fg.setAttribute('stroke-width', '2.5');
    fg.setAttribute('stroke-linecap', 'round');
    const C = 2 * Math.PI * 20;
    fg.setAttribute('stroke-dasharray',  C);
    fg.setAttribute('stroke-dashoffset', C);
    fg.setAttribute('transform', 'rotate(-90 22 22)');
    fg.id = 'orbArcFg';

    svg.appendChild(bg);
    svg.appendChild(fg);
    container.appendChild(svg);
    return fg;
  }

  /* ── Caption element ────────────────────────────────────────────── */
  function buildCaption(container) {
    const el = document.createElement('div');
    el.className = 'orb-caption';
    el.setAttribute('aria-live', 'polite');
    container.appendChild(el);
    return el;
  }

  /* ── Status label ───────────────────────────────────────────────── */
  function buildStatus(container) {
    const el = document.createElement('div');
    el.className = 'orb-status';
    container.appendChild(el);
    return el;
  }

  const STATUS_LABELS = {
    idle:      { en: 'Ready',              ta: 'தயாராக உள்ளது',       hi: 'तैयार',           ml: 'തയ്യാർ' },
    listening: { en: 'Listening…',         ta: 'கேட்கிறது…',           hi: 'सुन रहे हैं…',    ml: 'കേൾക്കുന്നു…' },
    thinking:  { en: 'Mapping your route…',ta: 'உங்கள் வழி தயாராகிறது…',hi: 'रास्ता बन रहा है…',ml: 'വഴി തയ്യാറാകുന്നു…' },
    speaking:  { en: 'Raasta is speaking', ta: 'ராஸ்தா பேசுகிறது',    hi: 'रास्ता बोल रहा है', ml: 'റാസ്ത സംസാരിക്കുന്നു' }
  };

  /* ── Web Audio ──────────────────────────────────────────────────── */
  let audioCtx = null, analyser = null, micStream = null, micSource = null;
  let analyserData = null;

  async function connectMic() {
    if (micSource) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser  = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserData = new Uint8Array(analyser.frequencyBinCount);
        analyser.connect(audioCtx.destination);
      }
      micStream  = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      micSource  = audioCtx.createMediaStreamSource(micStream);
      micSource.connect(analyser);
    } catch (e) {
      /* mic denied — procedural fallback already running */
    }
  }

  function getMicAmplitude() {
    if (!analyser || !analyserData) return 0;
    analyser.getByteFrequencyData(analyserData);
    let sum = 0;
    for (let i = 0; i < analyserData.length; i++) sum += analyserData[i];
    return Math.min(1, (sum / analyserData.length) / 60);
  }

  /* ── Core VoiceOrb object ────────────────────────────────────────── */
  let raf = null;
  let canvas = null, ctx2d = null;
  let container = null;
  let arcFg = null, captionEl = null, statusEl = null;
  let orbState  = 'idle';
  let startTime = null;
  let sessionStart   = null;
  let externalAmplitude = 0;
  let ringTimer  = 0;
  let thinkAngle = 0;
  let currentLang = 'en';

  /* idle breathing: oscillate scale 0.97 → 1.03 */
  let idleBreathPhase = 0;

  const scaleSpring = makeSpring(55, 10);
  const ampSpring   = makeSpring(40,  8);

  function getLang() {
    try { return document.documentElement.lang || 'en'; } catch { return 'en'; }
  }

  function draw(ts) {
    raf = requestAnimationFrame(draw);
    if (!canvas || !ctx2d) return;

    const now = ts / 1000;
    if (!startTime) startTime = now;
    const time = now - startTime;
    const dt   = Math.min(0.05, 1 / 60);

    const W  = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const baseR = Math.min(W, H) * 0.30;

    /* ── Idle breathing: gentle scale oscillation 0.97→1.03 ─────── */
    if (orbState === 'idle') {
      idleBreathPhase += dt * (Math.PI * 2 / 4); /* 4s period */
      scaleSpring.target = 1.0 + Math.sin(idleBreathPhase) * 0.03;
    } else {
      scaleSpring.target = STATE_SCALE[orbState] || 1.0;
    }
    scaleSpring.update(dt);

    const micAmp = getMicAmplitude();
    const rawAmp = Math.max(micAmp, externalAmplitude);
    ampSpring.target = rawAmp;
    ampSpring.update(dt);
    const amp = ampSpring.value;

    /* ── Ring spawning (listening) ────────────────────────────────── */
    if (orbState === 'listening') {
      ringTimer += dt;
      if (ringTimer > 0.55 + (1 - amp) * 0.7) {
        spawnRing(cx, cy, baseR * scaleSpring.value * (0.95 + amp * 0.3));
        ringTimer = 0;
      }
    } else {
      ringTimer = 0;
    }

    /* ── Clear — dark glass background drawn here ─────────────────── */
    ctx2d.clearRect(0, 0, W, H);

    /* ── Dark glass stage base (the orb sits on a dark surface) ───── */
    ctx2d.fillStyle = 'rgba(7,36,28,0.0)'; /* transparent — stage bg done in CSS on wrapper */
    ctx2d.fillRect(0, 0, W, H);

    /* ── Thinking swirl ───────────────────────────────────────────── */
    if (orbState === 'thinking') {
      thinkAngle += dt * 1.4;
      ctx2d.save();
      ctx2d.translate(cx, cy);
      ctx2d.rotate(thinkAngle);
      ctx2d.globalCompositeOperation = 'screen';
      const thinkGrad = ctx2d.createLinearGradient(-baseR, 0, baseR, 0);
      const tLerp = (Math.sin(thinkAngle * 0.6) + 1) / 2;
      thinkGrad.addColorStop(0, lerpColor('#059669', '#D47234', tLerp));
      thinkGrad.addColorStop(0.5, lerpColor('#10B981', '#F59E0B', tLerp));
      thinkGrad.addColorStop(1,   lerpColor('#34D399', '#D47234', tLerp));
      const tR  = baseR * scaleSpring.value;
      /* 64-point think blob */
      const pts = blobPoints(0, 0, tR, 64, 7.3, time, 0);
      ctx2d.beginPath();
      const n = pts.length;
      for (let i = 0; i < n; i++) {
        const p0 = pts[(i - 1 + n) % n];
        const p1 = pts[i];
        const p2 = pts[(i + 1) % n];
        const p3 = pts[(i + 2) % n];
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        if (i === 0) ctx2d.moveTo(p1.x, p1.y);
        ctx2d.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      }
      ctx2d.closePath();
      ctx2d.globalAlpha  = 0.72;
      ctx2d.fillStyle = thinkGrad;
      ctx2d.fill();
      ctx2d.restore();
    }

    /* ── 4 organic plasma blobs (64-point, screen-blend on dark bg) ─ */
    const col = COLORS[orbState] || COLORS.idle;
    const r   = baseR * scaleSpring.value;

    /* Speaking mode: faster oscillation for voice cadence */
    const tMult = orbState === 'speaking' ? 2.0 : 1.0;

    const pts1 = blobPoints(cx, cy, r,         64, 1.2, time * tMult,         amp);
    const pts2 = blobPoints(cx, cy, r * 0.80,  64, 3.7, time * tMult * 1.3 + 1,   amp * 0.9);
    const pts3 = blobPoints(cx, cy, r * 0.58,  64, 6.1, time * tMult * 1.7 + 2,   amp * 0.7);
    const pts4 = blobPoints(cx, cy, r * 0.42,  64, 9.4, time * tMult * 2.1 + 3.5, amp * 0.5);

    /* Layer 1 — Outer emerald (source-over first to establish base) */
    const g1 = ctx2d.createRadialGradient(cx - r * 0.1, cy - r * 0.15, r * 0.1, cx, cy, r * 1.1);
    g1.addColorStop(0, hexAlpha(col.b, 0.9));
    g1.addColorStop(1, hexAlpha(col.a, 0.75));
    drawSmoothBlob(ctx2d, pts1, g1, 0.78, 'source-over');

    /* Layer 2 — Mid jade (screen-blend for luminosity) */
    const g2 = ctx2d.createRadialGradient(cx + r * 0.08, cy + r * 0.1, 0, cx, cy, r * 0.88);
    g2.addColorStop(0, hexAlpha(col.c, 0.9));
    g2.addColorStop(1, hexAlpha(col.a, 0.6));
    drawSmoothBlob(ctx2d, pts2, g2, 0.55, 'screen');

    /* Layer 3 — Inner specular core (white → tinted, screen) */
    const g3 = ctx2d.createRadialGradient(cx, cy, 0, cx, cy, r * 0.63);
    g3.addColorStop(0, 'rgba(255,255,255,0.55)');
    g3.addColorStop(0.4, hexAlpha(col.b, 0.5));
    g3.addColorStop(1,   hexAlpha(col.b, 0.0));
    drawSmoothBlob(ctx2d, pts3, g3, 0.42, 'screen');

    /* Layer 4 — NEW: Cyan accent (iridescent depth) */
    const g4 = ctx2d.createRadialGradient(cx + r * 0.15, cy - r * 0.1, 0, cx, cy, r * 0.46);
    g4.addColorStop(0, hexAlpha(col.d, 0.85));
    g4.addColorStop(1, hexAlpha(col.d, 0.0));
    drawSmoothBlob(ctx2d, pts4, g4, 0.35, 'screen');

    /* ── Specular rim light ────────────────────────────────────────── */
    const rim = ctx2d.createRadialGradient(
      cx - r * 0.32, cy - r * 0.42, r * 0.04,
      cx, cy, r * 1.02
    );
    rim.addColorStop(0,   'rgba(255,255,255,0.32)');
    rim.addColorStop(0.4, 'rgba(255,255,255,0.08)');
    rim.addColorStop(1,   'rgba(255,255,255,0)');
    ctx2d.save();
    ctx2d.globalCompositeOperation = 'screen';
    ctx2d.beginPath();
    ctx2d.arc(cx, cy, r * 1.06, 0, Math.PI * 2);
    ctx2d.fillStyle = rim;
    ctx2d.globalAlpha = 1;
    ctx2d.fill();
    ctx2d.restore();

    /* ── Inner core glow ──────────────────────────────────────────── */
    const glow = ctx2d.createRadialGradient(cx, cy, 0, cx, cy, r * 0.52);
    glow.addColorStop(0, 'rgba(52,211,153,0.42)');
    glow.addColorStop(1, 'rgba(52,211,153,0)');
    ctx2d.save();
    ctx2d.globalCompositeOperation = 'screen';
    ctx2d.globalAlpha = 0.7;
    ctx2d.beginPath();
    ctx2d.arc(cx, cy, r * 0.52, 0, Math.PI * 2);
    ctx2d.fillStyle = glow;
    ctx2d.fill();
    ctx2d.restore();

    /* ── Acoustic rings ───────────────────────────────────────────── */
    updateRings(ctx2d, dt);

    /* ── Session arc ──────────────────────────────────────────────── */
    if (arcFg && sessionStart) {
      const elapsed = (Date.now() - sessionStart) / 1000;
      const pct = Math.min(1, elapsed / 600);
      const C   = 2 * Math.PI * 20;
      arcFg.setAttribute('stroke-dashoffset', C * (1 - pct));
    }

    /* ── Status label ─────────────────────────────────────────────── */
    currentLang = getLang();
    if (statusEl) {
      const labels = STATUS_LABELS[orbState] || STATUS_LABELS.idle;
      statusEl.textContent = labels[currentLang] || labels.en;
    }
  }

  function resize() {
    if (!canvas || !container) return;
    const size = Math.min(container.offsetWidth, 260);
    canvas.width  = size;
    canvas.height = size;
    canvas.style.width  = size + 'px';
    canvas.style.height = size + 'px';
  }

  /* ── Public API ─────────────────────────────────────────────────── */
  window.VoiceOrb = {
    mount(c) {
      if (raf) this.destroy();
      container = c;
      container.classList.add('orb-mount-active');

      canvas  = document.createElement('canvas');
      canvas.className = 'orb-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      ctx2d   = canvas.getContext('2d');

      arcFg      = buildSessionArc(container);
      container.appendChild(canvas);
      statusEl   = buildStatus(container);
      captionEl  = buildCaption(container);

      resize();
      window.addEventListener('resize', resize);

      startTime  = null;
      orbState   = 'idle';
      sessionStart = Date.now();
      rings      = [];
      thinkAngle = 0;
      idleBreathPhase = 0;
      externalAmplitude = 0;
      scaleSpring.value = 1; scaleSpring.velocity = 0;
      ampSpring.value   = 0; ampSpring.velocity   = 0;

      raf = requestAnimationFrame(draw);
    },

    setState(state) {
      if (!['idle', 'listening', 'thinking', 'speaking'].includes(state)) return;
      orbState = state;
      rings    = [];
      if (state !== 'idle') idleBreathPhase = 0;
      /* amplitude is procedural: no second mic stream (avoids echo and a second permission prompt) */
    },

    setAmplitude(v) {
      externalAmplitude = Math.max(0, Math.min(1, v));
    },

    setCaption(text) {
      if (captionEl) captionEl.textContent = text || '';
    },

    destroy() {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      window.removeEventListener('resize', resize);
      if (micSource) { try { micSource.disconnect(); } catch {} micSource = null; }
      if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null; }
      if (container) {
        container.classList.remove('orb-mount-active');
        while (container.firstChild) container.removeChild(container.firstChild);
      }
      canvas = null; ctx2d = null; arcFg = null; statusEl = null; captionEl = null;
      startTime = null; rings = []; thinkAngle = 0; idleBreathPhase = 0;
    }
  };
})();
