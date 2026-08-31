import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// GitHub Pages uses 404.html as the SPA fallback so client-side
// routes like /login and /admin load correctly.
function spaFallback(): Plugin {
  return {
    name: 'spa-fallback-404',
    apply: 'build',
    closeBundle() {
      const outDir = resolve(__dirname, 'dist')
      const indexPath = resolve(outDir, 'index.html')
      if (existsSync(indexPath)) {
        writeFileSync(resolve(outDir, '404.html'), readFileSync(indexPath))
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), spaFallback()],
})
