import { describe, expect, it } from "vitest";
import { classerClasses } from "@/lib/gamification/classes";

const classes = [
  { id: "a", nom: "M1 Data", ecole: "ESD" },
  { id: "b", nom: "B3 Créa", ecole: "ESP" },
  { id: "c", nom: "B1 Web", ecole: "ESD" },
];

describe("classement des classes", () => {
  it("classe à la moyenne des membres actifs : une petite classe peut battre une grosse", () => {
    const r = classerClasses(classes, [
      { classe_id: "a", points: 10 },
      { classe_id: "a", points: 10 },
      { classe_id: "a", points: 10 },
      { classe_id: "b", points: 40 },
    ]);
    expect(r.map((c) => c.id)).toEqual(["b", "a"]);
    expect(r[1]).toMatchObject({ score: 10, total: 30, actifs: 3 });
  });
  it("les inactifs ne font pas baisser la moyenne, et une classe sans actif n'apparaît pas", () => {
    const r = classerClasses(classes, [
      { classe_id: "a", points: 20 },
      { classe_id: "a", points: 0 },
      { classe_id: "c", points: 0 },
      { classe_id: null, points: 99 },
    ]);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ id: "a", score: 20, membres: 2, actifs: 1 });
  });
});
