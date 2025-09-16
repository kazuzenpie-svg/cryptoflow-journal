// Service Worker for CryptoFlow Journal - Aggressive Caching Strategy

const CACHE_NAME = 'cryptoflow-v1';
const STATIC_CACHE = 'cryptoflow-static-v1';
const API_CACHE = 'cryptoflow-api-v1';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
  // Add other critical static assets
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/auth/getSession',
  '/users',
  '/trades',
  '/bindings'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(API_CACHE)
    ]).then(() => {
      console.log('✅ Service Worker installed');
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (url.pathname.includes('/rest/v1/') || API_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint))) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
          // Return cached response immediately and update in background
          fetch(request).then((response) => {
            if (response.status === 200) {
              cache.put(request, response.clone());
            }
          }).catch(() => {
            // Ignore fetch errors when updating cache
          });
          
          return cachedResponse;
        }

        // No cache hit, fetch and cache
        try {
          const response = await fetch(request);
          if (response.status === 200) {
            cache.put(request, response.clone());
          }
          return response;
        } catch (error) {
          console.error('Network request failed:', error);
          // Return a basic response for failed API calls
          return new Response(JSON.stringify({ error: 'Network unavailable' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      })
    );
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Only cache successful responses for static assets
        if (response.status === 200 && (
          request.url.includes('.js') ||
          request.url.includes('.css') ||
          request.url.includes('.png') ||
          request.url.includes('.jpg') ||
          request.url.includes('.svg') ||
          request.url.includes('.ico')
        )) {
          const responseToCache = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }

        return response;
      }).catch(() => {
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        throw error;
      });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle offline actions when connection is restored
      console.log('🔄 Background sync triggered')
    );
  }
});

// Handle push notifications (for future features)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png'
      })
    );
  }
});