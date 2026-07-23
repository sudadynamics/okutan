import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // kullandığın plugin neyse onu bırak

export default defineConfig({
  plugins: [react()],
  base: '/kayit/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})