import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    coverage: {
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/main.jsx',
        'src/setupTests.js',
        'src/views/ComponentsDemo.jsx',
        'src/views/LlmSettingsReference.jsx',
        'src/lib/**',
        'src/components/ui/**/*.{js,jsx}'
      ],
      reporter: ['text', 'json-summary', 'html']
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
})
