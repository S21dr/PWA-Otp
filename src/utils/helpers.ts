import {IPinRow} from "./db.ts";

interface ExtendedAuthenticationExtensionsClientOutputs extends AuthenticationExtensionsClientOutputs {
    largeBlob?: { blob: ArrayBuffer };
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
export async function decryptPin({encryptedPin, salt, iv}: IPinRow) {
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

// Функция для регистрации биометрии

export async function registerBiometric(): Promise<{ salt: Uint8Array, iv: Uint8Array } | null> {
    if (!window.PublicKeyCredential) return null;
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

        const salt = generateSalt()
        const iv = generateIV()

        // Кодируем соль и IV в объект в JSON и затем в ArrayBuffer
        const blobData = new TextEncoder().encode(JSON.stringify({
            salt: Array.from(salt),
            iv: Array.from(iv)
        }));

        const credential = (await navigator.credentials.create({
            publicKey: {
                ...publicKey,
                // **Используем largeBlob для хранения соли**
                extensions: {
                    largeBlob: {
                        support: "required",
                        blob: blobData // Сохраняем blobData в largeBlob
                    }
                }
            },
        })) as PublicKeyCredential;

        if (!credential) {
            console.error("Ошибка при создании ключа");
            return null
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
        if (registration?.success) {
            return {salt, iv};
        }
        return null;


    } catch (error) {
        console.error("Ошибка при регистрации:", error);
        return null
        //alert(`❌ Ошибка при регистрации ${error?.toString()}`);
    }
}

// Функция для аутентификации по биометрии
export async function tryBiometricLogin(): Promise<{ salt: Uint8Array, iv: Uint8Array } | null> {
    if (!window.PublicKeyCredential) return null;
    try {
        const response = await fetch("/api/login-challenge", {
            method: "POST",
        });
        const publicKey = await response.json();
        // Преобразуем challenge в ArrayBuffer (если сервер не отправил в нужном формате)
        publicKey.challenge = new Uint8Array(publicKey?.challenge).buffer;

        const credential = (await navigator.credentials.get({
            publicKey: {
                ...publicKey,
                extensions: {
                    largeBlob: {read: true} // Запрашиваем данные из largeBlob
                }
            },
        })) as PublicKeyCredential;

        if (!credential) {
            console.error("Ошибка аутентификации,  не получилось получить credential");
            return null
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


        if (result?.success) {
            if (credential && "getClientExtensionResults" in credential) {
                const extensionResults = credential.getClientExtensionResults() as ExtendedAuthenticationExtensionsClientOutputs;
                if (extensionResults.largeBlob) {
                    const blob = extensionResults.largeBlob.blob;
                    const decodedData = JSON.parse(new TextDecoder().decode(blob));
                    const salt = new Uint8Array(decodedData.salt);
                    const iv = new Uint8Array(decodedData.iv);

                    console.log("Извлеченная соль:", salt);
                    console.log("Извлеченный IV:", iv);

                    return {salt, iv};
                } else {
                    alert(`largeBlob not exist: ${extensionResults}`)
                }
            } else {
                alert(`getClientExtensionResults not exist: ${credential}`)
            }
        }
        return null
    } catch (error) {
        alert(`Ошибка при входе:${error}`,);
        return null
    }
}