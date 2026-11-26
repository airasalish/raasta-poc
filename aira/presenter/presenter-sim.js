// Offline replay of Meena's session for the presenter page.
// The conversation lines are scripted (the live AI words it a little differently each time),
// but routes, eligibility, openings and the parent note are computed here by the app's own
// engine and data files (data.js, engine.js, kb_slice.js, parentMode.js). No network needed.
(() => {
  const screen = document.getElementById('simScreen');
  if (!screen) return;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rs = n => '₹' + Number(n).toLocaleString('en-IN');
  const base = { name: 'Meena', age: 17, education: 'c11_12', govt_school: true, gender: 'female', category: 'obc',
                 marks_percent: 85, state: 'TN', disability: false, interests: ['drawing', 'stitching'] };
  const withIncome = { ...base, family_income_lakh: 2 };
  const route = CAREERS.find(c => c.id === 'textile_design_digital');
  const oppName = id => (OPPORTUNITIES.find(o => o.id === id) || {}).name || id;

  const bot = t => `<div class="sim-b bot"><span class="sim-who">Raahi</span>${esc(t)}</div>`;
  const me = t => `<div class="sim-b me"><span class="sim-mic">🎙 spoken</span>${esc(t)}</div>`;
  const chips = (label, list) => `<div class="sim-chips"><span class="sim-chips-label">${esc(label)}</span>${list.map(x => `<span class="sim-chip">${esc(x)}</span>`).join('')}</div>`;
  const tap = (q, a) => `<div class="sim-tap"><span>${esc(q)}</span><b>${esc(a)}</b></div>`;
  const note = t => `<div class="sim-note">${esc(t)}</div>`;

  const radarCards = profile => eligibility(profile).filter(o => o.status !== 'not_eligible').map(o => {
    const full = OPPORTUNITIES.find(x => x.id === o.opportunity_id) || {};
    const missing = o.reasons.filter(r => r.passed === null).map(r => r.text);
    return `<div class="sim-card ${o.status}"><div class="sim-card-top"><b>${esc(o.name)}</b><span class="sim-status">${o.status === 'eligible' ? '✓ Eligible' : '? Maybe'}</span></div>
      <div class="sim-benefit">${esc(o.benefit)}</div>
      ${missing.length ? `<div class="sim-missing">Missing: ${esc(missing.join(', '))}</div>` : ''}
      ${full.deadline ? `<div class="sim-missing">⏰ Apply on NSP by ${esc(full.deadline)}</div>` : ''}${full.source ? `<div class="sim-src">Source: ${esc(full.source)} · checked ${esc(full.last_checked)}</div>` : ''}</div>`;
  }).join('');

  const steps = [
    () => `<div class="sim-head"><b>Raasta</b><span>Meena · Tamil Nadu</span></div>` + bot('Tell me something you do at home or for others.'),
    () => me('I draw a big kolam outside my house every morning, and I stitch blouses for the ladies on my street.'),
    () => chips('Skills found', ['Drawing / pattern design (kolam)', 'Stitching']),
    () => bot('Who taught you these skills?'),
    () => me("My grandmother taught me. I'm 17, in 12th standard at a government school."),
    () => chips('Profile', ['Age 17', 'Class 12', 'Government school']),
    () => bot('Do you teach anyone, or earn from it?'),
    () => me('Yes! I taught my little sister kolam, and the aunties pay me fifty rupees for each blouse.'),
    () => chips('Understood', ['Earns ₹50 per blouse (her own money, not family income)']),
    () => tap('Are you a girl or a boy?', 'Girl') + tap('Community category?', 'BC / OBC') + tap('Family income a year?', 'Skip') + tap('Your marks?', '75–90%'),
    () => `<div class="sim-section">Career routes from her skills</div>` + matchCareers(base).map(c =>
      `<div class="sim-route ${c.id === route.id ? 'pick' : ''}"><span class="sim-type">${esc(c.type)}</span><b>${esc(c.title.en)}</b></div>`).join(''),
    () => {
      const f = KB_SLICE.families.stitching;
      return `<div class="sim-section">${esc(route.title.en)}: first steps</div>` +
        route.path.slice(0, 3).map((p, i) => `<div class="sim-step"><span>${i + 1}</span>${esc(p[0])} <i>${esc(p[1])}</i></div>`).join('') +
        `<div class="sim-section">Real apprenticeships hiring now</div><div class="sim-meta">${f.state} open in Tamil Nadu · ${f.india} across India</div>` +
        f.openings.slice(0, 2).map(o => `<div class="sim-card eligible"><b>${esc(o.t)}</b><div class="sim-meta">${esc(o.emp)} · ${esc(o.place)}</div><div class="sim-benefit">Stipend ${rs(o.from)}–${rs(o.upto)} a month · code ${esc(o.code)}</div></div>`).join('') +
        `<div class="sim-src">Source: National Apprenticeship portal, snapshot ${esc(KB_SLICE.meta.snapshot)}</div>`;
    },
    () => `<div class="sim-section">Opportunity Radar (rules run on the phone)</div>` + radarCards(base),
    () => tap('Asks her mother. Family income a year?', '₹1–2.5 lakh') +
      note('Now eligible: ' + ['central_sector', 'post_matric_obc'].map(oppName).join(' and ')) + radarCards(withIncome),
    () => {
      const n = parentNoteFor(withIncome, route, 'ta', STEP_I18N);
      return `<div class="sim-section">Parent Mode · voice note for her mother (Tamil)</div><div class="sim-parent">🔊 ${esc(n.text)}</div>`;
    },
    () => note('Replay for offline backup. Routes, eligibility, openings and the parent note above were computed live by the same engine and data the app uses.')
  ];

  let i = 0, timer = null;
  const progress = document.getElementById('simProgress');
  const playBtn = document.getElementById('simPlay');
  const show = () => { if (progress) progress.textContent = `${Math.min(i, steps.length)} / ${steps.length}`; };
  const next = () => {
    if (i >= steps.length) { pause(); return; }
    const div = document.createElement('div');
    div.className = 'sim-item';
    try { div.innerHTML = steps[i](); } catch (e) { div.innerHTML = note('Step could not render: ' + e.message); }
    screen.appendChild(div);
    i++; show();
    div.scrollIntoView({ behavior: 'smooth', block: 'end' });
    if (i >= steps.length) pause();
  };
  const play = () => { if (i >= steps.length) restart(); if (timer) return; next(); timer = setInterval(next, 2600); if (playBtn) playBtn.textContent = 'Pause'; };
  const pause = () => { clearInterval(timer); timer = null; if (playBtn) playBtn.textContent = i >= steps.length ? 'Replay' : 'Play'; };
  const restart = () => { pause(); screen.innerHTML = ''; i = 0; show(); };

  playBtn?.addEventListener('click', () => (timer ? pause() : play()));
  document.getElementById('simNext')?.addEventListener('click', () => { pause(); next(); });
  document.getElementById('simRestart')?.addEventListener('click', restart);
  document.addEventListener('keydown', e => {
    if (!document.body.classList.contains('mode-sim')) return;
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); pause(); next(); }
  });
  window.RaastaSim = { play, pause, restart, next };
  show();
})();
