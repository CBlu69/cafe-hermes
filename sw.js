const CACHE_NAME = 'cafe-hermes-v1'
const CORE_ASSETS = [
    './',
    './index.html',
    './menu.html',
    './about.html',
    './manifest.json',
    './css/style.css',
    './js/effects.js',
    './js/config.js',
    './js/menu.js',
    './assets/logo.png',
    './assets/banner.png',
    './assets/icon-192.png',
    './assets/icon-512.png'
]

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(CORE_ASSETS))
            .then(() => self.skipWaiting())
    )
})

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    )
})

self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url)

    if (url.origin !== location.origin) {
        if (e.request.method === 'GET' && e.request.mode === 'no-cors') {
            e.respondWith(fetch(e.request).then((res) => {
                const copy = res.clone()
                caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy)).catch(() => { })
                return res
            }).catch(() => caches.match(e.request)))
        }
        return
    }

    if (e.request.method !== 'GET') return

    const isPage = e.request.mode === 'navigate'

    e.respondWith(
        caches.match(e.request).then((cached) => {
            if (cached && !isPage) return cached

            const network = fetch(e.request)
                .then((res) => {
                    if (res && res.ok) {
                        const copy = res.clone()
                        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy)).catch(() => { })
                    }
                    return res
                })
                .catch(() => {
                    if (isPage) return caches.match('./index.html')
                    return cached
                })

            return network
        })
    )
})

self.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting()
})
