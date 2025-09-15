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
      includeAssets: ["favicon.png", "robots.txt", "apple-touch-icon.png"],
      manifest: {
        name: "R-Trade",
        short_name: "R-Trade",
        description: "Trading app",
        theme_color: "#000000",
        background_color: "#000000",
        start_url: "/",
        scope: "/",
        icons: [
          {src: "pwa-192x192.png", sizes: "192x192", type: "image/png"},
          {src: "pwa-512x512.png", sizes: "512x512", type: "image/png"}
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
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
  }
});
