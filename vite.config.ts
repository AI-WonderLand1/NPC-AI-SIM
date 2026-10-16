import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('.', import.meta.url)),
      },
    },
    build: {
      outDir: 'dist/client',
      assetsDir: 'assets',
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: { '/api': { target: 'http://localhost:' + (process.env.NPC_API_PORT || 3000), changeOrigin: true } },
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});