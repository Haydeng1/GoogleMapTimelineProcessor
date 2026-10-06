import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        // target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        // Add this to prevent Vite from timing out or dropping large headers
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Extends proxy timeout limits for huge files
            req.setTimeout(0); 
          });
        },
      },
    },
  },
})
