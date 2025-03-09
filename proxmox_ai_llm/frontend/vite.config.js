import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 8082,
    proxy: {
      '/api': {
        target: 'http://192.168.5.199:8000',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://192.168.5.199:8000',
        ws: true
      }
    }
  }
});
