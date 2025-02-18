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

interface IError {
    message: string;
    stack: string;
}

// Функция для шифрования секрета с использованием Web Crypto API
export async function encrypt(secret: string, salt: Uint8Array, iv: Uint8Array) {
    const encoder = new TextEncoder();
    const data = encoder.encode(secret); // Преобразуем пин-код в массив байтов

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

    // Шифруем секрет
    const encryptedData = await crypto.subtle.encrypt(
        {name: "AES-GCM", iv: iv}, // Используем случайный IV
        cryptoKey,
        data
    );

    return encryptedData;
}

// Функция для дешифрования секрета
export async function decrypt(encryptedSecret: ArrayBuffer, salt: Uint8Array, iv: Uint8Array) {
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

    // Дешифруем секрет
    const decryptedData = await crypto.subtle.decrypt(
        {name: "AES-GCM", iv: iv}, // IV должно совпадать с тем, что использовался при шифровании
        cryptoKey,
        encryptedSecret
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
}

// Функция для регистрации биометрии

export async function registerBiometric(): Promise<null | ArrayBuffer> {
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

        const credential = (await navigator.credentials.create({
            publicKey: {
                ...publicKey,
                // **Используем largeBlob для хранения соли**
                extensions: {
                    largeBlob: {
                        support: "required",
                    }
                }
            },
        })) as PublicKeyCredential;


        if (!credential) {
            alert(`Ошибка при создании ключа ${JSON.stringify(credential, null, 2)}`);
            return null
        }
        if (credential && "getClientExtensionResults" in credential) {
            const extensionResults = credential.getClientExtensionResults() as ExtendedAuthenticationExtensionsClientOutputs;
            console.log("extensionResults", extensionResults);
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
            return credential.rawId
        }
        alert(`Ошибка при registration ключа ${JSON.stringify(registration, null, 2)}`);
        return null

    } catch (error) {
        console.log("error",error as IError)
        alert(`Ошибка при регистрации ${JSON.stringify(error, null, 2)}`);
        return null
        //alert(`❌ Ошибка при регистрации ${error?.toString()}`);
    }
}

//
export async function saveLargeBlob(rawId:Uint8Array): Promise<{ salt: Uint8Array, iv: Uint8Array } | null> {
    if (!window.PublicKeyCredential) return null;
    try {
        const response = await fetch("/api/login-challenge", {
            method: "POST",
        });
        const publicKey = await response.json();
        // Преобразуем challenge в ArrayBuffer (если сервер не отправил в нужном формате)
        publicKey.challenge = new Uint8Array(publicKey?.challenge).buffer;

        const salt = generateSalt()
        const iv = generateIV()

        // Кодируем соль и IV в объект в JSON и затем в ArrayBuffer
        const blobData = new TextEncoder().encode(JSON.stringify({
            salt: Array.from(salt),
            iv: Array.from(iv)
        }));

        const credential = await navigator.credentials.get({
            publicKey: {
                ...publicKey,
                allowCredentials: [{
                    type: 'public-key',
                    id: rawId, // Используем rawId
                }],
                extensions: {
                    largeBlob: {write: blobData} // Запрашиваем данные из largeBlob
                }
            },
        }) as PublicKeyCredential;

        if (!credential) {
            alert(`Ошибка аутентификации,  не получилось получить credential ${JSON.stringify(credential, null, 2)}`);
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
            return {salt, iv};
        }
        alert(`Ошибка при fetch:${JSON.stringify(result, null, 2)}`);
        return null
    } catch (error) {
        console.log("Ошибка при создании largeBlob:", error);
        alert(`Ошибка при создании largeBlob:${JSON.stringify(error, null, 2)}`,);
        return null
    }
}

const generateChallenge = () => {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    return challenge.buffer;
};

// Функция для аутентификации по биометрии
export async function tryBiometricLogin(rawId:Uint8Array): Promise<{ salt: Uint8Array, iv: Uint8Array } | null> {
    if (!window.PublicKeyCredential) return null;
    try {
        let publicKey = {
            challenge: generateChallenge(),
            timeout: 60000,
            rpId: "s21dr.github.io",
            userVerification: "preferred",
            extensions: {
                largeBlob: {read: true} // Запрашиваем данные из largeBlob
            }
        } as PublicKeyCredentialRequestOptions

        if (navigator?.onLine) {
            const response = await fetch("/api/login-challenge", {
                method: "POST",
            });

            publicKey = await response.json() as PublicKeyCredentialRequestOptions;
            // Преобразуем challenge в ArrayBuffer (если сервер не отправил в нужном формате)
            publicKey.challenge = new Uint8Array(publicKey?.challenge as ArrayBuffer).buffer;
            publicKey.extensions = {
                largeBlob: {read: true}
            } as AuthenticationExtensionsClientInputs
        }


        const credential = (await navigator.credentials.get({
            publicKey:{
                ...publicKey,
                allowCredentials: [{
                    type: 'public-key',
                    id: rawId, // Используем rawId
                }],
            },
        })) as PublicKeyCredential;

        if (!credential) {
            alert(`Ошибка аутентификации,  не получилось получить credential ${JSON.stringify(credential, null, 2)}`);
            return null
        }
        let result;
        if (navigator?.onLine) {
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

            result = await loginResponse.json();

        }
        if (result?.success || !navigator?.onLine) {
            if (credential && "getClientExtensionResults" in credential) {
                const extensionResults = credential.getClientExtensionResults() as ExtendedAuthenticationExtensionsClientOutputs;
                if (extensionResults.largeBlob) {
                    const blob = extensionResults.largeBlob.blob;
                    const decodedData = JSON.parse(new TextDecoder().decode(blob));
                    const salt = new Uint8Array(decodedData.salt);
                    const iv = new Uint8Array(decodedData.iv);
                    // alert(`Извлеченная соль: ${JSON.stringify(salt)}`);
                    // alert(`Извлеченный IV: ${JSON.stringify(iv)}`);

                    return {salt, iv};
                } else {
                    alert(`largeBlob not exist: ${JSON.stringify(extensionResults, null, 2)}`)
                }
            } else {
                alert(`getClientExtensionResults not exist: ${JSON.stringify(credential, null, 2)}`)
            }
        } else {
            alert(`Ошибка при fetch login:${JSON.stringify(result, null, 2)}`,);
        }
        return null
    } catch (error) {
        alert(`Ошибка при входе:${JSON.stringify(error, null, 2)}`,);
        return null
    }
}

export const fetchSeed = async (): Promise<string> => {
    const fetchSeedResponse = await fetch("/api/get-seed", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
    })
    const res = await fetchSeedResponse.json();
    return res?.seed
}