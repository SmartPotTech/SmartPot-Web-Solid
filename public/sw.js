// Service worker de SmartPot: app shell en caché; la API y /config.js siempre desde la red.
const CACHE = "smartpot-shell-v1";
const SHELL = [
    "/",
    "/app",
    "/manifest.webmanifest",
    "/favicon.svg",
    "/icons/icon-192.png",
    "/icons/icon-512.png",
    "/icons/icon-maskable-192.png",
    "/icons/icon-maskable-512.png",
    "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
            .then(() => self.clients.claim()),
    );
});

self.addEventListener("fetch", (event) => {
    const request = event.request;
    if (request.method !== "GET") return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin || url.pathname === "/config.js") return;

    // Navegación: red primero y, sin conexión, la última versión de la app.
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(CACHE).then((cache) => cache.put(url.pathname.startsWith("/app") ? "/app" : request, copy));
                    return response;
                })
                .catch(() => caches.match(request).then((cached) => cached || caches.match("/app") || caches.match("/"))),
        );
        return;
    }

    // Recursos con hash en el nombre: nunca cambian, caché primero.
    event.respondWith(
        caches.match(request).then((cached) => cached || fetch(request).then((response) => {
            if (response.ok && (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/"))) {
                const copy = response.clone();
                caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
        })),
    );
});
