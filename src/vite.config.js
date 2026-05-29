import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'icon-512.png',
        'Star_svg_2.svg',
        'chime.mp3',
        'piano.mp3',
        'soothing-fire.mp3',
        'bonfire.mp3',
        'ocean-waves.mp3',
        'beach-waves.mp3',
        'gentle-wind.mp3',
        'rain.mp3',
        'birds.mp3',
        'stream.mp3',
        'stream-gentle.mp3',
      ],
      manifest: {
        name: 'The Most Important Hour',
        short_name: 'Most Important',
        description: 'Notice what is good. Every day.',
        theme_color: '#2B3E6B',
        background_color: '#F5EFE0',
        display: 'standalone',
        orientation: 'portrait',
        icons: [{ src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }],
      },
      workbox: {
        // Precache all built assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3}'],
        // Don't let the service worker skip waiting — avoids iOS reload loop
        skipWaiting: false,
        clientsClaim: true,
        runtimeCaching: [
          // Google Fonts stylesheet
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 31536000 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Google Fonts files
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 31536000 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Everything else on our own domain — serve from cache, fall back to network
          {
            urlPattern: /^https:\/\/most-important-app\.web\.app\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'app-shell',
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    outDir: 'dist',
    rollupOptions: { output: { manualChunks: undefined } },
  },
})

