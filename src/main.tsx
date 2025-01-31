import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const root  = createRoot(document.getElementById('root'))

const prepareApp = async () => {
    const { worker } = await import('./mocks/browser.js')
    return  worker.start();
}

prepareApp().then(()=>{
    root.render(
        <StrictMode>
            <App/>
        </StrictMode>,
    )
})

// Регистрация Service Worker для PWA
if ("serviceWorker" in navigator) {
    navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("✅ Service Worker зарегистрирован"))
        .catch((err) => console.error("❌ Ошибка регистрации Service Worker:", err));
}