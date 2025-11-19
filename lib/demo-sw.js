// public/sw.js
self.addEventListener('install', event => {
    // skip waiting to activate faster (use carefully in prod)
    self.skipWaiting();
    event.waitUntil(
      caches.open('v1').then(cache => cache.addAll(['/','/index.html']))
    );
  });
  
  self.addEventListener('activate', event => {
    // take control of uncontrolled clients ASAP
    event.waitUntil(self.clients.claim());
  });
  
  self.addEventListener('fetch', event => {
    // navigation -> network first (for SPA)
    if (event.request.mode === 'navigate') {
      event.respondWith(
        fetch(event.request).catch(() =>
          caches.match('/index.html')
        )
      );
      return;
    }
    // static assets -> cache first
    event.respondWith(
      caches.match(event.request).then(resp => resp || fetch(event.request))
    );
  });
  