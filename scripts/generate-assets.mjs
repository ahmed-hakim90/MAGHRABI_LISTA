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
/* PWA: Chromium requires a fetch handler for installability */
self.addEventListener('fetch', function (event) {
  event.respondWith(fetch(event.request));
});

importScripts('https://www.gstatic.com/firebasejs/${FB_VERSION}/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/${FB_VERSION}/firebase-messaging-compat.js');

firebase.initializeApp(${JSON.stringify(config)});

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
