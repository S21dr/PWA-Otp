import { RootState } from '../store';
import { store } from '../store';
import {AppDB} from "../store/idb.ts";
//
// 📌 Функция записи данных
export const setItem = async <T extends keyof AppDB>(
    storeName: "settings",
    key: IDBValidKey,
    value: AppDB[T]['value']
): Promise<void> => {
    const db = (store.getState() as RootState).idb.db;
    if (!db) throw new Error('IndexedDB не загружена');

    await db.put(storeName, value, key);
};

// // 📌 Функция чтения данных
// export const getItem = async <T extends keyof AppDB>(
//     storeName: T,
//     key: AppDB[T]['key']
// ): Promise<AppDB[T]['value'] | undefined> => {
//     const db = (store.getState() as RootState).idb.db;
//     if (!db) throw new Error('IndexedDB не загружена');
//
//     return db.get(storeName, key);
// };
