import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react-swc'
import checker from "vite-plugin-checker";
import {nodePolyfills} from "vite-plugin-node-polyfills";
import {VitePWA} from "vite-plugin-pwa";


// https://vite.dev/config/
export default defineConfig({
    server: {
        host: '0.0.0.0',  // Это позволяет серверу слушать на всех интерфейсах, включая внешний IP.
        allowedHosts: ['s21dr.github.io/PWA-Otp/', 'localhost', '192.168.0.103'], // Разрешить доступ с твоего IP и других хостов.
    },
    plugins: [
        react(),
        checker({
            typescript: {
                tsconfigPath: './tsconfig.app.json'
            },
            eslint: {
                // for example, lint .ts and .tsx
                lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
                useFlatConfig: true,
            },
        }), // Проверяет TypeScript ошибки в терминале
        nodePolyfills(),
        VitePWA({
            base: "/PWA-Otp/",
            strategies: 'injectManifest',
            srcDir: 'src',
            filename: 'service-worker.js',
            manifest: {
                name: "PWA OTP",
                short_name: "PWA OTP",
                start_url: "/PWA-Otp/",
                display: "standalone",
                background_color: "#ffffff",
                theme_color: "#000000",
                icons: [
                    {
                        src: "/PWA-Otp/vite.svg",
                        sizes: "512x512",
                        type: "image/svg+xml"
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
            },
        }),
    ],
    base: "/PWA-Otp/", // YOUR REPO NAME HERE
})
