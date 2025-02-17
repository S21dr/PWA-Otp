import {DBSchema, IDBPDatabase, openDB,} from 'idb';

// Описываем структуру базы данных
export interface AppDB  extends DBSchema {
    settings: {
        key: IDBValidKey;
        value: string  | ArrayBuffer | Uint8Array ;
    };
}

let dbInstance: IDBPDatabase<AppDB> | null = null;

// ⚡ Инициализация базы данных
export const initDB = async (): Promise<IDBPDatabase<AppDB>> => {
    if (dbInstance) return dbInstance;

    dbInstance = await openDB<AppDB>('pwa-db', 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings');
            }
        },
    });

    return dbInstance;
};
