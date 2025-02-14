import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import {Provider} from "react-redux";
import {store} from "./store";
import LoadApp from "./LoadApp.tsx";

const root = createRoot(document.getElementById('root') as HTMLElement)

const prepareApp = async () => {
    // if ('serviceWorker' in navigator) {
    //     await navigator.serviceWorker.register('./service-worker.js',);
    // }
    // const {worker} = await import('./mocks/browser')
    // return worker.start({
    //     serviceWorker: {
    //         url: "./mockServiceWorker.js",
    //     },
    // });
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