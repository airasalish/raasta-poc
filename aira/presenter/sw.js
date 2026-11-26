// Caches the presenter page so the offline replay works with no internet.
const CACHE = 'raasta-presenter-v1';
const FILES = ['./', 'index.html', 'presenter.css', 'presenter.js', 'presenter-sim.js', 'data.js', 'kb_slice.js', 'engine.js', 'parentMode.js'];
const QR = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES).then(() => fetch(QR, { mode: 'no-cors' }).then(r => c.put(QR, r)).catch(() => {}))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = e.request.url;
  if (e.request.method !== 'GET' || !(u.startsWith(self.location.origin) || u === QR)) return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
