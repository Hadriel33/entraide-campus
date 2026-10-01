import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Même alias que tsconfig.json : @/ = src/
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    // Les modèles des skills sont de la documentation, pas des tests du projet.
    exclude: ["**/node_modules/**", ".claude/**"],
  },
});
