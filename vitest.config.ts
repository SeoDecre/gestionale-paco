import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

// Test SOLO sulla logica pura (§ testing del piano): target banding, zona,
// slot/overlap, parser. Ambiente 'node': niente DOM, niente test di componenti.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
