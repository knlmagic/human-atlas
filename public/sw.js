const CACHE_VERSION = 'v2';
const SHELL = `atlas-shell-${CACHE_VERSION}`;
const MODELS = `anatomy-models-${CACHE_VERSION}`;
const MANIFEST_PATH = '/models/atlas.json';

self.addEventListener('install', event => {
 event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
 event.waitUntil((async () => {
  const current = new Set([SHELL, MODELS]);
  const names = await caches.keys();
  await Promise.all(
   names
    .filter(name => /^(atlas-shell|anatomy-models)-/.test(name) && !current.has(name))
    .map(name => caches.delete(name)),
  );
  await self.clients.claim();
 })());
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
  if (url.pathname === MANIFEST_PATH) {
   try {
    const response = await fetch(event.request, {cache: 'no-store'});
    if (response.ok) await cache.put(event.request, response.clone());
    return response;
   } catch {
    const cached = await cache.match(event.request);
    if (cached) return cached;
    throw new Error('The anatomy manifest is unavailable.');
   }
  }
  const cached = await cache.match(event.request);
  if (cached) return cached;
  const response = await fetch(event.request);
  if (response.ok) await cache.put(event.request, response.clone());
  return response;
 })());
});
