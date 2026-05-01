import { defineConfig } from "vitest/config";

export default defineConfig({
  // Allows deploying under a subpath (e.g. GitHub Pages).
  // For root-domain deploys (Vercel/Netlify/etc.), this defaults to "/".
  base: process.env.BASE_PATH ?? "/",
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
