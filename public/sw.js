// Try Local Gresham - Service Worker
// Version: 2.0.0 - Fixed caching strategy for proper updates

const CACHE_VERSION = '2.0.0';
const CACHE_NAME = `try-local-v${CACHE_VERSION}`;
const RUNTIME_CACHE = `try-local-runtime-v${CACHE_VERSION}`;

// Only cache truly static assets that rarely change
const PRECACHE_URLS = [
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/offline.html',
  '/logo.jpeg',
];

// URLs that should NEVER be cached
const NEVER_CACHE = [
  '/sw.js',           // Service worker itself
  '/api/',            // API routes
  '/_next/',          // Next.js internals
  '/manifest.json',   // Manifest can change
];

// Install event - cache essential assets and immediately activate
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing version ${CACHE_VERSION}...`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Cache each URL individually to prevent one failure from breaking all
        return Promise.allSettled(
          PRECACHE_URLS.map(url =>
            cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url}:`, err);
              return null;
            })
          )
        );
      })
      .then(() => {
        console.log('[SW] Installation complete, skipping waiting...');
        // Skip waiting immediately - don't wait for user action
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('Service worker installation failed:', err);
      })
  );
});

// Activate event - clean up old caches and take control immediately
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating version ${CACHE_VERSION}...`);
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // Find all caches that don't match current version
        return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
      })
      .then((cachesToDelete) => {
        if (cachesToDelete.length > 0) {
          console.log('[SW] Deleting old caches:', cachesToDelete);
        }
        return Promise.all(
          cachesToDelete.map((cacheToDelete) => {
            return caches.delete(cacheToDelete);
          })
        );
      })
      .then(() => {
        console.log('[SW] Taking control of all clients...');
        // Immediately claim all clients - this triggers the update
        return self.clients.claim();
      })
      .then(() => {
        // Notify all clients that an update has occurred
        return self.clients.matchAll({ type: 'window' }).then(clients => {
          console.log(`[SW] Notifying ${clients.length} client(s) of update`);
          clients.forEach(client => {
            client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
          });
        });
      })
  );
});

// Check if URL should never be cached
function shouldNeverCache(url) {
  return NEVER_CACHE.some(pattern => url.includes(pattern));
}

// Check if URL is a precached asset
function isPrecachedAsset(url) {
  const path = new URL(url).pathname;
  return PRECACHE_URLS.includes(path);
}

// Fetch event - Network-first for pages, stale-while-revalidate for assets
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Skip cross-origin requests
  if (!url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Never cache these - let them go straight to network
  if (shouldNeverCache(url)) {
    return;
  }

  // Navigation requests (HTML pages) - Network first, cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the fresh response
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline - try cache, then offline page
          return caches.match(event.request)
            .then((cachedResponse) => {
              return cachedResponse || caches.match('/offline.html');
            });
        })
    );
    return;
  }

  // Precached static assets - Cache first (these rarely change)
  if (isPrecachedAsset(url)) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          return cachedResponse || fetch(event.request);
        })
    );
    return;
  }

  // Other assets - Stale-while-revalidate
  // Serve from cache immediately, but fetch update in background
  event.respondWith(
    caches.open(RUNTIME_CACHE).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            // Update cache with fresh response
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            // Network failed, but we might have cache
            return cachedResponse;
          });

        // Return cached response immediately, or wait for network
        return cachedResponse || fetchPromise;
      });
    })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;

      case 'CLEAR_CACHE':
        // Force clear all caches - useful for debugging or forcing updates
        event.waitUntil(
          caches.keys().then((cacheNames) => {
            return Promise.all(
              cacheNames.map((cacheName) => caches.delete(cacheName))
            );
          }).then(() => {
            console.log('[SW] All caches cleared');
            // Notify the client
            if (event.source) {
              event.source.postMessage({ type: 'CACHE_CLEARED' });
            }
          })
        );
        break;

      case 'GET_VERSION':
        // Return current service worker version
        if (event.source) {
          event.source.postMessage({ type: 'VERSION', version: CACHE_VERSION });
        }
        break;
    }
  }
});

// Push notification event handler
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
    },
    actions: data.actions || [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Dismiss' },
    ],
    tag: data.tag || 'try-local-notification',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Try Local Gresham', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // If no existing window, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Notification close handler (for analytics)
self.addEventListener('notificationclose', (event) => {
  // Can be used to track notification dismissals
  console.log('Notification closed:', event.notification.tag);
});
