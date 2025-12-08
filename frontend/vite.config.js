
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath } from "url";

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// https://vite.dev/config/
export default defineConfig({
   plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true, 
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "soupy-phagolytic-porsche.ngrok-free.dev", 
    ],
    cors: true,
  },
})
