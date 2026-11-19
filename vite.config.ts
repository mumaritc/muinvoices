import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { appShell } from './scripts/app-shell.ts'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), appShell()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { include: ['src/**/*.test.{ts,tsx}'], environment: 'jsdom' },
})
