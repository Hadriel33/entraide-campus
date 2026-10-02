import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Même alias que tsconfig.json : @/ = src/
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    // Les modèles des skills sont de la documentation, pas des tests du projet ;
    // e2e/ contient les parcours Playwright (npm run e2e), lancés à part.
    exclude: ["**/node_modules/**", ".claude/**", "e2e/**"],
  },
});
