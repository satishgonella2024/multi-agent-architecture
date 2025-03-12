import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import type { Plugin } from 'vite';

// Custom plugin to handle client-side routing
const reactRouterPlugin = (): Plugin => ({
  name: 'react-router',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (!req.url?.includes('.')) {
        req.url = '/';
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [react(), reactRouterPlugin()],
  base: '/',
  server: {
    port: 8082,
    proxy: {
      '/api': {
        target: 'http://192.168.5.199:8000',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://192.168.5.199:8000',
        ws: true,
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  build: {
    sourcemap: true
  }
}); 