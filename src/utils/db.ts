import { openDB } from "idb";

const DB_NAME = "authDB";
const STORE_NAME = "authStore";

export interface IPinRow {
    encryptedPin:  ArrayBuffer
    salt: Uint8Array
    iv: Uint8Array

}

async function getDB() {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            db.createObjectStore(STORE_NAME);
        },
    });
}

export async function savePinToDB(pinRow: {encryptedPin: ArrayBuffer}) {
    const db = await getDB();
    await db.put(STORE_NAME, pinRow, "pin");
}

export async function getStoredPin() {
    const db = await getDB();
    return db.get(STORE_NAME, "pin") as Promise<{encryptedPin: ArrayBuffer}>;
}

export async function saveBiometricSetting(enabled: boolean) {
    const db = await getDB();
    await db.put(STORE_NAME, enabled, "biometric");
}

export async function getBiometricSetting() {
    const db = await getDB();
    return db.get(STORE_NAME, "biometric");
}
