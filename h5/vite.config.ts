import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// base './' so the static build works from any sub-directory (BaoTa site root or /h5_new/)
export default defineConfig({ base: './', plugins: [vue()], build: { outDir: 'dist', chunkSizeWarningLimit: 800 } })
