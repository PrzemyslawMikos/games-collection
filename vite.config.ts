import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/games-collection/',
  server: {
    proxy: {
      '/github-auth': {
        target: 'https://github.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/github-auth/, ''),
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Kolekcja Gier',
        short_name: 'Kolekcja Gier',
        description: 'Prywatny katalog kolekcji gier fizycznych',
        theme_color: '#f4efe6',
        background_color: '#f4efe6',
        display: 'standalone',
        lang: 'pl',
        scope: '/games-collection/',
        start_url: '/games-collection/',
        icons: [
          {
            src: '/games-collection/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
