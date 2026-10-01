import path from "node:path";
import { defineConfig } from "vitest/config";

// Mesures des IA (npm run eval:ia) : appellent vraiment le modèle, donc hors de la CI.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: { include: ["ia-eval/**/*.eval.ts"] },
});
