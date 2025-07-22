// Service Worker for HTTPS enforcement
self.addEventListener('fetch', function(event) {
  // Force HTTPS for all requests
  if (event.request.url.startsWith('http://') && 
      !event.request.url.includes('localhost') && 
      !event.request.url.includes('127.0.0.1')) {
    
    const httpsUrl = event.request.url.replace('http://', 'https://');
    event.respondWith(
      fetch(httpsUrl, {
        method: event.request.method,
        headers: event.request.headers,
        body: event.request.body
      })
    );
  }
});