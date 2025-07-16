import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      name: 'world_schema',
      fileName: 'index',
    },
    outDir: resolve(__dirname, 'dist'),
  },
  resolve: { alias: { src: resolve('src/') } },
  plugins: [dts()],
});
