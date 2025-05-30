import {cleanupOutdatedCaches, precacheAndRoute} from 'workbox-precaching';

// 🔹 Активируем новый Service Worker сразу после установки
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim()); // Принудительно активируем SW
});


cleanupOutdatedCaches()

// Кеширование файлов из /dist
precacheAndRoute(self.__WB_MANIFEST);

// Кеширование статических файлов (CSS, JS, шрифты, изображения)
// registerRoute(
//     ({ request} ) => request.destination === 'style' || request.destination === 'script' || request.destination === 'font' || request.destination === 'image',
//     new CacheFirst({
//         cacheName: 'static-resources',
//         plugins: [
//             new ExpirationPlugin({maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7}),
//             new CacheableResponsePlugin({statuses: [0, 200]}),
//         ],
//     })
// );




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
            authenticatorSelection: {
                userVerification: "required", // Проверка пользователя обязательна
                requireResidentKey: true, // Требуется резидентный ключ (для discoverable credentials)
            },
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



// Обработка всех fetch-запросов (моки + сеть)
self.addEventListener('fetch', (event) => {
    const {request} = event;

    // Проверяем, замокан ли этот запрос
    if (mockData[request.url] && navigator?.onLine) {
        const mockResponse = new Response(
            JSON.stringify(mockData[request.url].body),
            {status: mockData[request.url].status, headers: {'Content-Type': 'application/json'}}
        );
        event.respondWith(mockResponse);
    }
});




self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING')
        self.skipWaiting()
})