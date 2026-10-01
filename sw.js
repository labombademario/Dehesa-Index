/* Dehesa Index service worker: cache parcial y offline.
   - HTML: red primero, cache como respaldo (y offline.html si no hay nada).
   - JS/CSS: red primero con revalidacion (cache:'no-cache'), cache como respaldo: asi un cambio publicado se ve en la siguiente carga, no en la segunda.
   - imagenes: stale-while-revalidate.
   - data/*.json: red primero (los datos deben ser frescos), cache como respaldo; solo se guardan respuestas < 1.5 MB. */
var BUILD = '1d6ee3da13'; // lo escribe scripts/stamp-sw.mjs (hash del codigo estructural)
var V = 'di-' + BUILD, SHELL = ['/offline.html', '/css/style.css', '/js/shared.js', '/assets/icon-192.png'];
var MAXDATA = 1500000, MAXENTRIES = 120;
self.addEventListener('install', function (e) { e.waitUntil(caches.open(V).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
function trim(c) { c.keys().then(function (ks) { if (ks.length > MAXENTRIES) c.delete(ks[0]); }); }
function put(req, res) { if (!res || res.status !== 200) return res; var len = +res.headers.get('content-length') || 0; if (len > MAXDATA) return res; var cp = res.clone(); caches.open(V).then(function (c) { c.put(req, cp).then(function () { trim(c); }); }); return res; }
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET') return;
  var u = new URL(r.url); if (u.origin !== location.origin) return;
  var isData = /\/data\/.+\.json$/.test(u.pathname), isHtml = r.mode === 'navigate' || (r.headers.get('accept') || '').indexOf('text/html') >= 0;
  if (isHtml || isData) {
    e.respondWith(fetch(r.url, { cache: 'no-cache' }).then(function (res) { return put(r, res); }).catch(function () { return caches.match(r).then(function (m) { return m || (isHtml ? caches.match('/offline.html') : new Response('{}', { status: 503, headers: { 'Content-Type': 'application/json' } })); }); }));
    return;
  }
  if (/\.(js|css)$/.test(u.pathname)) {
    e.respondWith(fetch(r.url, { cache: 'no-cache' }).then(function (res) { return put(r, res); }).catch(function () { return caches.match(r); }));
    return;
  }
  e.respondWith(caches.match(r).then(function (m) { var net = fetch(r).then(function (res) { return put(r, res); }).catch(function () { return m; }); return m || net; }));
});
