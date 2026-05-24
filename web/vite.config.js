import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@api':        resolve(__dirname, 'src/api'),
      '@store':      resolve(__dirname, 'src/store'),
      '@hooks':      resolve(__dirname, 'src/hooks'),
      '@pages':      resolve(__dirname, 'src/pages'),
      '@components': resolve(__dirname, 'src/components'),
      '@styles':     resolve(__dirname, 'src/styles'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target:      'http://localhost:4000',
        changeOrigin: true,
      },
      '/socket.io': {
        target:    'http://localhost:4000',
        ws:        true,
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          redux:  ['@reduxjs/toolkit', 'react-redux'],
        },
      },
    },
  },
});
