import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    include: ['engine/**/*.test.ts', 'app/**/*.test.ts'],
    environment: 'node',
    passWithNoTests: false,
  },
})
