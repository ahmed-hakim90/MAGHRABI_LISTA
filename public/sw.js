var SW_CACHE_VERSION = 'v2-local';
var CACHE_STATIC = 'maghrabi-static-' + SW_CACHE_VERSION;
var CACHE_PAGES = 'maghrabi-pages-' + SW_CACHE_VERSION;

function isDevHost() {
  var h = self.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
}

function networkFirstCache(request, cacheName) {
  return caches.open(cacheName).then(function (cache) {
    return fetch(request)
      .then(function (response) {
        if (response && response.status === 200) {
          try {
            cache.put(request, response.clone());
          } catch {}
        }
        return response;
      })
      .catch(function () {
        return cache.match(request).then(function (hit) {
          return hit || new Response('', { status: 504, statusText: 'Offline' });
        });
      });
  });
}

function navigateUrlVariants(requestUrl) {
  try {
    var u = new URL(requestUrl);
    var o = u.origin;
    var p = u.pathname;
    var qs = u.search || '';
    var variants = [];
    function add(s) {
      if (variants.indexOf(s) === -1) variants.push(s);
    }
    add(o + p + qs);
    if (p !== '/' && !p.endsWith('/')) add(o + p + '/' + qs);
    if (p.length > 1 && p.endsWith('/')) {
      add(o + p.replace(/\/+$/, '') + qs);
    }
    add(o + '/' + qs);
    return variants;
  } catch {
    return [requestUrl];
  }
}

function cacheMatchAny(urls) {
  var i = 0;
  function step() {
    if (i >= urls.length) return Promise.resolve(undefined);
    var u = urls[i++];
    return caches.match(u).then(function (h) {
      return h || step();
    });
  }
  return step();
}

function navigateWithOfflineFallback(request) {
  return fetch(request)
    .then(function (response) {
      if (response && response.ok) {
        caches.open(CACHE_PAGES).then(function (cache) {
          try {
            cache.put(request, response.clone());
          } catch {}
        });
      }
      return response;
    })
    .catch(function () {
      var urls = navigateUrlVariants(request.url);
      return cacheMatchAny(urls).then(function (hit) {
        if (hit) return hit;
        return caches.match(self.location.origin + '/').then(function (h2) {
          if (h2) return h2;
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      });
    });
}

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_PAGES).then(function (cache) {
      var root = new URL('/', self.location.origin).href;
      return cache.add(root).catch(function () {});
    }),
  );
});

self.addEventListener('message', function (event) {
  var d = event.data;
  if (d && d.type === 'SKIP_WAITING' && self.skipWaiting) {
    self.skipWaiting();
  }
});

self.addEventListener('activate', function (event) {
  var keep = [CACHE_STATIC, CACHE_PAGES];
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key.indexOf('maghrabi-') === 0 && keep.indexOf(key) === -1) {
            return caches.delete(key);
          }
        }),
      );
    }).then(function () {
      return self.clients.claim();
    }),
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (isDevHost()) {
    event.respondWith(fetch(req));
    return;
  }
  if (req.method !== 'GET') {
    event.respondWith(fetch(req));
    return;
  }
  var url;
  try {
    url = new URL(req.url);
  } catch {
    event.respondWith(fetch(req));
    return;
  }
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(req));
    return;
  }
  var path = url.pathname;
  if (
    path.indexOf('/_next/static/') === 0 ||
    path.indexOf('/icons/') === 0 ||
    path === '/manifest.webmanifest'
  ) {
    event.respondWith(networkFirstCache(req, CACHE_STATIC));
    return;
  }
  if (/^\/file\/[^/]+\/pdf\/?$/.test(path)) {
    event.respondWith(networkFirstCache(req, CACHE_PAGES));
    return;
  }
  if (req.mode === 'navigate') {
    event.respondWith(navigateWithOfflineFallback(req));
    return;
  }
  event.respondWith(fetch(req));
});

importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js');

firebase.initializeApp({"apiKey":"AIzaSyDiZGI4-axzB8Bgkcnmtai-1LymKgUyugA","authDomain":"sokany-production.firebaseapp.com","projectId":"sokany-production","storageBucket":"sokany-production.firebasestorage.app","messagingSenderId":"641654336000","appId":"1:641654336000:web:699aa28d234d0a3629c6e5"});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  var title =
    payload.notification && payload.notification.title
      ? payload.notification.title
      : 'Update';
  var body =
    payload.notification && payload.notification.body
      ? payload.notification.body
      : '';
  var data = payload.data || {};
  self.registration.showNotification(title, {
    body: body,
    data: Object.assign({}, data),
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  });
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var data = event.notification.data || {};
  var rel = data.url;
  if (!rel) {
    event.waitUntil(
      clients.openWindow(self.location.origin + '/'),
    );
    return;
  }
  var absolute = new URL(rel, self.location.origin).href;
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clientList) {
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if (
            client.url.indexOf(self.location.origin) === 0 &&
            'focus' in client
          ) {
            return client.focus().then(function (c) {
              if (c && 'navigate' in c && typeof c.navigate === 'function') {
                return c.navigate(absolute).catch(function () {
                  c.postMessage({ type: 'NAVIGATE', path: rel });
                });
              }
              c.postMessage({ type: 'NAVIGATE', path: rel });
              return c;
            });
          }
        }
        return clients.openWindow(absolute);
      }),
  );
});