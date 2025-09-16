import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import {VitePWA} from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: [
        "favicon.png",
        "mask-icon.png",
        "robots.txt",
        "apple-touch-icon.png"
      ],
      manifest: {
        name: "RM-Trade",
        short_name: "RM-Trade",
        description: "RM trading app",
        theme_color: "#000000",
        background_color: "#000000",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {src: "pwa-64x64.png", sizes: "64x64", type: "image/png"},
          {src: "pwa-192x192.png", sizes: "192x192", type: "image/png"},
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "mask-icon.png",
            sizes: "1024x1024",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      },
      devOptions: {
        enabled: true,
        disableDevLogs: true // hide warnings in dev
      }
    })
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  server: {
    proxy: {
      "/.netlify/functions": "http://localhost:8888"
    }
  },
  build: {
    sourcemap: false
  }
});
