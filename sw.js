const CACHE = 'mol-maneta-v' + new Date().toISOString().slice(0,10).replace(/-/g,'');
const FILES = [
  '/',
  '/index.html',
  '/admin.html',
  '/payment.html',
  '/404.html',
  '/retour.html',
  '/thankyou.html',
  '/styles.css',
  '/auth.js',
  '/galaxy-bg.js',
  '/seasonal.js',
  '/tracking.js',
  '/favicon.svg',
  '/logo.svg',
  '/assets/img/og-image.jpg',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.webmanifest'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      // addAll() is atomic — if any one file 404s the whole install fails.
      // Cache each file individually instead so one missing asset can't
      // take down offline support for the rest of the site.
      Promise.all(FILES.map(url => c.add(url).catch(err => {
        console.warn('[sw] skipped caching', url, err);
      })))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request).then(r => r || caches.match('/index.html')))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request))
    );
  }
});
