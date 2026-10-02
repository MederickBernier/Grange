/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      // Stable, readable class names so app teams can debug, and themes can target them if they must.
      generateScopedName: 'grange-[local]-[hash:base64:4]',
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
      },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'motion',
        /^motion\//,
        'react-aria',
        /^@react-aria\//,
        'react-stately',
        /^@react-stately\//,
        '@internationalized/date',
        /^@internationalized\//,
      ],
    },
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
