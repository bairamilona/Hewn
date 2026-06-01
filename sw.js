const V = "hewn-v1";
const CACHE = [
  "/",
  "/index.html",
  "/assets/emojis/state1.png",
  "/assets/emojis/state2.png",
  "/assets/emojis/state3.png",
  "/assets/emojis/state4.png",
  "/assets/emojis/state5.png",
  "/assets/emojis/state6.png",
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
