// Service Worker

importScripts('/js/cache-polyfill.js')

const CACHE_NAME = 'blog-smarchal'
var CACHED_URLS = [
  '/',
  '/css/main.css',
  '/js/app.js',
  '/js/jekyll-search.min.js',
  '/images/logo.png',
  '/fonts/sourcecodepro-light-webfont.woff',
  '/fonts/SourceSansPro-ExtraLight.woff',
  '/search.json',
  '/manifest.json'
]

// Open cache on install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      const request = async () => {
        var response = await fetch('/search.json')
        var posts = await response.json()
        for (var post in posts) {
          CACHED_URLS.push(post.url)
        }
      }
      request()

      return cache.addAll(CACHED_URLS)
    })
  )
})

// Cache and update with stale-while-revalidate policy
self.addEventListener('fetch', event => {
  const { request } = event

  // Prevent Chrome Developer Tools error:
  // Failed to execute 'fetch' on 'ServiceWorkerGlobalScope': 'only-if-cached' can be set only with 'same-origin' mode
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
    return
  }

  event.respondWith(async function () {
    const cache = await caches.open(CACHE_NAME)

    const cachedResponsePromise = await cache.match(request)
    const networkResponsePromise = fetch(request)

    if (request.url.startsWith(self.location.origin)) {
      event.waitUntil(async function () {
        const networkResponse = await networkResponsePromise

        await cache.put(request, networkResponse.clone())
      }())
    }

    return cachedResponsePromise || networkResponsePromise
  }())
})

// Clean up caches other than current.
self.addEventListener('activate', event => {
  event.waitUntil(async function () {
    const cacheNames = await caches.keys()

    await Promise.all(
      cacheNames.filter(cacheName => {
        const deleteThisCache = cacheName !== CACHE_NAME

        return deleteThisCache
      }).map(cacheName => caches.delete(cacheName))
    )
  }())
})