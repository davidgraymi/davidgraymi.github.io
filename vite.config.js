import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/interactive/main.js'),
      name: 'Interactive',
      fileName: (format) => `interactive.js`,
      formats: ['es']
    },
    outDir: 'static/js',
    emptyOutDir: false,
  },
  define: {
    'process.env': {}
  }
})
