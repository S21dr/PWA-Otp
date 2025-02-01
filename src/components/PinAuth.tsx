import  {useState, useEffect, FunctionComponent} from "react";
import {IDBPDatabase, openDB} from "idb";
import {SHA256} from "crypto-js";
// Функция для генерации соли (для шифрования)
function generateSalt() {
    return crypto.getRandomValues(new Uint8Array(16));
}
function generateIV() {
    return crypto.getRandomValues(new Uint8Array(12));
}

// Функция для шифрования пин-кода с использованием Web Crypto API
async function encryptPin(pin:string, salt: Uint8Array, iv:Uint8Array) {
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
async function decryptPin(encryptedPin:ArrayBuffer, salt: Uint8Array, iv:Uint8Array) {
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

interface OwnProps {
    isPinSet: boolean
    setIsPinSet: (arg:boolean) => void
    handleChangeAuth: (auth:boolean) => void
}

type Props = OwnProps;
const PinAuth: FunctionComponent<Props> = ({isPinSet,setIsPinSet, handleChangeAuth}) => {
    const [pinCode, setPinCode] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [db, setDb] = useState<IDBPDatabase<unknown> | null>(null);


    useEffect(() => {
        // Инициализация IndexedDB
        const initializeDb = async () => {
            const database = await openDB("DB", 1, {
                upgrade(db) {
                    db.createObjectStore("pins", {keyPath: "id"});
                },
            });
            setDb(database);

            const tx = database.transaction("pins", "readonly");
            const store = tx.objectStore("pins");
            const storedPinData = await store.get("userPin");
            if (storedPinData) {
                setIsPinSet(true)
            }
        };

        initializeDb();
    }, []);

    const handlePinChange = (e:any) => {
        setPinCode(e.target.value);
    };

    const handlePinSubmit = async () => {
        if (pinCode.length !== 5) {
            setErrorMessage("Пин-код должен содержать 5 цифр.");
            return;
        }


        // Сохраняем зашифрованный пин в IndexedDB
        if (db) {
            const salt = generateSalt();
            const iv = generateIV()
            const pin = SHA256(pinCode).toString()
            const encrypted = await encryptPin(pin, salt,iv);

            const tx = db.transaction("pins", "readwrite");
            const store = tx.objectStore("pins");
            await store.put({id: "userPin", encryptedPin: encrypted, salt: Array.from(salt), iv: Array.from(iv)});

            await tx.done;

            setIsPinSet(true);
            setErrorMessage("");
        } else {
            setErrorMessage("Ошибка ба");
        }

    };


    const handlePinCodeAuthentication = async () => {
        if (!db) {
            setErrorMessage("Ошибка базы данных.");
            return;
        }

        const tx = db.transaction("pins", "readonly");
        const store = tx.objectStore("pins");
        const storedPinData = await store.get("userPin");

        if (!storedPinData) {
            setErrorMessage("Пин-код не установлен.");
            return;
        }

        const {encryptedPin, salt, iv} = storedPinData;
        try {
            const decryptedPin = await decryptPin(encryptedPin, new Uint8Array(salt), new Uint8Array(iv));

            // Проверка пин-кода
            if (decryptedPin === SHA256(pinCode).toString()) {
                console.log("Аутентификация прошла успешно");
                handleChangeAuth(true)
                setErrorMessage("");
            } else {
                setErrorMessage("Неверный пин-код.");
            }
        } catch (error) {
            setErrorMessage("Ошибка при дешифровании пин-кода.");
        }
    };

    return (
        <div>
            <div>
                <input
                    type="text"
                    value={pinCode}
                    onChange={handlePinChange}
                    maxLength={5}
                    placeholder="Введите пин-код (5 цифр)"
                />
            </div>

            {!isPinSet ? (
                <div>
                    <button onClick={handlePinSubmit}>Установить пин-код</button>
                </div>
            ) : (
                <div>
                    <button onClick={handlePinCodeAuthentication}>Войти с пин-кодом</button>
                </div>
            )}

            {errorMessage && <p style={{color: "red"}}>{errorMessage}</p>}


        </div>
    );
};

export default PinAuth;