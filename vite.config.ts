import { defineConfig } from 'vite';

// Relative base so the build runs from any folder (Firebase Hosting or a preview page).
// Art is inlined into the bundle so the game is one page plus one script.
export default defineConfig({
  base: './',
  build: { assetsInlineLimit: 1024 * 1024, chunkSizeWarningLimit: 4000, target: 'es2022' },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
} as any);
