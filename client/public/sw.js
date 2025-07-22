// Service Worker for caching and performance
const CACHE_NAME = 'ddcars-v1';
const urlsToCache = [
  '/',
  '/src/main.tsx',
  '/src/index.css',
  '/assets/hero_image_DD_1753178216280.webp',
  '/assets/over_ons_hero_image.webp'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Force HTTPS only in production
self.addEventListener('fetch', function(event) {
  // Only redirect to HTTPS if we're not on localhost/Replit development
  if (event.request.url.startsWith('http:') && 
      !event.request.url.includes('localhost') && 
      !event.request.url.includes('replit.dev')) {
    event.respondWith(
      Response.redirect(event.request.url.replace('http:', 'https:'), 301)
    );
  }
});