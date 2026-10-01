// Palier 3 : « ça matche ». Suggestions d'annonces calculées à partir de ce que je propose, de ce que je
// cherche et de mes compétences validées (issues du CV). Simple, explicable, testé : chaque suggestion
// dit POURQUOI elle est proposée.
import { CATEGORIES, type Categorie, type TypeAnnonce } from "@/lib/annonces/validation";

export type AnnonceCandidate = { id: string; type: TypeAnnonce; categorie: Categorie; titre: string; description: string };
export type Moi = { competences: string[]; categoriesProposees: Categorie[]; categoriesCherchees: Categorie[] };

function normaliser(texte: string) {
  return texte.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function contientMot(texte: string, mot: string) {
  const m = normaliser(mot).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${m}([^a-z0-9]|$)`).test(texte);
}

export function suggerer<A extends AnnonceCandidate>(moi: Moi, annonces: A[], max = 3) {
  return annonces
    .map((annonce) => {
      const texte = normaliser(`${annonce.titre} ${annonce.description}`);
      let score = 0;
      let raison = "";

      if (annonce.type === "cherche" && moi.categoriesProposees.includes(annonce.categorie)) {
        score += 3;
        raison = `Tu proposes déjà : ${CATEGORIES[annonce.categorie]}`;
      }
      if (annonce.type === "propose" && moi.categoriesCherchees.includes(annonce.categorie)) {
        score += 3;
        raison = `Répond à ce que tu cherches : ${CATEGORIES[annonce.categorie]}`;
      }
      if (annonce.type === "cherche") {
        const competences = moi.competences.filter((c) => c.trim().length >= 2 && contientMot(texte, c)).slice(0, 2);
        if (competences.length) {
          score += 2 * competences.length;
          raison = `Correspond à ta compétence « ${competences[0]} »`;
        }
      }
      return { annonce, score, raison };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max);
}
