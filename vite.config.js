import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import markdownDataPlugin from './vite-plugin-markdown-data.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    markdownDataPlugin({
      contentDir: 'content',
      publicDataDir: 'public/data'
    })
  ],
  base: '/anchor-code/',
  build: {
    outDir: 'dist'
  }
})
