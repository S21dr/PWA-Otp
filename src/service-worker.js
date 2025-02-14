import {precacheAndRoute} from 'workbox-precaching';
import {registerRoute} from 'workbox-routing';
import {StaleWhileRevalidate, CacheFirst, NetworkFirst} from 'workbox-strategies';
import {ExpirationPlugin} from 'workbox-expiration';
import {CacheableResponsePlugin} from 'workbox-cacheable-response';

// Предзагрузка файлов, указанных в манифесте Workbox
precacheAndRoute(self.__WB_MANIFEST);

// 📌 Кешируем `index.html` и главную страницу PWA
registerRoute(
    ({ url }) => url.pathname === '/PWA-Otp/' || url.pathname === '/PWA-Otp/index.html',
    new StaleWhileRevalidate({
        cacheName: 'html-cache',
        plugins: [
            new ExpirationPlugin({ maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 }),
        ],
    })
);

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

// 📌 Обрабатываем API-запросы с моками
registerRoute(
    ({ request }) => request.url.startsWith('https://s21dr.github.io/api/'),
    async ({ event }) => {
        const { request } = event;

        // Проверяем, есть ли мок-ответ
        if (mockData[request.url]) {
            return new Response(
                JSON.stringify(mockData[request.url].body),
                { status: mockData[request.url].status, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Используем NetworkFirst для API
        const networkFirst = new NetworkFirst({
            cacheName: 'api-cache',
            plugins: [
                new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 }),
            ],
        });

        return networkFirst.handle({ event });
    }
);

// Активируем новый Service Worker сразу после установки
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Удаляем старые кеши при активации нового Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((cacheName) => cacheName !== 'static-resources' && cacheName !== 'api-cache' && cacheName !== 'html-cache')
                    .map((cacheName) => caches.delete(cacheName))
            );
        })
    );
});
