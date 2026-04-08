import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Added this
    allowedHosts: ['aatmabodha1.onrender.com']
  },
  preview: {
    host: true, // Added this
    allowedHosts: ['aatmabodha1.onrender.com']
  }
})