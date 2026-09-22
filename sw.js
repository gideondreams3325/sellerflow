/* SellerFlow Progressive Web App & Notification Service Worker */
const CACHE_NAME = 'sellerflow-cache-v1.4';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('SellerFlow SW precache warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME && key !== MEDIA_CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

const MEDIA_CACHE_NAME = 'sellerflow-media-v1';

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests
  if (req.method !== 'GET') return;

  // Strictly exclude sensitive verification/KYC files from caching
  const isPrivateKyc = (
    url.pathname.includes('/verification') ||
    url.pathname.includes('/kyc') ||
    url.pathname.includes('buyerKycRecords') ||
    url.pathname.includes('identityVerifications') ||
    url.pathname.includes('ghanaCard')
  );
  if (isPrivateKyc) return;

  // Skip Firebase, Firestore, Auth, and app APIs
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  // Handle public CDN / storage images and local media uploads (Cloudinary, Unsplash, Supabase, local /uploads/)
  const isPublicImageOrMedia = (
    url.pathname.startsWith('/uploads/') ||
    url.hostname.includes('cloudinary.com') ||
    url.hostname.includes('images.unsplash.com') ||
    (url.hostname.includes('supabase') && url.pathname.includes('/storage/v1/object/public/'))
  ) && (
    req.destination === 'image' ||
    req.destination === 'video' ||
    req.destination === 'audio' ||
    /\.(jpe?g|png|webp|gif|svg|mp4|webm|mov|m4v|mp3|ogg|wav)(\?.*)?$/i.test(url.pathname)
  );

  if (isPublicImageOrMedia) {
    event.respondWith(
      caches.open(MEDIA_CACHE_NAME).then((cache) => {
        return cache.match(req).then((cached) => {
          if (cached) {
            // Return cached media immediately, background revalidate if needed
            fetch(req).then((networkRes) => {
              if (networkRes && networkRes.status === 200) {
                cache.put(req, networkRes.clone()).catch(() => {});
              }
            }).catch(() => {});
            return cached;
          }
          return fetch(req).then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              cache.put(req, networkRes.clone()).catch(() => {});
            }
            return networkRes;
          }).catch(() => cached);
        });
      })
    );
    return;
  }

  // If request is to Supabase (and not an image above), let native browser handle it
  if (url.hostname.includes('supabase')) {
    return;
  }

  // Navigation requests: Network-first, fallback to cached /index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html') || caches.match('/'))
    );
    return;
  }

  // Static assets: Stale-while-revalidate for local assets
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const copy = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkRes;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});

/* Handle messages from window client (e.g. show notification in background) */
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options = {} } = event.data;
    const notificationOptions = {
      icon: options.icon || '/pwa-192x192.png',
      badge: options.badge || '/icon.svg',
      vibrate: options.vibrate || [150, 75, 150],
      tag: options.tag || 'sellerflow-general',
      renotify: options.renotify !== undefined ? options.renotify : true,
      requireInteraction: options.requireInteraction || false,
      data: options.data || {},
      ...options
    };

    event.waitUntil(
      self.registration.showNotification(title || 'SellerFlow', notificationOptions)
    );
  }
});

/* Handle Web Push events if delivered by browser push service */
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (_) {
      data = { title: 'SellerFlow', body: event.data.text() };
    }
  }

  const title = data.title || 'SellerFlow Notification';
  const options = {
    body: data.body || data.message || 'You have a new alert on SellerFlow.',
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/icon.svg',
    vibrate: [150, 75, 150],
    tag: data.tag || (data.type ? `sf-${data.type}` : 'sf-push'),
    data: data.data || data
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/* Handle user clicking on a background notification */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = '/';

  if (data.type === 'chat_message' || data.conversationId) {
    targetUrl = '/#chats' + (data.conversationId ? `?cid=${encodeURIComponent(data.conversationId)}` : '') + (data.senderId ? `&uid=${encodeURIComponent(data.senderId)}` : '');
  } else if (data.type === 'order_update' || data.type === 'order_new' || data.orderId) {
    targetUrl = '/#orders' + (data.orderId ? `?orderId=${encodeURIComponent(data.orderId)}` : '');
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it and tell it to navigate
      for (const client of windowClients) {
        if ('focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_NAVIGATE',
            data: data,
            action: event.action
          });
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
