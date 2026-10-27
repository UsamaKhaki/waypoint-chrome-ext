import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function removeCrossOrigin(): Plugin {
  return {
    name: 'remove-crossorigin',
    transformIndexHtml(html) {
      return html.replace(/ crossorigin="?[^"]*"?/g, '').replace(/ crossorigin/g, '');
    },
  };
}

export default defineConfig({
  plugins: [react(), removeCrossOrigin()],
  base: '',
  server: { port: 6301, strictPort: true },
  preview: { port: 6301, strictPort: true },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    outDir: 'dist',
    modulePreload: { polyfill: false },
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'index.html'),
        palette: path.resolve(__dirname, 'palette.html'),
        background: path.resolve(__dirname, 'src/background.ts'),
        content: path.resolve(__dirname, 'src/content.ts'),
      },
      output: {
        entryFileNames: (chunk) => {
          if (['background', 'content'].includes(chunk.name)) return '[name].js';
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        manualChunks: (id) => {
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('lucide-react') || id.includes('@dnd-kit')) return 'vendor-ui';
        },
      },
    },
  },
});
