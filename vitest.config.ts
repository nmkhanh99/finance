import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    // Test công thức (.test.ts, môi trường node) + test UI (.test.tsx, khai báo
    // `// @vitest-environment jsdom` ở đầu file).
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "node",
    setupFiles: ["src/test/setup.ts"],
  },
});
