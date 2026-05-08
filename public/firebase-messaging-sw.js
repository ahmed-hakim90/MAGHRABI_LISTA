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