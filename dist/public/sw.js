// Service Worker — Caderno da Diretora
// Estratégia: Cache-First para assets estáticos, Network-First para API

const CACHE_VERSION = 'v9';
const STATIC_CACHE = 'caderno-static-' + CACHE_VERSION;
const API_CACHE    = 'caderno-api-' + CACHE_VERSION;

// Assets que serão pré-cacheados no install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.png',
  '/favicon.svg',
  '/painel-educacional.css',
  '/assets/index-v2.css',
  '/assets/Dashboard-ClSrBhM3.css',
  '/assets/postit.css',
  '/assets/vendor-react-CRHowRiP-fix2.js',
  '/assets/react-core-aq.js',
  '/assets/Dashboard-v30.js',
  '/assets/charts-core-aq.js',
  '/assets/maps-core-aq.js',
  '/assets/motion-core-aq.js',
  '/assets/index-v10-shared.js',
  '/assets/index-v21.js',
  '/api/raw-js?f=vendor',
  '/api/raw-js?f=dashboard',
  '/api/raw-js?f=charts',
  '/api/raw-js?f=shared10',
  '/api/raw-js?f=entry',
  '/manifest.json',
];

// ── Install: pré-cachear assets estáticos ───────────────────────────────────
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function(cache) {
      return Promise.allSettled(
        PRECACHE_ASSETS.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.warn('[SW] Falha ao pré-cachear:', url, err);
          });
        })
      );
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// ── Activate: limpar caches antigos ─────────────────────────────────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== STATIC_CACHE && key !== API_CACHE;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ── Fetch: estratégia por tipo de recurso ────────────────────────────────────
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Só interceptar requisições do mesmo origin
  if (url.origin !== location.origin) return;

  // Ignorar métodos não-GET
  if (event.request.method !== 'GET') return;

  var pathname = url.pathname;

  // API calls: Network-First com fallback para cache
  if (pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCache(event.request, API_CACHE));
    return;
  }

  // Assets estáticos (/assets/, fontes, favicon): Cache-First
  if (
    pathname.startsWith('/assets/') ||
    pathname === '/favicon.png' ||
    pathname === '/favicon.svg' ||
    pathname === '/painel-educacional.css' ||
    pathname === '/manifest.json'
  ) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }

  // Navegação (HTML): Network-First, fallback para index.html cacheado
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(function() {
        return caches.match('/index.html');
      })
    );
    return;
  }
});

// Cache-First: serve do cache, baixa da rede se não tiver
function cacheFirst(request, cacheName) {
  return caches.open(cacheName).then(function(cache) {
    return cache.match(request).then(function(cached) {
      if (cached) return cached;
      return fetch(request).then(function(response) {
        if (response && response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      }).catch(function() {
        return new Response('Recurso indisponível offline.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      });
    });
  });
}

// Network-First: tenta a rede, usa cache se falhar
function networkFirstWithCache(request, cacheName) {
  return caches.open(cacheName).then(function(cache) {
    return fetch(request).then(function(response) {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    }).catch(function() {
      return cache.match(request).then(function(cached) {
        if (cached) return cached;
        return new Response(
          JSON.stringify({ ok: false, offline: true, error: 'Sem conexão' }),
          { status: 503, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        );
      });
    });
  });
}
