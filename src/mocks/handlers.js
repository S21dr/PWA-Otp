import {http, HttpResponse} from 'msw'
import {SHA256, enc} from 'crypto-js';

const  RP_ID = process.env.NODE_ENV === "development" ? "localhost" : "s21dr.github.io"

// Функция для генерации challenge
const generateChallenge = () => {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    return challenge.buffer;
};
// Преобразуем идентификатор пользователя в хеш с помощью SHA-256
const userId = enc.Base64.stringify(SHA256("user@example.com"));
export const handlers = [
    // Мок для получения challenge при регистрации
    http.post("/api/register-challenge", () => {
        const publicKeyOptions = {
            challenge: generateChallenge(), // ✅ Теперь challenge в формате ArrayBuffer
            rp: {
                name: "Example Corp",
                id:RP_ID
            },
            user: {
                id: userId, // ✅ ID в формате ArrayBuffer
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

        return HttpResponse.json({publicKey: publicKeyOptions});
    }),

    // Мок для получения challenge при входе
    http.post("/api/login-challenge", () => {
        return HttpResponse.json({
            challenge: generateChallenge(), // ✅ challenge в формате ArrayBuffer
            timeout: 60000,
            rpId: RP_ID,
            userVerification: "required",
        });
    }),
    // Мок для регистрации пользователя
    http.post("/api/register", () => {
        return HttpResponse.json({success: true});
    }),

    // Логин пользователя (WebAuthn ответ)
    http.post("/api/login", async () => {
        return HttpResponse.json({success: true, token: "mocked-token"});
    }),

    // Генерация OTP
    http.get("/api/otp", async () => {
        console.log("Mock for /api/otp triggered");
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        return HttpResponse.json({otp});
    }),
];