// Service Worker for handling chunk loading errors and caching
const CACHE_NAME = 'lead-management-v1'
const STATIC_CACHE_NAME = 'lead-management-static-v1'

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/manifest.json',
  // Add other critical static files here
]

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static files')
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        console.log('Service Worker installed successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker installation failed:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker activated successfully')
        return self.clients.claim()
      })
  )
})

// Fetch event - handle requests with cache-first strategy for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Handle Next.js chunks and static assets
  if (url.pathname.includes('/_next/static/') || 
      url.pathname.includes('/_next/chunks/') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css')) {
    
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Return cached version
            return cachedResponse
          }
          
          // Fetch from network and cache
          return fetch(request)
            .then((response) => {
              // Check if response is valid
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response
              }
              
              // Clone the response
              const responseToCache = response.clone()
              
              // Cache the response
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache)
                })
              
              return response
            })
            .catch((error) => {
              console.error('Fetch failed for:', request.url, error)
              
              // If it's a chunk loading error, try to reload the page
              if (request.url.includes('/_next/static/chunks/')) {
                console.log('Chunk loading failed, will reload page')
                // Send message to client to reload
                self.clients.matchAll().then((clients) => {
                  clients.forEach((client) => {
                    client.postMessage({
                      type: 'CHUNK_LOAD_ERROR',
                      url: request.url
                    })
                  })
                })
              }
              
              throw error
            })
        })
    )
  }
  
  // For other requests, use network-first strategy
  else {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // If network fails, try cache
          return caches.match(request)
        })
    )
  }
})

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName)
        })
      )
    }).then(() => {
      event.ports[0].postMessage({ success: true })
    })
  }
})

// Handle errors
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error)
})

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason)
})
