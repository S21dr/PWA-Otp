import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react-swc'
import checker from "vite-plugin-checker";
import {nodePolyfills} from "vite-plugin-node-polyfills";


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
        nodePolyfills({
            globals: {
                Buffer: true,
            }
        }),
    ],
    base: "/PWA-Otp/", // YOUR REPO NAME HERE
})
