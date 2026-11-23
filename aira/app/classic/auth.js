// Accounts on this device: separate student and teacher logins with a 4-digit PIN.
// Built for a shared phone in a village school: no email or internet needed, each user's
// conversation, Skill Genome and routes are saved separately. PINs are stored only as salted SHA-256 hashes.
(function () {
  const UKEY = 'raasta_users', SKEY = 'raasta_session';
  const A = {
    en: { who: 'Who is using Raasta?', newS: 'New student', teacher: 'Teacher login', newT: 'New teacher account', name: 'Your name', pin: '4-digit PIN', pin2: 'Repeat PIN', create: 'Create account', signIn: 'Sign in', wrong: 'Wrong PIN. Try again.', mismatch: 'PINs don’t match or aren’t 4 digits.', needName: 'Please enter a name.', out: 'Sign out', sw: 'Switch user', as: 'Signed in as', dev: 'Students on this device', none: 'No students have signed up on this device yet.', student: 'Student', tch: 'Teacher', back: 'Back', demo: 'Presenter demo: Kavya', skills: 'Skills', top: 'Top route' },
    ta: { who: 'ராஸ்தாவைப் பயன்படுத்துபவர் யார்?', newS: 'புதிய மாணவர்', teacher: 'ஆசிரியர் உள்நுழைவு', newT: 'புதிய ஆசிரியர் கணக்கு', name: 'உங்கள் பெயர்', pin: '4 இலக்க PIN', pin2: 'PIN மீண்டும்', create: 'கணக்கை உருவாக்கு', signIn: 'உள்நுழை', wrong: 'தவறான PIN. மீண்டும் முயற்சிக்கவும்.', mismatch: 'PIN பொருந்தவில்லை அல்லது 4 இலக்கம் இல்லை.', needName: 'பெயரை உள்ளிடவும்.', out: 'வெளியேறு', sw: 'பயனரை மாற்று', as: 'உள்நுழைந்தவர்', dev: 'இந்தக் கைபேசியில் உள்ள மாணவர்கள்', none: 'இன்னும் மாணவர்கள் பதிவு செய்யவில்லை.', student: 'மாணவர்', tch: 'ஆசிரியர்', back: 'பின்', demo: 'வழங்குநர் டெமோ: காவ்யா', skills: 'திறன்கள்', top: 'முதல் வழி' },
    hi: { who: 'रास्ता कौन इस्तेमाल कर रहा है?', newS: 'नया विद्यार्थी', teacher: 'शिक्षक लॉगिन', newT: 'नया शिक्षक खाता', name: 'आपका नाम', pin: '4 अंकों का PIN', pin2: 'PIN दोबारा', create: 'खाता बनाएँ', signIn: 'साइन इन', wrong: 'गलत PIN. फिर कोशिश करें.', mismatch: 'PIN मेल नहीं खाता या 4 अंक नहीं हैं.', needName: 'कृपया नाम लिखें.', out: 'साइन आउट', sw: 'उपयोगकर्ता बदलें', as: 'साइन इन:', dev: 'इस फ़ोन के विद्यार्थी', none: 'अभी किसी विद्यार्थी ने खाता नहीं बनाया.', student: 'विद्यार्थी', tch: 'शिक्षक', back: 'वापस', demo: 'प्रस्तुति डेमो: काव्या', skills: 'स्किल्स', top: 'मुख्य रास्ता' },
    ml: { who: 'റാസ്ത ആരാണ് ഉപയോഗിക്കുന്നത്?', newS: 'പുതിയ വിദ്യാർത്ഥി', teacher: 'അധ്യാപക ലോഗിൻ', newT: 'പുതിയ അധ്യാപക അക്കൗണ്ട്', name: 'നിങ്ങളുടെ പേര്', pin: '4 അക്ക PIN', pin2: 'PIN വീണ്ടും', create: 'അക്കൗണ്ട് ഉണ്ടാക്കൂ', signIn: 'സൈൻ ഇൻ', wrong: 'തെറ്റായ PIN. വീണ്ടും ശ്രമിക്കൂ.', mismatch: 'PIN പൊരുത്തമില്ല അല്ലെങ്കിൽ 4 അക്കമല്ല.', needName: 'പേര് നൽകൂ.', out: 'സൈൻ ഔട്ട്', sw: 'ഉപയോക്താവിനെ മാറ്റൂ', as: 'സൈൻ ഇൻ ചെയ്തത്', dev: 'ഈ ഫോണിലെ വിദ്യാർത്ഥികൾ', none: 'ഇതുവരെ വിദ്യാർത്ഥികൾ ഇല്ല.', student: 'വിദ്യാർത്ഥി', tch: 'അധ്യാപകൻ', back: 'തിരികെ', demo: 'അവതരണ ഡെമോ: കാവ്യ', skills: 'കഴിവുകൾ', top: 'പ്രധാന വഴി' }
  };
  const a = k => (A[S.lang] || A.en)[k] || A.en[k];
  const load = () => { try { return JSON.parse(localStorage.getItem(UKEY) || '{}'); } catch (e) { return {}; } };
  const saveUsers = u => { try { localStorage.setItem(UKEY, JSON.stringify(u)); } catch (e) {} };
  let users = load();
  let session = null; try { session = JSON.parse(sessionStorage.getItem(SKEY) || localStorage.getItem(SKEY) || 'null'); } catch (e) {}
  const me = () => (session && session.demo ? { name: 'Kavya', role: 'student', demo: true } : session && users[session.id]);
  let ui = { mode: 'list', role: 'student', pick: null, err: '' };

  async function hash(pin, salt) {
    const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + pin));
    return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  const FIELDS = ['profile', 'skills', 'convo', 'msgs', 'step', 'aiDone', 'chatMode', 'aiRoutes', 'aiRoutesSig', 'careerId', 'sugg', 'asked', 'retried', 'lastAsking'];
  function snapshot() {
    const u = me(); if (!u || u.demo || !session) return;
    const d = {}; FIELDS.forEach(k => { d[k] = S[k]; }); d.msgs = (S.msgs || []).filter(m => !m.thinking);
    users[session.id].data = d; users[session.id].seen = Date.now(); saveUsers(users);
  }
  function restore(u) {
    const d = (u && u.data) || {};
    S.profile = d.profile || { state: 'TN', disability: false }; S.skills = d.skills || []; S.convo = d.convo || []; S.msgs = d.msgs || [];
    S.step = d.step || 0; S.aiDone = !!d.aiDone; S.chatMode = d.chatMode; S.aiRoutes = d.aiRoutes; S.aiRoutesSig = d.aiRoutesSig; S.careerId = d.careerId; S.sugg = d.sugg || []; S.asked = d.asked || []; S.retried = d.retried || []; S.lastAsking = d.lastAsking || null;
  }
  function startSession(id, remember) {
    session = { id }; try { sessionStorage.setItem(SKEY, JSON.stringify(session)); localStorage.setItem(SKEY, JSON.stringify(session)); } catch (e) {}
    const u = users[id]; restore(u); S.view = u.role === 'teacher' ? 'facilitator' : (S.step > 0 || S.aiDone ? 'talk' : 'start'); render();
  }
  function signOut() {
    snapshot(); session = null; try { sessionStorage.removeItem(SKEY); localStorage.removeItem(SKEY); } catch (e) {}
    restore(null); ui = { mode: 'list', role: 'student', pick: null, err: '' }; S.view = 'login'; render();
  }

  function loginView() {
    const list = Object.entries(users).sort((x, y) => (y[1].seen || 0) - (x[1].seen || 0));
    const head = `<div class="page-heading"><div class="eyebrow">RAASTA · ராஸ்தா</div><h1>${a('who')}</h1></div>`;
    const err = ui.err ? `<p class="auth-err" role="alert">${esc(ui.err)}</p>` : '';
    if (ui.mode === 'pin') {
      const u = users[ui.pick];
      return `${head}<form class="auth-form" id="authPin"><p><strong>${esc(u.name)}</strong> · ${a(u.role === 'teacher' ? 'tch' : 'student')}</p><label>${a('pin')}<input id="authPinIn" inputmode="numeric" pattern="[0-9]*" maxlength="4" type="password" autocomplete="off" required></label>${err}<button class="primary-action" type="submit">${a('signIn')} →</button><button class="secondary-action" type="button" data-act="auth-back">${a('back')}</button></form>`;
    }
    if (ui.mode === 'new') {
      return `${head}<form class="auth-form" id="authNew"><p><strong>${a(ui.role === 'teacher' ? 'newT' : 'newS')}</strong></p><label>${a('name')}<input id="authName" maxlength="40" autocomplete="off" required></label><label>${a('pin')}<input id="authP1" inputmode="numeric" pattern="[0-9]*" maxlength="4" type="password" autocomplete="off" required></label><label>${a('pin2')}<input id="authP2" inputmode="numeric" pattern="[0-9]*" maxlength="4" type="password" autocomplete="off" required></label>${err}<button class="primary-action" type="submit">${a('create')} →</button><button class="secondary-action" type="button" data-act="auth-back">${a('back')}</button></form>`;
    }
    return `${head}<div class="auth-list">${list.map(([id, u]) => `<button class="answer-option" data-act="auth-pick" data-id="${esc(id)}"><span>${esc(u.name)} <small>· ${a(u.role === 'teacher' ? 'tch' : 'student')}</small></span><span aria-hidden="true">→</span></button>`).join('')}</div>
      <button class="primary-action" data-act="auth-new" data-role="student">${a('newS')} →</button>
      <button class="secondary-action" data-act="auth-new" data-role="teacher">${a('teacher')}</button>
      <button class="text-action auth-demo" data-act="auth-demo">${a('demo')}</button>`;
  }
  function accountBar() {
    const u = me(); if (!u) return '';
    return `<div class="auth-bar"><span>${a('as')} <strong>${esc(u.name)}</strong> · ${a(u.role === 'teacher' ? 'tch' : 'student')}</span><button class="text-action" data-act="auth-out">${a('sw')}</button></div>`;
  }
  function deviceStudents() {
    const list = Object.values(users).filter(u => u.role === 'student');
    const rows = list.map(u => {
      const d = u.data || {}; const sk = (d.skills || []).join(', ');
      let top = d.aiRoutes && d.aiRoutes[0] ? d.aiRoutes[0].title : '';
      if (!top && d.profile) { try { const m = matchCareers(d.profile)[0]; top = m ? L(m.title) : ''; } catch (e) {} }
      return `<div class="auth-row"><strong>${esc(u.name)}</strong><span>${a('skills')}: ${esc(sk || '—')}</span><span>${a('top')}: ${esc(top || '—')}</span></div>`;
    }).join('');
    return `<section class="auth-dev"><div class="eyebrow">${a('dev')}</div>${rows || `<p>${a('none')}</p>`}</section>`;
  }

  // Wrap views and render without touching their logic.
  views.login = loginView;
  const baseFac = views.facilitator, baseProfile = views.profile;
  // Teacher's class: real students who signed up on this phone first, then the sample class (clearly marked).
  const FT = {
    en: { title: 'My class', sub: (r, d) => `${r} signed up on this phone · ${d} sample students`, students: 'Students', attention: 'Need a closer look', schemes: 'Scheme matches', referred: 'Referred', sample: 'Sample', real: 'On this phone', notStarted: 'Has not talked to Raasta yet', marks: 'Strong marks', many: 'Many interests', poor: 'Low family income', toCheck: n => `${n} schemes to check`, hide: 'Hide sample students', show: 'Show sample students', all: 'Show everyone', flagged: 'Only those who need a look', skills: 'Skills', top: 'Top route' },
    ta: { title: 'என் வகுப்பு', sub: (r, d) => `இந்தக் கைபேசியில் ${r} பேர் · ${d} மாதிரி மாணவர்கள்`, students: 'மாணவர்கள்', attention: 'கூடுதல் கவனம்', schemes: 'திட்டப் பொருத்தங்கள்', referred: 'பரிந்துரைத்தவை', sample: 'மாதிரி', real: 'இந்தக் கைபேசி', notStarted: 'இன்னும் ராஸ்தாவுடன் பேசவில்லை', marks: 'நல்ல மதிப்பெண்', many: 'பல ஆர்வங்கள்', poor: 'குறைந்த குடும்ப வருமானம்', toCheck: n => `சரிபார்க்க ${n} திட்டங்கள்`, hide: 'மாதிரி மாணவர்களை மறை', show: 'மாதிரி மாணவர்களைக் காட்டு', all: 'அனைவரையும் காட்டு', flagged: 'கவனம் தேவைப்படுவோர் மட்டும்', skills: 'திறன்கள்', top: 'முதல் வழி' },
    hi: { title: 'मेरी कक्षा', sub: (r, d) => `इस फ़ोन पर ${r} विद्यार्थी · ${d} नमूना विद्यार्थी`, students: 'विद्यार्थी', attention: 'ध्यान देने लायक', schemes: 'योजना मिलान', referred: 'रेफ़र किए', sample: 'नमूना', real: 'इस फ़ोन पर', notStarted: 'अभी रास्ता से बात नहीं की', marks: 'अच्छे अंक', many: 'कई रुचियाँ', poor: 'कम पारिवारिक आय', toCheck: n => `${n} योजनाएँ जाँचें`, hide: 'नमूना विद्यार्थी छिपाएँ', show: 'नमूना विद्यार्थी दिखाएँ', all: 'सभी दिखाएँ', flagged: 'केवल ध्यान देने लायक', skills: 'स्किल्स', top: 'मुख्य रास्ता' },
    ml: { title: 'എന്റെ ക്ലാസ്', sub: (r, d) => `ഈ ഫോണിൽ ${r} പേർ · ${d} മാതൃകാ വിദ്യാർത്ഥികൾ`, students: 'വിദ്യാർത്ഥികൾ', attention: 'ശ്രദ്ധ വേണ്ടവർ', schemes: 'പദ്ധതി പൊരുത്തങ്ങൾ', referred: 'റഫർ ചെയ്തവർ', sample: 'മാതൃക', real: 'ഈ ഫോണിൽ', notStarted: 'ഇതുവരെ റാസ്തയോട് സംസാരിച്ചിട്ടില്ല', marks: 'നല്ല മാർക്ക്', many: 'പല താൽപര്യങ്ങൾ', poor: 'കുറഞ്ഞ കുടുംബ വരുമാനം', toCheck: n => `പരിശോധിക്കാൻ ${n} പദ്ധതികൾ`, hide: 'മാതൃകാ വിദ്യാർത്ഥികളെ മറയ്ക്കൂ', show: 'മാതൃകാ വിദ്യാർത്ഥികളെ കാണിക്കൂ', all: 'എല്ലാവരെയും കാണിക്കൂ', flagged: 'ശ്രദ്ധ വേണ്ടവർ മാത്രം', skills: 'കഴിവുകൾ', top: 'പ്രധാന വഴി' }
  };
  const f = k => (FT[S.lang] || FT.en)[k] || FT.en[k];
  const hideSample = () => { try { return localStorage.getItem('raasta_hide_sample') === '1'; } catch (e) { return false; } };
  function roster() {
    const real = Object.entries(users).filter(([, u]) => u.role === 'student').sort((x, y) => (y[1].seen || 0) - (x[1].seen || 0)).map(([id, u]) => {
      const d = u.data || {};
      return { student_id: 'u:' + id, name: u.name, profile: d.profile || {}, skills: d.skills || [], aiRoutes: d.aiRoutes || [], real: true };
    });
    const demo = hideSample() ? [] : STUDENTS.map(s => ({ student_id: s.student_id, name: s.name, profile: s, skills: [], aiRoutes: [], real: false }));
    return real.concat(demo).map(s => {
      const p = s.profile, started = Object.keys(p).some(k => !['state', 'disability'].includes(k)) || s.skills.length > 0;
      const why = [];
      if (p.marks_percent >= 80) why.push(f('marks'));
      if ((p.interests || []).length + s.skills.length >= 2) why.push(f('many'));
      if (p.family_income_lakh != null && p.family_income_lakh <= 1) why.push(f('poor'));
      let top = s.aiRoutes[0] ? s.aiRoutes[0].title : '';
      if (!top && started) { try { const m = matchCareers(p)[0]; top = m ? L(m.title) : ''; } catch (e) {} }
      let n = 0; if (started) { try { n = eligibility(p).filter(e => e.status !== 'not_eligible').length; } catch (e) {} }
      return { ...s, started, why, top, n, flag: started && (talentFlag(p) || why.length > 0) };
    });
  }
  function classView() {
    const all = roster(), rows = all.filter(s => S.facilitatorFilter !== 'flagged' || s.flag);
    const nReal = all.filter(s => s.real).length, nDemo = all.length - nReal;
    const row = s => `<article class="student-row"><div><strong>${esc(s.name)}</strong> <span class="status-label" style="font-size:11px;opacity:.8">${s.real ? f('real') : f('sample')}</span>`
      + (s.started
        ? `<p>${f('top')}: ${esc(s.top || '—')}</p>${s.skills.length ? `<p>${f('skills')}: ${esc(s.skills.join(', '))}</p>` : ''}<p>${s.n ? f('toCheck')(s.n) : ''}${s.why.length ? (s.n ? ' · ' : '') + '⚑ ' + esc(s.why.join(', ')) : ''}</p>`
        : `<p>${f('notStarted')}</p>`)
      + `</div>${S.recommended[s.student_id] ? `<span class="status-label">${t('referredDone')}</span>` : (s.started ? `<button class="secondary-action" data-act="rec" data-v="${esc(s.student_id)}">${t('refer')}</button>` : '')}</article>`;
    return `<div class="facilitator-view"><div class="page-heading"><div class="eyebrow">${t('teacher')}</div><h1>${f('title')}</h1><p>${f('sub')(nReal, nDemo)}</p></div>`
      + `<div class="metrics"><div><strong>${all.length}</strong><span>${f('students')}</span></div><div><strong>${all.filter(s => s.flag).length}</strong><span>${f('attention')}</span></div><div><strong>${all.reduce((x, s) => x + s.n, 0)}</strong><span>${f('schemes')}</span></div><div><strong>${Object.keys(S.recommended).length}</strong><span>${f('referred')}</span></div></div>`
      + `<button class="filter-action" data-act="filter-fac" data-v="${S.facilitatorFilter === 'flagged' ? 'all' : 'flagged'}">${S.facilitatorFilter === 'flagged' ? f('all') : f('flagged')}</button> <button class="filter-action" data-act="auth-sample">${hideSample() ? f('show') : f('hide')}</button>`
      + rows.map(row).join('') + `</div>`;
  }
  views.facilitator = () => accountBar() + classView();
  views.profile = () => accountBar() + baseProfile();
  const baseRender = render;
  render = function () {
    const u = me();
    if (!u && S.view !== 'language' && S.view !== 'login') S.view = 'login';
    if (u && u.role !== 'teacher' && S.view === 'facilitator') S.view = 'careers';
    if (u && u.role === 'teacher' && !['facilitator', 'language'].includes(S.view)) S.view = 'facilitator';
    baseRender();
    const pb = document.getElementById('profileHeaderBtn'); if (pb && u && u.role !== 'teacher') pb.style.display = '';
    const fac = document.querySelector('.app-navbar [data-v="facilitator"]');
    if (fac) fac.style.display = (u && u.role === 'teacher') ? '' : 'none';
    const nav = document.getElementById('appNavbar'); if (nav && (!u || u.role === 'teacher' || S.view === 'login')) nav.style.display = 'none';
    snapshot();
  };

  document.addEventListener('click', e => {
    const x = e.target.closest('[data-act^="auth-"],[data-act="kavya"]'); if (!x) return;
    const act = x.dataset.act;
    if (act === 'auth-sample') { try { localStorage.setItem('raasta_hide_sample', hideSample() ? '0' : '1'); } catch (er) {} render(); return; }
    if (act === 'kavya' && !me()) { session = { demo: true }; try { sessionStorage.setItem(SKEY, JSON.stringify(session)); } catch (er) {} return; }
    if (act === 'auth-pick') { ui = { mode: 'pin', pick: x.dataset.id, err: '' }; render(); setTimeout(() => document.getElementById('authPinIn')?.focus(), 0); }
    if (act === 'auth-new') { ui = { mode: 'new', role: x.dataset.role, err: '' }; render(); setTimeout(() => document.getElementById('authName')?.focus(), 0); }
    if (act === 'auth-back') { ui = { mode: 'list', err: '' }; render(); }
    if (act === 'auth-out') signOut();
    if (act === 'auth-demo') { session = { demo: true }; try { sessionStorage.setItem(SKEY, JSON.stringify(session)); sessionStorage.setItem('raasta_demo_mode', '1'); } catch (er) {} S.profile = { ...KAVYA }; S.msgs = [{ who: 'bot', text: t('routeReady') }]; S.step = QUESTIONS.length; S.view = 'careers'; render(); }
  });
  document.addEventListener('submit', async e => {
    if (e.target.id === 'authNew') {
      e.preventDefault();
      const name = document.getElementById('authName').value.trim(), p1 = document.getElementById('authP1').value, p2 = document.getElementById('authP2').value;
      if (!name) { ui.err = a('needName'); return render(); }
      if (!/^\d{4}$/.test(p1) || p1 !== p2) { ui.err = a('mismatch'); return render(); }
      const id = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const salt = Math.random().toString(36).slice(2) + Date.now().toString(36);
      users[id] = { name, role: ui.role === 'teacher' ? 'teacher' : 'student', salt, pin: await hash(p1, salt), seen: Date.now() };
      saveUsers(users); startSession(id);
    }
    if (e.target.id === 'authPin') {
      e.preventDefault();
      const u = users[ui.pick]; const pin = document.getElementById('authPinIn').value;
      if (u && (await hash(pin, u.salt)) === u.pin) startSession(ui.pick);
      else { ui.err = a('wrong'); render(); setTimeout(() => document.getElementById('authPinIn')?.focus(), 0); }
    }
  });
  window.RaastaAuth = { signOut, me };
  if (session && !session.demo && users[session.id]) { restore(users[session.id]); }
  render();
})();
