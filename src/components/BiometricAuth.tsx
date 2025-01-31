import {FunctionComponent, useEffect, useState} from "react";
import {IDBPDatabase, openDB} from "idb";

interface OwnProps {
    handleChangeAuth: (auth:boolean) => void
}

type Props = OwnProps;
const BiometricAuth:  FunctionComponent<Props> = ({handleChangeAuth}) => {
    const [supported, setSupported] = useState<boolean>(false);

    const [isBiometricProhibited, setIsBiometricProhibited] = useState(false)
    const [isBiometricRegistered, setIsBiometricRegistered] = useState(false)
    const [db, setDb] = useState<IDBPDatabase<unknown> | null>(null);


    const rejectBiometric = async () => {
        if (db) {
            const tx = db.transaction("biometricAuth", "readwrite");
            const store = tx.objectStore("biometricAuth");
            await store.put({id: "biometricProhibited", biometricProhibited: true});
            await tx.done;
        }
        setIsBiometricProhibited(true)
    }

    // Функция для регистрации нового пользователя
    async function registerUser(): Promise<void> {
        try {
            const response = await fetch("/api/register-challenge", {
                method: "POST",
            });
            const res = await response.json();
            const {publicKey} = res
            console.log(publicKey)
            // Преобразуем challenge из ArrayBuffer в Uint8Array
            publicKey.challenge = new Uint8Array(publicKey.challenge).buffer;

            // Преобразуем user.id из ArrayBuffer в Uint8Array
            publicKey.user.id = new Uint8Array(2);


            const credential = (await navigator.credentials.create({
                publicKey,
            })) as PublicKeyCredential;

            if (!credential) {
                throw new Error("Ошибка при создании ключа");
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
                handleChangeAuth(true)
                if (db) {
                    const tx = db.transaction("biometricAuth", "readwrite");
                    const store = tx.objectStore("biometricAuth");
                    await store.put({id: "biometricRegistered", biometricRegistered: true});
                    await tx.done;
                }
                alert("✅ Регистрация успешна!");
            } else {
                alert(`❌ Ошибка при регистрации`)
            }


        } catch (error) {
            console.error("Ошибка при регистрации:", error);
            alert(`❌ Ошибка при регистрации ${error?.toString()}`);
        }
    }

    // Функция для входа с Face ID / Touch ID
    async function loginUser(): Promise<void> {
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
                throw new Error("Ошибка аутентификации");
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
            if (result.success) {
                handleChangeAuth(true);
                alert("✅ Вход успешен!");
            } else {
                alert("❌ Ошибка входа");
            }
        } catch (error) {
            console.error("Ошибка при входе:", error);
            alert(`❌ Ошибка при входе ${error?.toString()}`);
        }
    }

    useEffect(() => {
        if (window?.PublicKeyCredential) {
            setSupported(true);
        }

        // Инициализация IndexedDB
        const initializeDb = async () => {
            const database = await openDB("DB", 1, {
                upgrade(db) {
                    db.createObjectStore("biometricAuth", {keyPath: "id"});
                },
            });
            setDb(database);

            const tx = database.transaction("biometricAuth", "readonly");
            const store = tx.objectStore("biometricAuth");
            const biometricAllowed = await store.get("biometricProhibited");

            if (biometricAllowed?.biometricProhibited) {
                setIsBiometricProhibited(biometricAllowed?.biometricProhibited)
            }

            const biometricRegistered = await store.get("biometricRegistered");
            if (biometricRegistered?.biometricRegistered) {
                setIsBiometricRegistered(true)
                loginUser()
            }

        };

        initializeDb();

    }, []);

    return (<>
        {
            !isBiometricProhibited && !isBiometricRegistered  && <div>
                {supported ? (
                    <>
                        <h4>Исполдьзовать Биометрию для входа</h4>
                        <div>
                            <button onClick={registerUser}>📝 Разрешить</button>
                        </div>
                        <div>
                            <button onClick={rejectBiometric}> Не разрешать</button>
                        </div>
                    </>

                ) : (
                    <p>⚠ Ваш браузер не поддерживает WebAuthn</p>
                )}
            </div>
        }
    </>);
};

export default BiometricAuth;