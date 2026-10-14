import { defineConfig } from "vitest/config";

// Kept separate from vite.config.js on purpose: that file copies a local .env
// into process.env for the dev API middleware, and tests must never pick up
// real API keys or reach the network.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"]
  }
});
