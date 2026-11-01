import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@tests": fileURLToPath(new URL("./tests", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    maxWorkers: 1,
    include: ["src/**/*.test.tsx"],
    setupFiles: ["./tests/component/setup.js"],
    clearMocks: true,
  },
});
