import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@hub-1': path.resolve(__dirname, './src/hub-1-sator'),
      '@hub-2': path.resolve(__dirname, './src/hub-2-rotas'),
      '@hub-3': path.resolve(__dirname, './src/hub-3-arepo'),
      '@hub-4': path.resolve(__dirname, './src/hub-4-opera'),
      '@hub-5': path.resolve(__dirname, './src/hub-5-tenet')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: true,
    exclude: ['node_modules/', 'e2e/'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        'e2e/',
        '**/*.config.{js,ts}',
      ],
    },
  },
})
