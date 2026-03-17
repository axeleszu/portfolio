const CACHE_NAME = "icons-v1";

const ICON_ASSETS = [
    "/favicon.svg",
    "/favicon-32x32.png",
    "/apple-touch-icon.png",
    "/site.webmanifest"
];

self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ICON_ASSETS))
    );
});

self.addEventListener("activate", (event) => {
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    if (
        url.pathname.endsWith(".svg") ||
        url.pathname.endsWith(".png") ||
        url.pathname.endsWith(".webmanifest")
    ) {
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request);
            })
        );
    }
});