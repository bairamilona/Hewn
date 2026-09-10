const V = "hewn-v4";
const CACHE = [
  "/",
  "/index.html",
  "/vendor/react.js",
  "/vendor/react-dom.js",
  "/vendor/babel.js",
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

// Map the runtime CDN libraries to same-origin vendored copies. If unpkg is
// ever unreachable (outage, blocked network, region, ad-blocker) the app would
// white-screen; serving these locally makes it robust and fully offline-capable.
const CDN_TO_VENDOR = {
  "https://unpkg.com/react@18/umd/react.production.min.js": "/vendor/react.js",
  "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js": "/vendor/react-dom.js",
  "https://unpkg.com/@babel/standalone/babel.min.js": "/vendor/babel.js"
};

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
  const req = e.request;

  // 1) Redirect known CDN libraries to the vendored same-origin files.
  const vendor = CDN_TO_VENDOR[req.url];
  if (vendor) {
    e.respondWith(
      caches.match(vendor).then(c => c || fetch(vendor))
    );
    return;
  }

  // 2) Network-first for the app shell (HTML) so users always get latest code;
  //    fall back to cache when offline.
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

  // 3) Cache-first for everything else (images, vendored assets).
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
