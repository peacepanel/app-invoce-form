const CACHE_NAME = 'invoice-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js',
  'https://cdnjs.cloudflare.com/ajax/libs/gapi/0.0.3/gapi.min.js'
];

// تثبيت Service Worker
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('تم فتح الكاش');
        return cache.addAll(urlsToCache);
      })
  );
});

// تفعيل Service Worker
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('حذف كاش قديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// التعامل مع الطلبات
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // إرجاع الكاش إذا وُجد
        if (response) {
          return response;
        }

        // إذا لم يوجد في الكاش، جلب من الشبكة
        return fetch(event.request).then(function(response) {
          // تحقق من صحة الاستجابة
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // نسخ الاستجابة لحفظها في الكاش
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(function() {
          // في حالة فشل الشبكة، أرجع صفحة offline
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// التعامل مع رسائل التطبيق
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// إشعارات التطبيق (اختياري)
self.addEventListener('push', function(event) {
  const options = {
    body: event.data ? event.data.text() : 'رسالة جديدة من تطبيق الفواتير',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iNDAiIGZpbGw9IiM2NjdlZWEiLz4KPHN2ZyB4PSI0OCIgeT0iNDgiIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CjxwYXRoIGQ9Ik05IDExSDVhMiAyIDAgMCAwLTIgMnY4YTIgMiAwIDAgMCAyIDJoMTRhMiAyIDAgMCAwIDItMlY5YTIgMiAwIDAgMC0yLTJoLTVtLTQgMFY3YTIgMiAwIDAgMC0yLTJINWEyIDIgMCAwIDAtMiAydjIiLz4KPGxpbmUgeDE9IjkiIHkxPSIxNSIgeDI9IjE1IiB5Mj0iMTUiLz4KPGxpbmUgeDE9IjkiIHkxPSIxOSIgeDI9IjE1IiB5Mj0iMTkiLz4KPC9zdmc+Cjwvc3ZnPgo=',
    badge: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCA3MiA3MiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjcyIiBoZWlnaHQ9IjcyIiByeD0iMTYiIGZpbGw9IiM2NjdlZWEiLz4KPHN2ZyB4PSIxNiIgeT0iMTYiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CjxwYXRoIGQ9Ik05IDExSDVhMiAyIDAgMCAwLTIgMnY4YTIgMiAwIDAgMCAyIDJoMTRhMiAyIDAgMCAwIDItMlY5YTIgMiAwIDAgMC0yLTJoLTVtLTQgMFY3YTIgMiAwIDAgMC0yLTJINWEyIDIgMCAwIDAtMiAydjIiLz4KPGxpbmUgeDE9IjkiIHkxPSIxNSIgeDI9IjE1IiB5Mj0iMTUiLz4KPGxpbmUgeDE9IjkiIHkxPSIxOSIgeDI9IjE1IiB5Mj0iMTkiLz4KPC9zdmc+Cjwvc3ZnPgo=',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'فتح التطبيق',
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iNDAiIGZpbGw9IiM2NjdlZWEiLz4KPHN2ZyB4PSI0OCIgeT0iNDgiIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CjxwYXRoIGQ9Ik05IDExSDVhMiAyIDAgMCAwLTIgMnY4YTIgMiAwIDAgMCAyIDJoMTRhMiAyIDAgMCAwIDItMlY5YTIgMiAwIDAgMC0yLTJoLTVtLTQgMFY3YTIgMiAwIDAgMC0yLTJINWEyIDIgMCAwIDAtMiAydjIiLz4KPGxpbmUgeDE9IjkiIHkxPSIxNSIgeDI9IjE1IiB5Mj0iMTUiLz4KPGxpbmUgeDE9IjkiIHkxPSIxOSIgeDI9IjE1IiB5Mj0iMTkiLz4KPC9zdmc+Cjwvc3ZnPgo='
      },
      {
        action: 'close',
        title: 'إغلاق',
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iNDAiIGZpbGw9IiM2NjdlZWEiLz4KPHN2ZyB4PSI0OCIgeT0iNDgiIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CjxwYXRoIGQ9Ik05IDExSDVhMiAyIDAgMCAwLTIgMnY4YTIgMiAwIDAgMCAyIDJoMTRhMiAyIDAgMCAwIDItMlY5YTIgMiAwIDAgMC0yLTJoLTVtLTQgMFY3YTIgMiAwIDAgMC0yLTJINWEyIDIgMCAwIDAtMiAydjIiLz4KPGxpbmUgeDE9IjkiIHkxPSIxNSIgeDI9IjE1IiB5Mj0iMTUiLz4KPGxpbmUgeDE9IjkiIHkxPSIxOSIgeDI9IjE1IiB5Mj0iMTkiLz4KPC9zdmc+Cjwvc3ZnPgo='
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('تطبيق الفواتير', options)
  );
});

// التعامل مع النقر على الإشعارات
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});