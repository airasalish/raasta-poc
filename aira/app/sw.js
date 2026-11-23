// Offline-first: cache the app shell + rules/data so the whole Kavya journey works in airplane mode.
const CACHE = "raasta-v13";
const FILES = ["./", "index.html", "presenter.html", "presenter.css", "presenter.js", "app.js", "engine.js", "data.js", "voice.js", "auth.js", "manifest.json","intro.css","intro.js","assets/illustrations/raahi-default.jpg","assets/audio/kavya-parent-ta.mp3","raasta-icon-192.png","raasta-icon-512.png","raasta-icon-maskable.png"];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))));
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // Only cache our own static GETs. Voice calls (/api/*) and other sites always go to the network.
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
