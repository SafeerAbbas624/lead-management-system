'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration.scope)
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New service worker available, will update on next page load')
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CHUNK_LOAD_ERROR') {
          console.log('Chunk load error detected by service worker, reloading...')
          window.location.reload()
        }
      })

      // Handle chunk loading errors at the window level
      const handleChunkError = (event: ErrorEvent) => {
        if (event.error?.name === 'ChunkLoadError' || 
            event.message?.includes('Loading chunk') ||
            event.message?.includes('Loading CSS chunk')) {
          console.log('ChunkLoadError detected, attempting recovery...')
          
          // Clear any cached chunks and reload
          if ('caches' in window) {
            caches.keys().then((cacheNames) => {
              const chunkCaches = cacheNames.filter(name => 
                name.includes('chunk') || name.includes('static')
              )
              return Promise.all(
                chunkCaches.map(cacheName => caches.delete(cacheName))
              )
            }).then(() => {
              console.log('Cleared chunk caches, reloading...')
              window.location.reload()
            })
          } else {
            // Fallback: just reload
            window.location.reload()
          }
        }
      }

      // Handle unhandled promise rejections (often chunk errors)
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        if (event.reason?.message?.includes('Loading chunk') ||
            event.reason?.message?.includes('Loading CSS chunk')) {
          console.log('Chunk loading promise rejection detected, reloading...')
          event.preventDefault()
          window.location.reload()
        }
      }

      // Add event listeners
      window.addEventListener('error', handleChunkError)
      window.addEventListener('unhandledrejection', handleUnhandledRejection)

      // Cleanup function
      return () => {
        window.removeEventListener('error', handleChunkError)
        window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      }
    }
  }, [])

  return null // This component doesn't render anything
}

// Utility function to manually clear caches and reload
export function clearCacheAndReload() {
  if ('caches' in window) {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
    }).then(() => {
      console.log('All caches cleared, reloading...')
      window.location.reload()
    })
  } else {
    window.location.reload()
  }
}

// Utility function to check if service worker is supported
export function isServiceWorkerSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator
}
