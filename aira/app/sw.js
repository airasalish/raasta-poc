// Offline-first: cache the app shell + rules/data so the whole Kavya journey works in airplane mode.
const CACHE = "raasta-v2";
const FILES = ["./", "index.html", "app.js", "engine.js", "data.js", "manifest.json","intro.css","intro.js","assets/illustrations/raahi-default.jpg","assets/illustrations/welcome.jpg","assets/illustrations/profile.jpg","assets/illustrations/careers.jpg","assets/illustrations/skills-learning.jpg","assets/illustrations/opportunities.jpg","assets/illustrations/pathway.jpg","assets/illustrations/voice.jpg","assets/illustrations/empty-opportunities.jpg","assets/illustrations/success.jpg","raasta-icon-192.png","raasta-icon-512.png","raasta-icon-maskable.png"];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))));
self.addEventListener("fetch", e => {
  e.respondWith(fetch(e.request).then(r => {
    const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r;
  }).catch(() => caches.match(e.request)));
});
