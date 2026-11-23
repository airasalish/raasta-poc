(() => {
  const frame = document.getElementById('appFrame');
  const loading = document.getElementById('frameLoading');
  const deviceWrap = document.getElementById('deviceWrap');
  const modeLabel = document.getElementById('frameModeLabel');
  const stageIndex = document.getElementById('stageIndex');
  const stages = [...document.querySelectorAll('[data-stage]')];
  const stageMeta = {
    talk: { index: '01 / 06', label: 'Talk, Don’t Type', view: 'talk', eyebrow: 'Start in her own words', title: 'Talk.<br><em>Discover.</em><br>Plan.', copy: 'A voice-first conversation that learns from what she says — not a form.', route: ['Talk', 'Discover', 'Explore', 'Plan'] },
    facilitator: { index: '02 / 06', label: 'Facilitator Mode', view: 'facilitator', eyebrow: 'For the people beside her', title: 'Guide.<br><em>Track.</em><br>Refer.', copy: 'A calm, quick view for teachers to notice strengths and recommend a next step.', route: ['View students', 'Track progress', 'Suggest routes', 'Refer'] },
    pathway: { index: '03 / 06', label: 'My Pathway', view: 'pathway', eyebrow: 'A route, made practical', title: 'Learn.<br><em>Practise.</em><br>Move forward.', copy: 'A week-by-week plan connects her starting skills to courses, practice and next steps.', route: ['Learn', 'Practise', 'Qualify', 'Next step'] },
    parent: { index: '04 / 06', label: 'Parent Mode', view: 'pathway', parent: true, eyebrow: 'A family guide, in her language', title: 'Listen.<br><em>Understand.</em><br>Decide together.', copy: 'A spoken guide helps families hear about costs, opportunities and what to verify.', route: ['Listen', 'Understand costs', 'Review options', 'Decide together'] },
    radar: { index: '05 / 06', label: 'Opportunity Radar', view: 'radar', eyebrow: 'Check before the next step', title: 'Check.<br><em>Verify.</em><br>Apply with care.', copy: 'See the profile checks and official sources. Demo rules stay clearly marked for verification.', route: ['Eligibility', 'Read rules', 'Check source', 'Next step'] },
    careers: { index: '06 / 06', label: 'Career Routes', view: 'careers', eyebrow: 'Possible destinations', title: 'A route<br><em>that starts with you.</em>', copy: 'Explore professional, vocational, emerging and government routes from skills she already has.', route: ['Today', 'Learn', 'Next step'] }
  };
  const storyPanel = document.getElementById('storyPanel');
  const storyEyebrow = document.getElementById('storyEyebrow');
  const storyTitle = document.getElementById('storyTitle');
  const storyCopy = document.getElementById('storyCopy');
  const storyRoute = document.getElementById('storyRoute');

  const updateStory = (key) => {
    const meta = stageMeta[key];
    if (!meta) return;
    storyPanel.dataset.stage = key;
    storyEyebrow.textContent = meta.eyebrow;
    storyTitle.innerHTML = meta.title;
    storyCopy.textContent = meta.copy;
    storyRoute.dataset.count = String(meta.route.length);
    storyRoute.setAttribute('aria-label', meta.route.join(' → '));
    storyRoute.innerHTML = meta.route.map((step, index) => `${index ? '<span class="route-link" aria-hidden="true"></span>' : ''}<span class="route-point">${step}</span>`).join('');
  };
  const deviceLabels = { mobile: 'Mobile view', tablet: 'Tablet view', desktop: 'Desktop view' };
  let activeStage = 'talk';

  const primeDemoStorage = (key) => {
    try {
      frame.contentWindow.sessionStorage.setItem('raasta_demo_mode', '1');
      frame.contentWindow.sessionStorage.setItem('raasta_session', JSON.stringify({ demo: true, teacherDemo: key === 'facilitator' }));
    } catch {}
  };

  const navigate = (key) => {
    const meta = stageMeta[key];
    if (!meta) return;
    activeStage = key;
    updateStory(key);
    stages.forEach(button => {
      const active = button.dataset.stage === key;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-current', active ? 'step' : 'false');
    });
    stageIndex.textContent = meta.index;
    loading.classList.remove('is-hidden');
    primeDemoStorage(key);
    frame.src = `index.html?demo=kavya&stage=${Date.now()}#${key === 'talk' ? 'start' : meta.view}`;
  };

  const updateDevice = (device) => {
    deviceWrap.dataset.device = device;
    modeLabel.textContent = deviceLabels[device] || deviceLabels.mobile;
    document.querySelectorAll('[data-device]').forEach(button => {
      if (button === deviceWrap) return;
      const active = button.dataset.device === device;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  };

  stages.forEach(button => button.addEventListener('click', () => navigate(button.dataset.stage)));
  document.querySelectorAll('.device-choice').forEach(button => button.addEventListener('click', () => updateDevice(button.dataset.device)));
  document.getElementById('runDemoBtn')?.addEventListener('click', () => navigate('talk'));
  frame.addEventListener('load', () => {
    loading.classList.add('is-hidden');
    const stage = activeStage;
    const meta = stageMeta[stage];
    if (!meta) return;
  primeDemoStorage(stage);
  window.setTimeout(() => {
      try {
        if (stage !== activeStage) return;
        const app = frame.contentWindow;
        const doc = app.document;
        if (!app.RaastaAuth?.me?.()) doc.querySelector('[data-act="auth-demo"]')?.click();
        if (stage === 'talk') app.startChat(true);
        else {
          app.navigateTo(meta.view);
          if (meta.parent) doc.querySelector('[data-act="parent"]')?.click();
        }
      } catch {}
    }, 180);
  });
  document.getElementById('fullscreenBtn')?.addEventListener('click', async () => {
    const target = document.querySelector('.device-stage');
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await target.requestFullscreen();
    } catch {}
  });
  document.addEventListener('fullscreenchange', () => {
    const button = document.getElementById('fullscreenBtn');
    const active = Boolean(document.fullscreenElement);
    button?.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen');
    button?.classList.toggle('is-fullscreen', active);
  });
  frame.addEventListener('error', () => loading.classList.add('is-hidden'));
  updateStory(activeStage);
  updateDevice('mobile');
})();
