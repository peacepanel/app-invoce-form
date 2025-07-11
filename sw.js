const CACHE_NAME = 'invoice-app-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://accounts.google.com/gsi/client'
];

// تثبيت Service Worker
self.addEventListener('install', function(event) {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('تم فتح الكاش');
        return cache.addAll(urlsToCache.filter(url => {
          // تجنب كاش URLs الخارجية التي قد تفشل
          return !url.includes('google.com') || url === urlsToCache[0];
        }));
      })
      .catch(function(error) {
        console.error('فشل في تخزين الملفات في الكاش:', error);
      })
  );
  // إجبار Service Worker الجديد على التفعيل فوراً
  self.skipWaiting();
});

// تفعيل Service Worker
self.addEventListener('activate', function(event) {
  console.log('Service Worker activating...');
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
    }).then(function() {
      // السيطرة على جميع الصفحات فوراً
      return self.clients.claim();
    })
  );
});

// التعامل مع الطلبات
self.addEventListener('fetch', function(event) {
  // تجاهل الطلبات للمواقع الخارجية
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('accounts.google.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // إرجاع الكاش إذا وُجد
        if (response) {
          console.log('تم العثور على الملف في الكاش:', event.request.url);
          return response;
        }

        // إذا لم يوجد في الكاش، جلب من الشبكة
        console.log('جلب من الشبكة:', event.request.url);
        return fetch(event.request).then(function(response) {
          // تحقق من صحة الاستجابة
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // نسخ الاستجابة لحفظها في الكاش
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(function(cache) {
              // تخزين الملفات المحلية فقط
              if (event.request.url.startsWith(self.location.origin)) {
                cache.put(event.request, responseToCache);
              }
            });

          return response;
        }).catch(function(error) {
          console.error('فشل في جلب الملف:', event.request.url, error);
          
          // في حالة فشل الشبكة وكان طلب للصفحة الرئيسية
          if (event.request.destination === 'document') {
            return caches.match('./index.html').then(function(fallbackResponse) {
              return fallbackResponse || new Response(
                '<!DOCTYPE html><html><head><title>تطبيق الفواتير - غير متصل</title></head><body style="font-family: Arial; text-align: center; padding: 50px;"><h1>التطبيق غير متصل</h1><p>الرجاء التحقق من الاتصال بالإنترنت</p></body></html>',
                { headers: { 'Content-Type': 'text/html' } }
              );
            });
          }
          
          // للموارد الأخرى، إرجاع خطأ
          return new Response('المورد غير متاح', { 
            status: 503, 
            statusText: 'Service Unavailable' 
          });
        });
      })
  );
});

// التعامل مع رسائل التطبيق
self.addEventListener('message', function(event) {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// إشعارات التطبيق (اختياري)
self.addEventListener('push', function(event) {
  console.log('Push notification received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'رسالة جديدة من تطبيق الفواتير',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iNDAiIGZpbGw9IiM2NjdlZWEiLz4KPHN2ZyB4PSI0OCIgeT0iNDgiIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CjxwYXRoIGQ9Ik05IDExSDVhMiAyIDAgMCAwLTIgMnY4YTIgMiAwIDAgMCAyIDJoMTRhMiAyIDAgMCAwIDItMlY5YTIgMiAwIDAgMC0yLTJoLTVtLTQgMFY3YTIgMiAwIDAgMC0yLTJINWEyIDIgMCAwIDAtMiAydjIiLz4KPGxpbmUgeDE9IjkiIHkxPSIxNSIgeDI9IjE1IiB5Mj0iMTUiLz4KPGxpbmUgeTE9IjkiIHkxPSIxOSIgeDI9IjE1IiB5Mj0iMTkiLz4KPC9zdmc+Cjwvc3ZnPgo=',
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
        title: 'إغلاق'
      }
    ],
    tag: 'invoice-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('تطبيق الفواتير', options)
  );
});

// التعامل مع النقر على الإشعارات
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('./')
    );
  } else if (event.action === 'close') {
    // لا حاجة لفعل شيء، الإشعار سيُغلق
  } else {
    // النقر على الإشعار نفسه
    event.waitUntil(
      clients.matchAll().then(function(clientList) {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('./');
      })
    );
  }
});

// مزامنة البيانات في الخلفية (اختياري)
self.addEventListener('sync', function(event) {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'sync-invoices') {
    event.waitUntil(
      // يمكن إضافة منطق لمزامنة البيانات المحفوظة محلياً
      console.log('مزامنة الفواتير...')
    );
  }
});

// معلومات إضافية لتتبع حالة Service Worker
console.log('Service Worker script loaded - Version:', CACHE_NAME);
