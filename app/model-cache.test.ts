import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';

const worker = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
const entry = readFileSync(new URL('../web/main.tsx', import.meta.url), 'utf8');
const vercel = JSON.parse(
 readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
) as {headers: {source: string; headers: {key: string; value: string}[]}[]};

describe('installed atlas upgrades', () => {
 it('uses a new cache generation and removes prior atlas caches', () => {
  expect(worker).toContain("const CACHE_VERSION = 'v2'");
  expect(worker).toContain("caches.delete(name)");
  expect(worker).toContain("/^(atlas-shell|anatomy-models)-/");
 });

 it('checks the network before a cached anatomy manifest', () => {
  const manifestStrategy = worker.slice(
   worker.indexOf('if (url.pathname === MANIFEST_PATH)'),
   worker.indexOf('const cached = await cache.match(event.request);', worker.indexOf('if (url.pathname === MANIFEST_PATH)') + 1),
  );
  expect(manifestStrategy).toContain("fetch(event.request, {cache: 'no-store'})");
  expect(manifestStrategy).toContain('await cache.put(event.request, response.clone())');
 });

 it('reloads an existing controlled client when the new worker takes control', () => {
  expect(entry).toContain("navigator.serviceWorker.addEventListener('controllerchange'");
  expect(entry).toContain('hadControllerAtLoad');
  expect(entry).toContain('window.location.reload()');
 });

 it('revalidates the manifest while retaining immutable binary caching', () => {
  const headers = new Map(
   vercel.headers.map(rule => [
    rule.source,
    rule.headers.find(header => header.key === 'Cache-Control')?.value,
   ]),
  );
  expect(headers.get('/models/atlas.json')).toBe('public, max-age=0, must-revalidate');
  expect(headers.get('/models/(.*).bin.gz')).toBe('public, max-age=31536000, immutable');
  expect(headers.has('/models/(.*)')).toBe(false);
 });
});
