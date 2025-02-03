import {IPinRow} from "./db.ts";

// Функция для регистрации биометрии

export async function registerBiometric(): Promise<boolean> {
    if (!window.PublicKeyCredential) return false;
    try {
        const response = await fetch("/api/register-challenge", {
            method: "POST",
        });
        const res = await response.json();
        const {publicKey} = res

        // Преобразуем challenge из ArrayBuffer в Uint8Array
        publicKey.challenge = new Uint8Array(publicKey.challenge).buffer;

        // Преобразуем user.id из ArrayBuffer в Uint8Array
        publicKey.user.id = new Uint8Array(2);


        const credential = (await navigator.credentials.create({
            publicKey,
        })) as PublicKeyCredential;

        if (!credential) {
            console.error("Ошибка при создании ключа");
            return false
        }

        const regResp = await fetch("/api/register", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                id: credential.id,
                rawId: Array.from(new Uint8Array(credential.rawId)),
                response: {
                    attestationObject: Array.from(new Uint8Array((credential.response as AuthenticatorAttestationResponse).attestationObject)),
                    clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON)),
                },
                type: credential.type,
            }),
        });
        const registration = await regResp.json();
        return !!registration?.success


    } catch (error) {
        console.error("Ошибка при регистрации:", error);
        return false
        //alert(`❌ Ошибка при регистрации ${error?.toString()}`);
    }
}

// Функция для аутентификации по биометрии
export async function tryBiometricLogin(): Promise<boolean> {
    if (!window.PublicKeyCredential) return false;
    try {
        const response = await fetch("/api/login-challenge", {
            method: "POST",
        });
        const publicKey = await response.json();
        // Преобразуем challenge в ArrayBuffer (если сервер не отправил в нужном формате)
        publicKey.challenge = new Uint8Array(publicKey?.challenge).buffer;

        const credential = (await navigator.credentials.get({
            publicKey,
        })) as PublicKeyCredential;

        if (!credential) {
            console.error("Ошибка аутентификации,  не получилось получить credential");
            return false
        }

        const loginResponse = await fetch("/api/login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                id: credential.id,
                rawId: Array.from(new Uint8Array(credential.rawId)),
                response: {
                    authenticatorData: Array.from(new Uint8Array((credential.response as AuthenticatorAssertionResponse).authenticatorData)),
                    clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON)),
                    signature: Array.from(new Uint8Array((credential.response as AuthenticatorAssertionResponse).signature)),
                },
                type: credential.type,
            }),
        });

        const result = await loginResponse.json();
        return !!result?.success
    } catch (error) {
        console.error("Ошибка при входе:", error);
        return false
    }
}


// Функция для генерации соли (для шифрования)
export function generateSalt() {
    return crypto.getRandomValues(new Uint8Array(16));
}

// Функция для генирации IV
export function generateIV() {
    return crypto.getRandomValues(new Uint8Array(12));
}

// Функция для шифрования пин-кода с использованием Web Crypto API
export async function encryptPin(pin: string, salt: Uint8Array, iv: Uint8Array) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin); // Преобразуем пин-код в массив байтов

    // Генерация ключа для шифрования
    const key = await crypto.subtle.importKey(
        "raw",
        salt,
        {name: "PBKDF2"},
        false,
        ["deriveKey"]
    );

    // Используем PBKDF2 для получения ключа для шифрования
    const cryptoKey = await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256",
        },
        key,
        {name: "AES-GCM", length: 256},
        false,
        ["encrypt", "decrypt"]
    );

    // Шифруем пин-код
    const encryptedData = await crypto.subtle.encrypt(
        {name: "AES-GCM", iv: iv}, // Используем случайный IV
        cryptoKey,
        data
    );

    return encryptedData;
}

// Функция для дешифрования пин-кода
export async function decryptPin({encryptedPin, salt, iv}:IPinRow) {
    const key = await crypto.subtle.importKey(
        "raw",
        salt,
        {name: "PBKDF2"},
        false,
        ["deriveKey"]
    );

    const cryptoKey = await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256",
        },
        key,
        {name: "AES-GCM", length: 256},
        false,
        ["encrypt", "decrypt"]
    );

    // Дешифруем пин-код
    const decryptedData = await crypto.subtle.decrypt(
        {name: "AES-GCM", iv: iv}, // IV должно совпадать с тем, что использовался при шифровании
        cryptoKey,
        encryptedPin
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
}