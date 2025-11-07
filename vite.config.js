import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'public/icons',
          dest: ''
        },
        {
          src: 'public/screenshots',
          dest: ''
        },
        {
          src: 'public/manifest.json',
          dest: ''
        },
        {
          src: 'public/sw.js',
          dest: ''
        }
      ]
    })
  ],
  test: {
    environment: 'jsdom'
  }
})