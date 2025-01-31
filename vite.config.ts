import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',  // Это позволяет серверу слушать на всех интерфейсах, включая внешний IP.
    allowedHosts: ['rare-brooms-swim.loca.lt', 'localhost', '192.168.0.103'], // Разрешить доступ с твоего IP и других хостов.
  },
  plugins: [react()],
})
