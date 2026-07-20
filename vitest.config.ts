import { fileURLToPath } from "node:url"
import { loadEnvFile } from "node:process"
import { defineConfig } from "vitest/config"

try {
  loadEnvFile(".env")
} catch {
  // Unit tests can still run without a local environment file.
}

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    exclude: ["tests/business-api.integration.test.ts", "node_modules/**"],
    deps: {
      interopDefault: true,
    },
  },
})
