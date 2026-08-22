import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Test configuration.
 *
 * The application had no automated tests at all — 141k lines, real client money and real
 * statutory filings, and nothing verifying any of it. These tests deliberately start with the
 * calculations and guardrails where a silent error is most expensive: PAYE/UIF/SDL, VAT,
 * discounts, order-state transitions and the AI document entity resolution.
 *
 * Node environment only — these are pure-logic tests with no DOM. Component and E2E coverage is
 * a separate, larger piece of work.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Firestore/Genkit-dependent modules are excluded; they need the emulator, which
    // `npm run test:rules` already covers.
    exclude: ['node_modules/**', '.next/**', 'scratch/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
