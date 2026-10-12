/* Ctrl+Alt+รอด service worker — เก็บเกมไว้ในเครื่องให้เล่นออฟไลน์ได้ */
const VERSION = '20261012090000';
const CACHE = 'caltrod-' + VERSION;
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './favicon-32.png',
  './fonts/anuphan-thai.woff2', './fonts/anuphan-latin.woff2', './fonts/chakrapetch-500-thai.woff2', './fonts/chakrapetch-500-latin.woff2', './fonts/chakrapetch-600-thai.woff2', './fonts/chakrapetch-600-latin.woff2', './fonts/chakrapetch-700-thai.woff2', './fonts/chakrapetch-700-latin.woff2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.origin !== location.origin) return;
  // หน้าเกม: ลองเน็ตก่อน (ได้เวอร์ชันใหม่) ถ้าออฟไลน์ใช้ของในเครื่อง
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
