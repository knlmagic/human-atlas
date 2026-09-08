const SHELL = 'atlas-shell-v1';
const MODELS = 'anatomy-models-v1';

self.addEventListener('install', event => {
 event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
 event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
 if (event.request.method !== 'GET') return;
 const url = new URL(event.request.url);
 if (url.origin !== self.location.origin) return;

 if (event.request.mode === 'navigate') {
  event.respondWith(fetch(event.request).catch(() => caches.match('/index.html')));
  return;
 }

 const isModel = url.pathname.startsWith('/models/');
 const isShell = url.pathname.startsWith('/assets/') || /\.(?:js|css|svg|png|webmanifest)$/.test(url.pathname);
 if (!isModel && !isShell) return;

 event.respondWith((async () => {
  const cache = await caches.open(isModel ? MODELS : SHELL);
  const cached = await cache.match(event.request);
  if (cached) return cached;
  const response = await fetch(event.request);
  if (response.ok) await cache.put(event.request, response.clone());
  return response;
 })());
});
