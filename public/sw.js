const CACHE_NAME = "barcelona-cove-shell-v1";
const SHELL_ASSETS = ["/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => cached);
    })
  );
});

// ── Push Notification ──────────────────────────────────────────────
// Catatan iOS: event.data KOSONG (iOS tidak mengirim payload), jadi
// service worker mengambil pesan terbaru dari server (/api/push/latest,
// same-origin + session cookie) sebelum menampilkan notifikasi.
self.addEventListener("push", (event) => {
  let payload = null;
  try {
    payload = event.data ? event.data.json() : null;
  } catch {
    payload = null;
  }

  const show = (title, body, url) =>
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url },
    });

  if (payload && payload.title) {
    event.waitUntil(show(payload.title, payload.body || "", payload.url || "/"));
    return;
  }

  // iOS (atau payload kosong) → ambil dari server
  event.waitUntil(
    fetch("/api/push/latest", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) =>
        data
          ? show(data.title, data.body, data.url)
          : show("Barcelona Cove Portal", "Ada notifikasi baru untuk Anda.", "/")
      )
      .catch(() => show("Barcelona Cove Portal", "Ada notifikasi baru untuk Anda.", "/"))
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            if ("navigate" in client && client.url !== url) client.navigate(url);
            return;
          }
        }
        return self.clients.openWindow(url);
      })
  );
});
