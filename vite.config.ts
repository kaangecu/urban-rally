import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl() // Enable HTTPS for local development
  ],
  server: {
    https: true, // Enable HTTPS
    host: true,  // Allow network access
  }
})
