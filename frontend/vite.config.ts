import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({ 
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        short_name: "RouteMaster",
        name: "RouteMaster AI Logistics",
        icons: [
          {
            src: "mascot.jpg",
            sizes: "192x192",
            type: "image/jpeg"
          },
          {
            src: "mascot.jpg",
            sizes: "512x512",
            type: "image/jpeg"
          }
        ],
        start_url: "/",
        display: "standalone",
        theme_color: "#4f46e5",
        background_color: "#0f172a"
      }
    })
  ],
})
