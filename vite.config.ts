import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ВАЖНО: Замените 'dada-spiel' на точное название вашего репозитория на GitHub!
export default defineConfig({
  plugins: [react()],
  base: '/dadaspiel/', 
})