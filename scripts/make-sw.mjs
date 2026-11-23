import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative, sep } from 'node:path';

const root = 'dist';
const files = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name !== 'sw.js') files.push('/' + relative(root, full).split(sep).join('/'));
  }
}

await walk(root);
files.sort();
const digest = createHash('sha256').update(files.join('\n')).digest('hex').slice(0, 12);
const sw = `const CACHE_NAME = 'learn2code-docs-${digest}';
const PRECACHE = ${JSON.stringify(files, null, 2)};

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function rangeResponse(request, response) {
  const range = request.headers.get('range');
  if (!range) return response;
  return response.arrayBuffer().then(buffer => {
    const size = buffer.byteLength;
    const match = /bytes=(\\d+)-(\\d*)/.exec(range);
    if (!match) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : size - 1;
    if (start >= size || end >= size || start > end) {
      return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
    }
    const chunk = buffer.slice(start, end + 1);
    const headers = new Headers(response.headers);
    headers.set('Content-Range', 'bytes ' + start + '-' + end + '/' + size);
    headers.set('Content-Length', String(chunk.byteLength));
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Content-Type', response.headers.get('Content-Type') || 'application/pdf');
    return new Response(chunk, { status: 206, statusText: 'Partial Content', headers });
  });
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put('/index.html', copy));
        return response;
      }).catch(() => caches.match('/index.html').then(r => r || caches.match('/')))
    );
    return;
  }

  event.respondWith(
    caches.match(url.pathname).then(cached => {
      if (cached) return rangeResponse(request, cached.clone());
      return fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(url.pathname, copy));
        }
        return response;
      });
    })
  );
});
`;

await writeFile(join(root, 'sw.js'), sw);
console.log('Service worker generated with', files.length, 'pre-cached assets.');
