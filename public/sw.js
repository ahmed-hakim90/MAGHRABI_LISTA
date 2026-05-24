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
          } catch (e) {}
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

/** Never cache Next.js bundles, RSC payloads, or HTML navigations (stale chunks). */
function shouldBypassServiceWorkerCache(request, url) {
  var path = url.pathname;
  if (path.indexOf('/_next/static/') === 0) return true;
  if (path.indexOf('/_next/data/') === 0) return true;
  if (path.indexOf('/_next/') === 0) return true;
  if (/\.(js|mjs)(\?|$)/i.test(path)) return true;
  if (request.mode === 'navigate') return true;
  if (request.headers.get('RSC') === '1') return true;
  if (request.headers.get('Next-Router-Prefetch')) return true;
  if (request.headers.get('Next-Router-State-Tree')) return true;
  return false;
}

self.addEventListener('install', function (event) {
  event.waitUntil(
    Promise.resolve().then(function () {
      if (self.skipWaiting) self.skipWaiting();
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
  } catch (e) {
    event.respondWith(fetch(req));
    return;
  }
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(req));
    return;
  }
  if (shouldBypassServiceWorkerCache(req, url)) {
    event.respondWith(fetch(req));
    return;
  }
  var path = url.pathname;
  if (path.indexOf('/icons/') === 0) {
    event.respondWith(networkFirstCache(req, CACHE_STATIC));
    return;
  }
  if (/^\/(wholesale|retail|lists)\/file\/[^/]+\/pdf\/?$/.test(path)) {
    event.respondWith(networkFirstCache(req, CACHE_PAGES));
    return;
  }
  event.respondWith(fetch(req));
});

importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js');

firebase.initializeApp({"apiKey":"AIzaSyDiZGI4-axzB8Bgkcnmtai-1LymKgUyugA","authDomain":"sokany-production.firebaseapp.com","projectId":"sokany-production","storageBucket":"sokany-production.firebasestorage.app","messagingSenderId":"641654336000","appId":"1:641654336000:web:699aa28d234d0a3629c6e5"});

var messaging = firebase.messaging();

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
      clients.openWindow(self.location.origin + '/wholesale'),
    );
    return;
  }
  var absolute = new URL(rel, self.location.origin).href;
  if (data.type === 'file_card') {
    event.waitUntil(clients.openWindow(absolute));
    return;
  }
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