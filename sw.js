// Service Worker

importScripts('/js/cache-polyfill.js');

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open('blog-smarchal').then(function(cache) {

      var urls = [
        '/',
        '/css/main.css',
        '/js/app.js',
        '/js/jekyll-search.min.js',
        '/images/logo.png',
        '/fonts/sourcecodepro-light-webfont.woff',
        '/fonts/SourceSansPro-ExtraLight.woff',
        '/search.json',
        '/manifest.json',
      ];

      const request = async () => {
        var response = await fetch('/search.json')
        var posts = await response.json();
        for (var post in posts) {
          urls.push(post.url);
        }
      }
      request();

      return cache.addAll(urls);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});