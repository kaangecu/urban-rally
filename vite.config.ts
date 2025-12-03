import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl() // Enable HTTPS for local development - creates self-signed certificate
  ],
  server: {
    host: true,  // Allow network access (0.0.0.0)
  }
})
