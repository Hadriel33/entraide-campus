import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Les modèles des skills sont de la documentation, pas des tests du projet.
    exclude: ["**/node_modules/**", ".claude/**"],
  },
});
