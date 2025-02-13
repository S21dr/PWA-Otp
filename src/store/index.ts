import { configureStore } from '@reduxjs/toolkit';
import idbReducer from './idbSlice';

export const store = configureStore({
    reducer: {
        idb: idbReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;