import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom domain (davidmgray.com via CNAME) serves from root, so base is '/'.
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 0, // keep the glb as a real file, never inlined
  },
})
