// ============================
// SERVICE WORKER — Todo PWA
// ============================

const CACHE_NAME = "todo-pwa-v1";
const STATIC_CACHE = "todo-static-v1";
const DYNAMIC_CACHE = "todo-dynamic-v1";

// Files to cache on install (App Shell)
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/src/css/app.css",
  "/src/js/app.js",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// ---- INSTALL ----
// Cache all static assets when SW installs
self.addEventListener("install", (event) => {
  console.log("[SW] Installing Service Worker...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Pre-caching App Shell");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("[SW] Install complete");
        return self.skipWaiting(); // Activate immediately
      })
  );
});

// ---- ACTIVATE ----
// Clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating Service Worker...");

  event.waitUntil(
    caches
      .keys()
      .then((keyList) => {
        return Promise.all(
          keyList.map((key) => {
            if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
              console.log("[SW] Removing old cache:", key);
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => {
        console.log("[SW] Activated");
        return self.clients.claim(); // Take control of all pages
      })
  );
});

// ---- FETCH ----
// Cache-First strategy for static assets
// Network-First strategy for dynamic content
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip cross-origin requests
  if (url.origin !== location.origin) return;

  // Static assets → Cache First
  if (
    STATIC_ASSETS.includes(url.pathname) ||
    url.pathname.startsWith("/src/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Everything else → Network First (with cache fallback)
  event.respondWith(networkFirst(request));
});

// Cache First: try cache → network → dynamic cache
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (err) {
    console.warn("[SW] Cache First failed:", err);
    return new Response("Offline — resource not available", { status: 503 });
  }
}

// Network First: try network → cache
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (err) {
    console.warn("[SW] Network failed, trying cache:", err);
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fallback for navigation requests
    if (request.mode === "navigate") {
      const fallback = await caches.match("/index.html");
      if (fallback) return fallback;
    }

    return new Response("Offline", { status: 503 });
  }
}

// ---- BACKGROUND SYNC (optional) ----
self.addEventListener("sync", (event) => {
  console.log("[SW] Background Sync:", event.tag);
  if (event.tag === "sync-todos") {
    event.waitUntil(syncTodos());
  }
});

async function syncTodos() {
  console.log("[SW] Syncing todos in background...");
  // Here you would sync with a backend API
}

// ---- PUSH NOTIFICATIONS (optional) ----
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Todo PWA";
  const options = {
    body: data.body || "У вас є нові завдання!",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-96x96.png",
    vibrate: [100, 50, 100],
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || "/"));
});
