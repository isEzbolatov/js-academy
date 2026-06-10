const CACHE_NAME = 'js-academy-v1.0.0';
const STATIC_ASSETS = [
    './',
    './index.html',
    './styles/main.css',
    './styles/variables.css',
    './styles/reset.css',
    './styles/grid.css',
    './js/app.js',
    './data/lessons.json',
    './manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) => Promise.all(
            names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
        ))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
});
