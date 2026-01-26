import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import markdownDataPlugin from './vite-plugin-markdown-data.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    markdownDataPlugin({
      contentDir: 'content',
      outputFile: 'src/data/questions.json'
    })
  ],
  base: '/anchor-code/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          // Split react-syntax-highlighter into a separate chunk
          'syntax-highlighter': ['react-syntax-highlighter'],
          // Split react-markdown into a separate chunk
          'markdown': ['react-markdown'],
        }
      }
    }
  }
})
