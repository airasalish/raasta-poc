(() => {
  const frame = document.getElementById('appFrame');
  const loading = document.getElementById('frameLoading');
  const deviceWrap = document.getElementById('deviceWrap');
  const modeLabel = document.getElementById('frameModeLabel');
  const stageIndex = document.getElementById('stageIndex');
  const stages = [...document.querySelectorAll('[data-stage]')];
  const stageMeta = {
    talk: { index: '01 / 05', label: 'Talk, Don’t Type', view: 'talk' },
    careers: { index: '02 / 05', label: 'Career Routes', view: 'careers' },
    radar: { index: '03 / 05', label: 'Opportunity Radar', view: 'radar' },
    pathway: { index: '04 / 05', label: 'My Pathway', view: 'pathway' },
    parent: { index: '05 / 05', label: 'Parent Mode', view: 'parent' }
  };
  const deviceLabels = { mobile: 'Mobile view', tablet: 'Tablet view', desktop: 'Desktop view' };
  let activeStage = 'talk';

  const primeDemoStorage = () => {
    try {
      frame.contentWindow.sessionStorage.setItem('raasta_demo_mode', '1');
    } catch {}
  };

  const navigate = (key) => {
    const meta = stageMeta[key];
    if (!meta) return;
    activeStage = key;
    stages.forEach(button => {
      const active = button.dataset.stage === key;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-current', active ? 'step' : 'false');
    });
    stageIndex.textContent = meta.index;
    loading.classList.remove('is-hidden');
    primeDemoStorage();
    frame.src = `https://raasta-poc.vercel.app/index.html?demo=kavya#${meta.view}`;
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
    if (stageMeta[activeStage]?.parent) {
      primeDemoStorage();
      window.setTimeout(() => {
        try { frame.contentWindow.document.querySelector('[data-act="parent"]')?.click(); } catch {}
      }, 180);
    }
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
  updateDevice('mobile');
  const setMode = (mode) => {
    document.body.classList.toggle('mode-sim', mode === 'sim');
    document.querySelectorAll('.mode-choice').forEach(b => b.classList.toggle('is-active', b.dataset.mode === mode));
    const lbl = document.querySelector('.toolbar-label'); if (lbl) lbl.lastChild.textContent = mode === 'sim' ? 'OFFLINE REPLAY' : 'LIVE APP';
    if (mode === 'sim') { loading.classList.add('is-hidden'); updateDevice('mobile'); }
    else window.RaastaSim?.pause();
  };
  document.querySelectorAll('.mode-choice').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
  if (new URLSearchParams(location.search).get('mode') === 'sim') setMode('sim');
  try {
    if (window.QRCode) new QRCode(document.getElementById('qrCode'), { text: 'https://raasta-poc.vercel.app/', width: 168, height: 168, colorDark: '#102d22', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
  } catch {}
})();
