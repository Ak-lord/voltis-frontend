import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectRegister: 'auto',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Voltis',
        short_name: 'Voltis',
        description: 'Suivi coupures SONABEL à Ouagadougou',
        theme_color: '#0D0D14',
        background_color: '#0D0D14',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': 'http://127.0.0.1:8001',
    },
  },
})
