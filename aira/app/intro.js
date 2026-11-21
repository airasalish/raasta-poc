(() => {
  const seen = (() => { try { return JSON.parse(localStorage.getItem('raasta_intro_seen') || '{}'); } catch { return {}; } })();
  const cfg = {
    talk: { img: 'raahi-default.jpg', title: { en: 'Talk, Don’t Type', ta: 'பேசுங்கள். தட்டச்சு வேண்டாம்.', hi: 'बोलें, टाइप न करें', ml: 'സംസാരിക്കൂ, ടൈപ്പ് വേണ്ട' }, rows: { en: ['Speak in your own language', 'Tap an answer when offline', 'Build your route as you talk'], ta: ['உங்கள் மொழியில் பேசுங்கள்', 'இணையமின்றி பதிலைத் தட்டுங்கள்', 'பேசப் பேச உங்கள் பாதை உருவாகும்'], hi: ['अपनी भाषा में बोलें', 'ऑफ़लाइन उत्तर चुनें', 'बोलते हुए अपनी राह बनाएँ'], ml: ['നിങ്ങളുടെ ഭാഷയിൽ സംസാരിക്കൂ', 'ഓഫ്‌ലൈൻ ഉത്തരം തിരഞ്ഞെടുക്കൂ', 'സംസാരിക്കുമ്പോൾ വഴി നിർമ്മിക്കൂ'] } },
    careers: { img: 'raahi-default.jpg', title: { en: 'Your Routes', ta: 'உங்களுக்கான பாதைகள்', hi: 'आपकी करियर राहें', ml: 'നിങ്ങളുടെ തൊഴിൽ വഴികൾ' }, rows: { en: ['See professional and vocational routes', 'Understand why each route fits', 'Open a pathway when ready'], ta: ['தொழில் மற்றும் திறன் வழிகளைப் பாருங்கள்', 'ஒவ்வொரு வழியும் ஏன் பொருந்தும் என்று தெரிந்துகொள்ளுங்கள்', 'தயாரானதும் பாதையைத் திறக்குங்கள்'], hi: ['पेशेवर और कौशल रास्ते देखें', 'हर रास्ता क्यों सही है समझें', 'तैयार हों तो राह खोलें'], ml: ['തൊഴിൽ വഴികൾ കാണൂ', 'ഓരോ വഴിയും എന്തുകൊണ്ട് യോജിക്കുന്നു മനസ്സിലാക്കൂ', 'തയ്യാറാകുമ്പോൾ വഴി തുറക്കൂ'] } },
    radar: { img: 'raahi-default.jpg', title: { en: 'Opportunity Radar', ta: 'வாய்ப்பு ரேடார்', hi: 'अवसर रडार', ml: 'അവസര റഡാർ' }, rows: { en: ['See the possible benefit first', 'Read every rule behind a match', 'Open the official source before applying'], ta: ['முதலில் கிடைக்கக்கூடிய உதவியைப் பாருங்கள்', 'ஒவ்வொரு விதியையும் படியுங்கள்', 'விண்ணப்பிக்கும் முன் அதிகாரப்பூர்வ மூலத்தைத் திறக்குங்கள்'], hi: ['पहले संभावित लाभ देखें', 'हर नियम पढ़ें', 'आवेदन से पहले आधिकारिक स्रोत खोलें'], ml: ['ആദ്യം ലഭിക്കാവുന്ന സഹായം കാണൂ', 'ഓരോ നിയമവും വായിക്കൂ', 'അപേക്ഷിക്കുന്നതിന് മുമ്പ് ഔദ്യോഗിക ഉറവിടം തുറക്കൂ'] } },
    pathway: { img: 'raahi-default.jpg', title: { en: 'My Pathway', ta: 'என் பாதை', hi: 'मेरी राह', ml: 'എന്റെ വഴി' }, rows: { en: ['Move week by week', 'Use trusted learning links', 'Share the plan with family'], ta: ['வாரம் வாரமாக முன்னேறுங்கள்', 'நம்பகமான கற்றல் இணைப்புகளைப் பயன்படுத்துங்கள்', 'திட்டத்தை குடும்பத்துடன் பகிருங்கள்'], hi: ['सप्ताह दर सप्ताह आगे बढ़ें', 'विश्वसनीय सीखने के लिंक देखें', 'परिवार के साथ योजना साझा करें'], ml: ['ആഴ്ചതോറും മുന്നേറൂ', 'വിശ്വസനീയ പഠന ലിങ്കുകൾ ഉപയോഗിക്കൂ', 'കുടുംബവുമായി പദ്ധതി പങ്കിടൂ'] } },
    parent: { img: 'raahi-default.jpg', title: { en: 'Parent Mode', ta: 'பெற்றோர் வழிகாட்டி', hi: 'परिवार के लिए', ml: 'കുടുംബത്തിനായി' }, rows: { en: ['Hear a respectful family note', 'See the words on screen too', 'Check official details before acting'], ta: ['மரியாதையான குடும்பக் குறிப்பைக் கேளுங்கள்', 'சொற்களை திரையிலும் பாருங்கள்', 'செயல்படும் முன் அதிகாரப்பூர்வ விவரங்களைச் சரிபார்க்குங்கள்'], hi: ['परिवार के लिए सम्मानजनक संदेश सुनें', 'शब्द स्क्रीन पर भी देखें', 'कदम उठाने से पहले आधिकारिक जानकारी जाँचें'], ml: ['കുടുംബത്തിനായുള്ള സന്ദേശം കേൾക്കൂ', 'വാക്കുകൾ സ്ക്രീനിലും കാണൂ', 'നടപടിക്ക് മുമ്പ് ഔദ്യോഗിക വിവരം പരിശോധിക്കൂ'] } },
    facilitator: { img: 'raahi-default.jpg', title: { en: 'Facilitator Mode', ta: 'வழிகாட்டி முறை', hi: 'सुविधाकर्ता मोड', ml: 'ഫെസിലിറ്റേറ്റർ മോഡ്' }, rows: { en: ['Scan the student list quickly', 'Spot learners who need attention', 'Recommend the next step in one tap'], ta: ['மாணவர் பட்டியலை விரைவாகப் பாருங்கள்', 'கவனம் தேவைப்படுவோரைக் கண்டறியுங்கள்', 'ஒரே தட்டலில் அடுத்த படியைப் பரிந்துரையுங்கள்'], hi: ['विद्यार्थी सूची जल्दी देखें', 'जिन्हें ध्यान चाहिए उन्हें पहचानें', 'एक टैप में अगला कदम सुझाएँ'], ml: ['വിദ്യാർത്ഥി പട്ടിക വേഗം കാണൂ', 'ശ്രദ്ധ ആവശ്യമുള്ളവരെ കണ്ടെത്തൂ', 'ഒറ്റ ടാപ്പിൽ അടുത്ത പടി ശുപാർശ ചെയ്യൂ'] } }
  };
  const art = { start: ['raahi-default.jpg', 'welcome-art'], talk: ['raahi-default.jpg', 'view-art'], careers: ['raahi-default.jpg', 'view-art'], radar: ['raahi-default.jpg', 'view-art'], pathway: ['raahi-default.jpg', 'view-art'], profile: ['raahi-default.jpg', 'view-art'], facilitator: ['raahi-default.jpg', 'view-art'] };
  const rowIcons = ['<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M9 5h10v10"/></svg>', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16M13 5l7 7-7 7"/></svg>'];
  const labels = { en: { begin: 'Let’s begin', hear: 'Hear the note', later: 'Not now', alt: 'Raahi illustration' }, ta: { begin: 'தொடங்கலாம்', hear: 'கேட்கத் தொடங்குங்கள்', later: 'இப்போது வேண்டாம்', alt: 'ராஹி விளக்கம்' }, hi: { begin: 'शुरू करें', hear: 'संदेश सुनें', later: 'अभी नहीं', alt: 'राही का चित्र' }, ml: { begin: 'തുടങ്ങാം', hear: 'സന്ദേശം കേൾക്കൂ', later: 'ഇപ്പോൾ വേണ്ട', alt: 'റാഹിയുടെ ചിത്രം' } };
  let current = null;
  let lastFocused = null;
  let allowParent = false;
  const lang = () => document.documentElement.lang || 'en';
  const text = (o) => o[lang()] || o.en;
  const persist = () => { try { localStorage.setItem('raasta_intro_seen', JSON.stringify(seen)); } catch {} };
  const mark = (key) => { seen[key] = true; persist(); };
  const close = () => { const target = lastFocused; current = null; document.getElementById('introLayer')?.replaceChildren(); if (target && typeof target.focus === 'function') setTimeout(() => target.focus(), 0); lastFocused = null; };
  const featureFromView = () => document.querySelector('.app-navbar button.active')?.dataset.v || '';
  const addArt = () => {
    const view = featureFromView() || (document.querySelector('.welcome') ? 'start' : '');
    const item = art[view];
    if (!item || document.querySelector('.field-atlas-screen-art')) return;
    const host = view === 'start' ? document.querySelector('.welcome') : document.querySelector('.page-heading');
    if (!host) return;
    const image = document.createElement('img'); image.className = `${item[1]} field-atlas-screen-art`; image.src = `assets/illustrations/${item[0]}`; image.alt = ''; image.width = view === 'start' ? 320 : 110; image.height = view === 'start' ? 155 : 74; image.decoding = 'async';
    host.prepend(image);
  };
  const show = (key) => {
    if (!cfg[key] || seen[key] || sessionStorage.getItem('raasta_demo_mode') === '1') return;
    current = key;
    lastFocused = document.activeElement;
    const c = cfg[key], l = labels[lang()] || labels.en;
    const layer = document.getElementById('introLayer'); if (!layer) return;
    layer.innerHTML = `<div class="intro-backdrop" data-intro-close></div><section class="intro-sheet" id="introDialog" role="dialog" aria-modal="true" aria-labelledby="introTitle"><button class="intro-close" type="button" aria-label="Close" data-intro-close>×</button><img class="intro-art" src="assets/illustrations/${c.img}" alt="${l.alt}" width="320" height="155" decoding="async"><div class="intro-kicker">RAASTA · ராஸ்தா</div><h2 id="introTitle">${text(c.title)}</h2><div class="intro-rows">${text(c.rows).map((row, i) => `<div class="intro-row"><span class="intro-row-icon" aria-hidden="true">${rowIcons[i]}</span><span>${row}</span></div>`).join('')}</div><button class="primary-action intro-primary" type="button" data-intro-primary>${key === 'parent' ? l.hear : l.begin}<span aria-hidden="true">→</span></button><button class="intro-skip" type="button" data-intro-skip>${l.later}</button></section>`;
    const hero = layer.querySelector('.intro-art');
    hero?.addEventListener('error', () => { hero.src = 'assets/illustrations/raahi-default.jpg'; }, { once: true });
    document.querySelector('#introDialog .intro-close')?.focus();
  };
  const reset = () => { Object.keys(seen).forEach(k => delete seen[k]); persist(); close(); };
  const observer = new MutationObserver(() => { addArt(); const f = featureFromView(); if (f && cfg[f]) setTimeout(() => show(f), 0); });
  const init = () => { addArt(); const f = featureFromView(); if (f && cfg[f]) setTimeout(() => show(f), 0); observer.observe(document.getElementById('viewContainer') || document.body, { childList: true, subtree: true }); };
  document.addEventListener('click', (event) => {
    const closeTarget = event.target.closest('[data-intro-close]');
    if (closeTarget) { mark(current); close(); return; }
    const primary = event.target.closest('[data-intro-primary]');
    if (primary) { const key = current; mark(key); close(); if (key === 'parent') { allowParent = true; document.querySelector('[data-act="parent"]')?.click(); } return; }
    const skip = event.target.closest('[data-intro-skip]');
    if (skip) { mark(current); close(); return; }
    const demo = event.target.closest('[data-act="kavya"]');
    if (demo) { sessionStorage.setItem('raasta_demo_mode', '1'); Object.keys(cfg).forEach(mark); return; }
    const parent = event.target.closest('[data-act="parent"]');
    if (parent && !allowParent) { event.preventDefault(); event.stopImmediatePropagation(); show('parent'); return; }
    if (parent && allowParent) allowParent = false;
    if (event.target.closest('[data-act="reset-intros"]')) reset();
  }, true);
  document.addEventListener('keydown', (event) => {
    if (!current) return;
    if (event.key === 'Escape') { mark(current); close(); return; }
    if (event.key === 'Tab') { const d = document.getElementById('introDialog'); const focusable = [...(d?.querySelectorAll('button') || [])]; if (!focusable.length) return; if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1).focus(); } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); } }
  });
  window.RaastaResetIntros = reset;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

