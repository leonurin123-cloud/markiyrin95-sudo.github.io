const CACHE = 'baby-diary-v1';
const ASSETS = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Offline: отдаём кэш, если сети нет
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Погодный API и геокодер не кэшируем
  if (e.request.url.includes('open-meteo.com')) return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});

// Показ пула, даже когда приложение закрыто
self.addEventListener('push', e => {
  let data = { title: '👶 Дневник малыша', body: 'Напоминание' };
  try { data = e.data.json(); } catch (err) { if (e.data) data.body = e.data.text(); }
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: './icon.svg',
    badge: './icon.svg',
    tag: data.tag || ('bd-' + Date.now()),
    data: { url: data.url || './' },
    vibrate: [200, 100, 200]
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return clients.openWindow(e.notification.data && e.notification.data.url ? e.notification.data.url : './');
  }));
});
