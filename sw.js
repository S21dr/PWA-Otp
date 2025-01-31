self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open("pwa-cache").then((cache) => {
            return cache.addAll([
                "/PWA-Otp/",
                "/PWA-Otp/index.html",
                "/PWA-Otp/offline.html"
            ]);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

// Перехват всех fetch-запросов
self.addEventListener("fetch", (event) => {
    if (event.request.headers.get("x-msw-bypass") === "true") {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .catch(() => caches.match("/PWA-Otp/offline.html"))
    );
});