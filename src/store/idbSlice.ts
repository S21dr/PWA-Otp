import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {IDBPDatabase} from 'idb';
import {AppDB} from "./idb.ts";

interface IDBState {
    db: IDBPDatabase<AppDB> | null;
    rawId: number[];
    seed: string;
    salt: Uint8Array | null;
    iv: Uint8Array | null;
}

const initialState: IDBState = {
    db: null,
    rawId: [],
    seed: "",
    salt: null,
    iv: null,
};

const idbSlice = createSlice({
    name: 'idb',
    initialState,
    reducers: {
        setDB: (state, action: PayloadAction<IDBPDatabase<AppDB>>) => {
            state.db = action.payload;
        },
        setRawId: (state, action: PayloadAction<number[]>) => {
            state.rawId = action.payload;
        },
        setSeed: (state, action: PayloadAction<string>) => {
            state.seed = action.payload;
        },
        setSalt: (state, action: PayloadAction<Uint8Array>) => {
            state.salt = action.payload;
        },
        setIv: (state, action: PayloadAction<Uint8Array>) => {
            state.iv = action.payload;
        }
    },
});

export const {setDB, setRawId, setSeed, setSalt, setIv} = idbSlice.actions;
export default idbSlice.reducer;
