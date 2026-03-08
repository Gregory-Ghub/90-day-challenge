const CACHE_NAME = '90day-v14';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './css/milestones.css',
  './js/app.js',
  './js/db.js',
  './js/components/nav.js',
  './js/components/progress-bar.js',
  './js/components/exercise-form.js',
  './js/components/milestone-badge.js',
  './js/components/shame-modal.js',
  './js/components/lion-svg.js',
  './js/components/toast.js',
  './js/components/charts.js',
  './js/views/dashboard.js',
  './js/views/log-workout.js',
  './js/views/history.js',
  './js/views/day-detail.js',
  './js/views/milestones.js',
  './js/views/settings.js',
  './js/views/templates.js',
  './js/utils/dates.js',
  './js/utils/exercises.js',
  './js/utils/backup.js',
  './js/utils/html.js',
  './js/utils/achievements.js',
  './js/utils/shame.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
];

// Install — cache all assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — cache-first strategy
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
