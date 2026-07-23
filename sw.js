const V = "hewn-v3";
const CACHE = [
  "/",
  "/index.html",
  "/assets/emojis/state1.png",
  "/assets/emojis/state2.png",
  "/assets/emojis/state3.png",
  "/assets/emojis/state4.png",
  "/assets/emojis/state5.png",
  "/assets/emojis/state6.png",
  "/assets/icons/icon-180.png",
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

// Network-first for the app shell (HTML) so users always get the latest code;
// cache-first for static assets (images) for speed and offline use.
self.addEventListener("fetch", e => {
  const req = e.request;
  const isDoc = req.mode === "navigate" ||
    (req.method === "GET" && req.headers.get("accept")?.includes("text/html"));

  if (isDoc) {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(V).then(c => c.put("/index.html", copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then(c => c || caches.match("/index.html")))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
