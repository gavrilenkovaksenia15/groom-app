// Service worker: сохраняет файлы приложения, чтобы оно открывалось как обычное приложение
const CACHE = "groom-v1";
const FILES = [
  "./", "./index.html", "./css/style.css", "./manifest.json",
  "./js/config.js", "./js/data.js", "./js/storage.js", "./js/schedule.js", "./js/app.js",
  "./icons/icon-192.png", "./icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

// Сначала берём свежий файл из сети, если сети нет — из сохранённых
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
