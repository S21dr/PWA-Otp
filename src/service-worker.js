import {precacheAndRoute} from 'workbox-precaching';
import {registerRoute} from 'workbox-routing';
import {StaleWhileRevalidate, CacheFirst, NetworkFirst} from 'workbox-strategies';
import {ExpirationPlugin} from 'workbox-expiration';
import {CacheableResponsePlugin} from 'workbox-cacheable-response';

// Предзагрузка файлов, указанных в манифесте Workbox
precacheAndRoute(self.__WB_MANIFEST);


// Кеширование статических файлов (CSS, JS, шрифты, изображения)
registerRoute(
    ({request}) => request.destination === 'style' || request.destination === 'script' || request.destination === 'font' || request.destination === 'image',
    new CacheFirst({
        cacheName: 'static-resources',
        plugins: [
            new ExpirationPlugin({maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7}),
            new CacheableResponsePlugin({statuses: [0, 200]}),
        ],
    })
);



// Функция для генерации challenge
const generateChallenge = () => {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    return challenge.buffer;
};
const RP_ID = "s21dr.github.io";

const publicKeyOptions = {
    challenge: generateChallenge(), // ✅ Теперь challenge в формате ArrayBuffer
    rp: {
        name: "Example Corp",
        id: RP_ID
    },
    user: {
        id: "userId", // ✅ ID в формате ArrayBuffer
        name: "user@example.com",
        displayName: "User Example",
    },
    pubKeyCredParams: [
        {type: "public-key", alg: -7}, // ES256 (ECDSA)
        {type: "public-key", alg: -257} // RS256 (RSA)
    ],
    timeout: 60000,
    attestation: "direct",
};

// Мокированные ответы
const mockData = {
    'https://s21dr.github.io/api/register-challenge': {
        status: 200,
        body: {publicKey: publicKeyOptions},
    },
    'https://s21dr.github.io/api/login-challenge': {
        status: 200,
        body: {
            challenge: generateChallenge(), // ✅ challenge в формате ArrayBuffer
            timeout: 60000,
            rpId: RP_ID,
            userVerification: "required",
        },
    },
    'https://s21dr.github.io/api/register': {
        status: 200,
        body: {success: true},
    },
    'https://s21dr.github.io/api/login': {
        status: 200,
        body: {success: true, token: "mocked-token"},
    },
    'https://s21dr.github.io/api/get-seed': {
        status: 200,
        body: {seed: "KVKFKRCPNZQUYMLXOVYDSQKJKZDTSRLD"},
    },
};

// // Перехватываем fetch-запросы
// self.addEventListener('fetch', (event) => {
//     const {request} = event;
//
//     // Проверяем, замокан ли этот запрос
//     if (mockData[request.url]) {
//         // Если запрос совпадает с мокированным URL, возвращаем замоканный ответ
//         const mockResponse = new Response(
//             JSON.stringify(mockData[request.url].body),
//             {status: mockData[request.url].status, headers: {'Content-Type': 'application/json'}}
//         );
//
//         event.respondWith(mockResponse);
//     } else {
//         // Если запрос не замокан, передаем его дальше
//         event.respondWith(
//             fetch(event.request)
//                 .then(response => {
//                     return response;
//                 }).catch(()=>caches.match(event.request).then((cachedResponse) => cachedResponse || fetch(event.request)))
//
//         );
//     }
// });

// // Для остальных запросов — кэш или сеть
// self.addEventListener('fetch', (event) => {
//     event.respondWith(
//         caches.match(event.request).then((cachedResponse) => cachedResponse || fetch(event.request))
//     );
// });

// 🔹 Обработка всех fetch-запросов (моки + сеть + кеш)
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // 1️⃣ Проверяем, замокан ли этот запрос
    if (mockData[request.url]) {
        const mockResponse = new Response(
            JSON.stringify(mockData[request.url].body),
            { status: mockData[request.url].status, headers: { 'Content-Type': 'application/json' } }
        );
        event.respondWith(mockResponse);
        return;
    }

    // 2️⃣ Все остальные запросы — сначала сеть, потом кеш
    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Клонируем ответ и сохраняем в кеш
                const responseToCache = response.clone();
                caches.open('dynamic-cache').then(cache => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            })
            .catch(() => caches.match(event.request).then(cachedResponse => cachedResponse || new Response("Offline mode", { status: 503 })))
    );
});

// 🔹 Активируем новый Service Worker сразу после установки
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Удаляем старые кеши при активации нового Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((cacheName) => cacheName !== 'static-resources' && cacheName !== 'dynamic-cache')
                    .map((cacheName) => caches.delete(cacheName))
            );
        })
    );
});