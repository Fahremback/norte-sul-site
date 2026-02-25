
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permite que o servidor seja acessado externamente
    port: 5173, // Matches the port in the screenshot
    proxy: {
      // Proxy API requests to the backend
      '/api': {
        target: 'https://localhost:8443', // Your backend server URL
        changeOrigin: true, // Recommended for virtual hosted sites
        secure: false, // Allow self-signed certificates for local development
      },
      // Add proxy for image uploads
      '/uploads': {
        target: 'https://localhost:8443',
        changeOrigin: true,
        secure: false, // Allow self-signed certificates for local development
      }
    }
  }
})
