import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Desarrollo: la API pasa por el gateway Traefik del docker-compose
  server: {
    proxy: {
      "/api": { target: "http://127.0.0.1:80", changeOrigin: true },
    },
  },
  preview: {
    proxy: {
      "/api": { target: "http://127.0.0.1:80", changeOrigin: true },
    },
  },
});
