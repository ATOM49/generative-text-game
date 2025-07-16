import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { js },
    extends: ['js/recommended'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: { globals: globals.browser },
  },
  tseslint.configs.recommended,
  // Next.js app config
  {
    files: ['apps/worldbuilder/src/**/*.{js,ts,tsx}'],
    extends: ['next/core-web-vitals'],
  },
  // Fastify app config
  {
    files: ['apps/watcher/src/**/*.{js,ts}'],
    extends: ['plugin:node/recommended'],
  },
  {
    // Note: there should be no other properties in this object
    ignores: [
      'coverage',
      '**/public',
      '**/dist',
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
    ],
  },
  eslintPluginPrettierRecommended,
]);
