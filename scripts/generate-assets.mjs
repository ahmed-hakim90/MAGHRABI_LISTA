import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

dotenv.config({ path: path.join(root, ".env.local") });
dotenv.config({ path: path.join(root, ".env") });

const FB_VERSION = "12.13.0";

/** Unique per deploy so browsers fetch a new sw.js and activate updates. */
function getSwCacheVersion() {
  const raw =
    process.env.VERCEL_DEPLOYMENT_ID?.trim() ||
    process.env.CF_PAGES_COMMIT_SHA?.trim() ||
    process.env.SW_CACHE_BUMP?.trim() ||
    "";
  if (raw)
    return raw.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 48);
  return "v2-local";
}

const SW_CACHE_VERSION = getSwCacheVersion();

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

const SOURCE_ICON = path.join(root, "assets", "app-icon-source.png");
const ICON_BG = "#000000";

/** PWA maskable safe zone ≈ 80% — keep logo inside ~82% so squircle masks do not clip. */
async function writeMaskablePng(sourcePath, outPath, canvasSize) {
  const inner = Math.floor(canvasSize * 0.82);
  const innerBuf = await sharp(sourcePath)
    .resize(inner, inner, { fit: "inside" })
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 3,
      background: ICON_BG,
    },
  })
    .composite([{ input: innerBuf, gravity: "center" }])
    .png()
    .toFile(outPath);
}

async function main() {
  const publicDir = path.join(root, "public");
  const iconsDir = path.join(publicDir, "icons");
  const appDir = path.join(root, "app");
  await fs.mkdir(iconsDir, { recursive: true });

  try {
    await fs.access(SOURCE_ICON);
  } catch {
    throw new Error(
      `[generate-assets] Missing ${path.relative(root, SOURCE_ICON)} — add the EL MAGHRABY logo PNG there.`,
    );
  }

  await sharp(SOURCE_ICON)
    .resize(192, 192, { fit: "cover", position: "center" })
    .png()
    .toFile(path.join(iconsDir, "icon-192.png"));

  await writeMaskablePng(SOURCE_ICON, path.join(iconsDir, "icon-512.png"), 512);

  await sharp(SOURCE_ICON)
    .resize(32, 32, { fit: "cover", position: "center" })
    .png()
    .toFile(path.join(appDir, "icon.png"));

  await sharp(SOURCE_ICON)
    .resize(180, 180, { fit: "cover", position: "center" })
    .png()
    .toFile(path.join(appDir, "apple-icon.png"));

  const sw = `
var SW_CACHE_VERSION = '${SW_CACHE_VERSION}';
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

function catalogHomeFallback(requestUrl) {
  try {
    var u = new URL(requestUrl);
    var o = u.origin;
    var p = u.pathname;
    if (p.indexOf('/retail') === 0) return o + '/retail';
    if (p.indexOf('/lists') === 0) return o + '/lists';
    if (p.indexOf('/wholesale') === 0) return o + '/wholesale';
    return o + '/wholesale';
  } catch (e) {
    return self.location.origin + '/wholesale';
  }
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
      add(o + p.replace(/\\/+$/, '') + qs);
    }
    add(o + '/' + qs);
    return variants;
  } catch (e) {
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
          } catch (e) {}
        });
      }
      return response;
    })
    .catch(function () {
      var urls = navigateUrlVariants(request.url);
      return cacheMatchAny(urls).then(function (hit) {
        if (hit) return hit;
        return caches
          .match(catalogHomeFallback(request.url))
          .then(function (h2) {
            if (h2) return h2;
            return new Response('Offline', { status: 503, statusText: 'Offline' });
          });
      });
    });
}

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_PAGES).then(function (cache) {
      var o = self.location.origin;
      return cache
        .addAll([o + '/wholesale', o + '/retail', o + '/lists'])
        .catch(function () {});
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
  var path = url.pathname;
  if (
    path.indexOf('/_next/static/') === 0 ||
    path.indexOf('/icons/') === 0 ||
    path === '/manifest.webmanifest' ||
    path === '/manifest-wholesale.webmanifest' ||
    path === '/manifest-retail.webmanifest' ||
    path === '/manifest-lists.webmanifest'
  ) {
    event.respondWith(networkFirstCache(req, CACHE_STATIC));
    return;
  }
  if (/^\\/(wholesale|retail|lists)\\/file\\/[^/]+\\/pdf\\/?$/.test(path)) {
    event.respondWith(networkFirstCache(req, CACHE_PAGES));
    return;
  }
  if (req.mode === 'navigate') {
    event.respondWith(navigateWithOfflineFallback(req));
    return;
  }
  event.respondWith(fetch(req));
});

importScripts('https://www.gstatic.com/firebasejs/${FB_VERSION}/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/${FB_VERSION}/firebase-messaging-compat.js');

firebase.initializeApp(${JSON.stringify(config)});

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
`.trim();

  await fs.writeFile(path.join(publicDir, "sw.js"), sw, "utf8");
  console.log(
    "[generate-assets] PWA icons, app/icon.png, apple-icon.png, sw.js",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
