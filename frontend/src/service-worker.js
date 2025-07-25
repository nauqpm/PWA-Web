/* eslint-disable no-restricted-globals */

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';

clientsClaim();

// Precache all of the assets generated by your build process.
precacheAndRoute(self.__WB_MANIFEST);

// Helper function to check if URL is API endpoint
function isApiEndpoint(url) {
  return url.pathname.startsWith('/api/');
}

// Helper function to check if URL is dynamic content (comments/likes)
function isDynamicContent(url) {
  return url.pathname.includes('/api/comments') || 
         url.pathname.includes('/api/likes');
}

// Cache API responses (except dynamic content)
registerRoute(
  ({ url }) => isApiEndpoint(url) && !isDynamicContent(url),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60, // Cache for 24 hours
      }),
    ],
  })
);

// Dynamic content (comments and likes) - Use NetworkFirst to always try network first
registerRoute(
  ({ url }) => isDynamicContent(url),
  new NetworkFirst({
    cacheName: 'dynamic-content-cache',
    networkTimeoutSeconds: 3, // Fallback to cache after 3 seconds
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60, // Very short cache - only for offline fallback
      }),
    ],
  })
);

// Cache images
registerRoute(
  ({ url }) => url.pathname.match(/\.(?:png|jpg|jpeg|svg|gif)$/),
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Set up App Shell-style routing
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
registerRoute(
  ({ request, url }) => {
    if (request.mode !== 'navigate') {
      return false;
    }
    if (url.pathname.startsWith('/_')) {
      return false;
    }
    if (url.pathname.match(fileExtensionRegexp)) {
      return false;
    }
    return true;
  },
  createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html')
);

// Cache name for manual caching
const CACHE_NAME = 'news-app-cache-v2'; // Increment version to force update

// Files to cache
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/static/js/bundle.js',
  '/manifest.json',  
  '/logo192.png',
  '/logo512.png'
];

// Install event - cache files
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== 'api-cache' && 
              cacheName !== 'dynamic-content-cache' &&
              cacheName !== 'images') {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Custom fetch handler for fine-grained control
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return;
  }

  // Skip if already handled by Workbox routes
  if (isApiEndpoint(url) || url.pathname.match(/\.(?:png|jpg|jpeg|svg|gif)$/)) {
    return;
  }

  // Handle other requests with network-first strategy
  event.respondWith(
    fetch(request)
      .then(response => {
        // If network succeeds, cache and return response
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(request)
          .then(response => {
            return response || caches.match('/index.html');
          });
      })
  );
});

// Handle POST/PUT/DELETE requests - clear dynamic cache on success
self.addEventListener('fetch', event => {
  if (['POST', 'PUT', 'DELETE'].includes(event.request.method)) {
    const url = new URL(event.request.url);
    
    // Only handle dynamic content modifications
    if (isDynamicContent(url)) {
      event.waitUntil(
        fetch(event.request.clone())
          .then(response => {
            if (response.ok) {
              console.log('Clearing dynamic content cache after successful modification');
              // Clear both dynamic content cache and any related API cache
              return Promise.all([
                caches.delete('dynamic-content-cache'),
                // Also clear specific cache entries that might contain stale data
                caches.open('api-cache').then(cache => {
                  // Clear any cached API responses that might contain comment/like counts
                  return cache.keys().then(requests => {
                    const deletePromises = requests
                      .filter(req => {
                        const reqUrl = new URL(req.url);
                        return reqUrl.pathname.includes('/api/') && 
                               (reqUrl.pathname.includes('articles') || 
                                reqUrl.pathname.includes('posts'));
                      })
                      .map(req => cache.delete(req));
                    return Promise.all(deletePromises);
                  });
                })
              ]);
            }
          })
          .catch(error => {
            console.error('Error in POST/PUT/DELETE handler:', error);
          })
      );
    }
  }
});

// Push notification event
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      data: {
        url: data.url
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  event.waitUntil(
    self.clients.openWindow(event.notification.data.url)
  );
});

// Background Sync for offline actions
self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-actions') {
    event.waitUntil(syncOfflineActions());
  }
});

async function syncOfflineActions() {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offlineActions'], 'readwrite'); // Use 'readwrite' for deleting items
      const store = transaction.objectStore('offlineActions');
      
      const actions = [];
      store.openCursor().onsuccess = async (event) => {
        const cursor = event.target.result;
        if (cursor) {
          actions.push(cursor.value);
          cursor.continue();
        } else {
          // No more entries
          for (const action of actions) {
            try {
              const response = await fetch(action.url, {
                method: action.method,
                headers: action.headers,
                body: action.body ? JSON.stringify(action.body) : undefined
              });

              if (response.ok) {
                // Delete after successful sync
                const deleteRequest = store.delete(action.id);
                deleteRequest.onsuccess = () => console.log('Action deleted from IndexedDB:', action.id);
                deleteRequest.onerror = (err) => console.error('Error deleting action from IndexedDB:', err);

                // Clear relevant caches after successful sync
                if (action.url.includes('/api/comments') || action.url.includes('/api/likes')) {
                  await caches.delete('dynamic-content-cache');
                }
              } else {
                console.error('Failed to sync action:', action, 'Status:', response.status);
                // Optionally, handle specific non-OK responses (e.g., 404, 400)
              }
            } catch (error) {
              console.error('Error syncing action:', error);
              // Optionally, implement retry logic or move to a failed queue
            }
          }
          resolve(); // Resolve the promise after processing all actions
        }
      };

      store.openCursor().onerror = (event) => {
        console.error('Error opening cursor:', event.target.error);
        reject(event.target.error);
      };
      
      transaction.oncomplete = () => {
        console.log('Sync transaction complete.');
      };

      transaction.onerror = (event) => {
        console.error('Sync transaction failed:', event.target.error);
        reject(event.target.error);
      };
      
      transaction.onabort = (event) => {
        console.error('Sync transaction aborted:', event.target.error);
        reject(event.target.error);
      };

    });

  } catch (error) {
    console.error('Error accessing IndexedDB for sync:', error);
  }
}

// Helper function to open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('newsAppDB', 2);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains('offlineActions')) {
        db.createObjectStore('offlineActions', { keyPath: 'id', autoIncrement: true });
        console.log('offlineActions object store created/upgraded.');
      }
      // Add other stores if needed for future versions
      // if (!db.objectStoreNames.contains('otherStore')) {
      //   db.createObjectStore('otherStore', { keyPath: 'id' });
      // }
    };
  });
}

// Message handler for manual cache refresh
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      Promise.all([
        caches.delete('dynamic-content-cache'),
        caches.delete('api-cache')
      ]).then(() => {
        // Notify client that cache is cleared
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});