// « Pour moi » ne doit jamais devenir vide parce que Colette (IA n°3) n'a rien trouvé de « pertinent » :
// le tri par règles reste affiché (retour de test : « le filtre Pour moi ne remonte rien »).
import { describe, expect, it } from "vitest";
import { classerAvecColette } from "@/lib/matching/colette-tri";

const lot = [{ id: "a" }, { id: "b" }, { id: "c" }];

describe("tri « Pour moi » avec Colette", () => {
  it("garde les post-its notés 2 ou 3, les meilleurs d'abord, à égalité selon les règles", () => {
    const ia = new Map([
      ["a", { pertinence: 2, raison: "proche" }],
      ["b", { pertinence: 3, raison: "parfait" }],
      ["c", { pertinence: 2, raison: "proche aussi" }],
    ]);
    const regles = new Map([["a", 1], ["c", 5]]);
    expect(classerAvecColette(lot, ia, regles)?.map((x) => x.annonce.id)).toEqual(["b", "c", "a"]);
  });
  it("renvoie null quand Colette ne retient rien : on garde alors le tri par règles", () => {
    const ia = new Map([["a", { pertinence: 1, raison: "" }]]);
    expect(classerAvecColette(lot, ia, new Map())).toBeNull();
  });
});
