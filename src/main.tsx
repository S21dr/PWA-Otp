import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import {Provider} from "react-redux";
import {store} from "./store";
import LoadApp from "./LoadApp.tsx";


const root = createRoot(document.getElementById('root') as HTMLElement)

const prepareApp = async () => {
    if (import.meta.env.MODE === 'production') {
        try {
            // Ждем готовности Service Worker с таймаутом
            await Promise.race([
                navigator.serviceWorker.ready,
                new Promise((_, reject) => setTimeout(() => reject(new Error('Service Worker timeout')), 5000)), // Таймаут 5 секунд
            ]);
        } catch (error) {
            console.error('Ошибка при ожидании Service Worker:', error);
        }
    } else {
        const {worker} = await import('./mocks/browser')
        return worker.start({
            serviceWorker: {
                url: "./mockServiceWorker.js",
            },
        });
    }
}


prepareApp().then(() => {
    root.render(
        <StrictMode>
            <Provider store={store}>
                <LoadApp>
                    <App/>
                </LoadApp>
            </Provider>
        </StrictMode>,
    )
})


// // Регистрация Service Worker для PWA
// if ("serviceWorker" in navigator) {
//     navigator.serviceWorker
//         .register("./sw.js")
//         .then(() => console.log("✅ Service Worker зарегистрирован"))
//         .catch((err) => console.error("❌ Ошибка регистрации Service Worker:", err));
// }