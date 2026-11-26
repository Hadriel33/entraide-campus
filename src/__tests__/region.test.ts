// Vitesse (retour de test « c'est long les chargements ») : les traces du robot montraient les fonctions Vercel
// à Washington (iad1) alors que la base Supabase est en Irlande (eu-west-1, JOURNAL du 01/10). Chaque requête
// à la base traversait l'Atlantique, plusieurs fois par page. Les fonctions tournent à Dublin, à côté de la base.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("région des fonctions", () => {
  it("Vercel exécute le serveur à Dublin, à côté de Supabase eu-west-1", () => {
    const config = JSON.parse(readFileSync(path.resolve(__dirname, "../../vercel.json"), "utf8"));
    expect(config.regions).toEqual(["dub1"]);
  });
});
