// Palier 3 : « ça matche ». Suggestions d'annonces calculées à partir de ce que je propose, de ce que je
// cherche et de mes compétences validées (issues du CV). Simple, explicable, testé : chaque suggestion
// dit POURQUOI elle est proposée.
import {
  CATEGORIES,
  type Categorie,
  type TypeAnnonce,
} from "@/lib/annonces/validation";

export type AnnonceCandidate = {
  id: string;
  type: TypeAnnonce;
  categorie: Categorie;
  titre: string;
  description: string;
};
export type Moi = {
  competences: string[];
  categoriesProposees: Categorie[];
  categoriesCherchees: Categorie[];
};

function normaliser(texte: string) {
  return texte.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function contientMot(texte: string, mot: string) {
  const m = normaliser(mot).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${m}([^a-z0-9]|$)`).test(texte);
}

// Mots trop vagues pour relier une compétence à un post-it (« Project Management » ne doit pas tout ramener).
const MOTS_VAGUES = new Set(["page", "pages", "projet", "projets", "project", "management", "strategy", "strategie", "digital", "media", "gestion", "niveau", "outils"]);

// Une compétence en plusieurs mots : ses mots forts (5 lettres ou plus, pas vagues).
function motsForts(competence: string) {
  const mots = normaliser(competence).split(/[^a-z0-9]+/).filter(Boolean);
  return mots.length < 2 ? [] : mots.filter((m) => m.length >= 5 && !MOTS_VAGUES.has(m));
}

// Le domaine d'une compétence : « SEO » ou « Content Marketing » relèvent de la rédaction et des réseaux,
// « Python » ou « Analytics » de la data. Lexique court et explicable (l'IA n°3 fait le reste à la demande).
const DOMAINES: [Categorie, string[]][] = [
  ["data_ia", ["python", "sql", "excel", "power bi", "analytics", "data", "machine learning", "statistique", "statistiques", "ia"]],
  ["redaction", ["seo", "content", "contenu", "redaction", "copywriting", "social media", "community", "linkedin", "marketing", "ads", "newsletter"]],
  ["design", ["photoshop", "illustrator", "indesign", "canva", "logo", "branding", "graphisme", "identite visuelle", "typographie"]],
  ["ux_ui", ["figma", "ux", "ui", "landing page", "maquette", "prototype", "wireframe"]],
  ["dev", ["javascript", "typescript", "react", "next.js", "nextjs", "node", "webflow", "wordpress", "html", "css", "php", "vibe coding", "developpement"]],
  ["video", ["premiere", "after effects", "montage", "video", "davinci", "motion"]],
  ["photo", ["photographie", "photo", "lightroom", "retouche", "photoshop"]],
];
function domainesDe(competences: string[]) {
  const trouves = new Set<Categorie>();
  for (const c of competences) for (const [categorie, cles] of DOMAINES) if (cles.some((k) => contientMot(normaliser(c), k))) trouves.add(categorie);
  return trouves;
}

// Chaque annonce reçoit un score et TOUTES ses raisons (la plus forte en premier, dans « raison »).
export function suggerer<A extends AnnonceCandidate>(
  moi: Moi,
  annonces: A[],
  max = 3,
) {
  const domaines = domainesDe(moi.competences);
  return annonces
    .map((annonce) => {
      const texte = normaliser(`${annonce.titre} ${annonce.description}`);
      let score = 0;
      const raisons: string[] = [];

      if (annonce.type === "cherche") {
        const competences = moi.competences
          .filter((c) => c.trim().length >= 2 && contientMot(texte, c))
          .slice(0, 2);
        if (competences.length) {
          score += 2 * competences.length;
          raisons.push(`Correspond à ta compétence « ${competences[0]} »`);
        }
        // Un mot fort d'une compétence (« landing » pour « Landing Page Design ») : lien plus faible.
        const proche = moi.competences.find((c) => !competences.includes(c) && motsForts(c).some((m) => contientMot(texte, m)));
        if (proche) {
          score += 1;
          raisons.push(`Proche de ta compétence « ${proche} »`);
        }
        // Un post-it « Je cherche » dans le domaine de mes compétences, s'il n'est pas déjà relié plus précisément.
        if (domaines.has(annonce.categorie) && !competences.length && !moi.categoriesProposees.includes(annonce.categorie)) {
          score += 1;
          raisons.push(`Dans ton domaine : ${CATEGORIES[annonce.categorie]}`);
        }
      }
      if (
        annonce.type === "cherche" &&
        moi.categoriesProposees.includes(annonce.categorie)
      ) {
        score += 3;
        raisons.push(`Tu proposes déjà : ${CATEGORIES[annonce.categorie]}`);
      }
      if (
        annonce.type === "propose" &&
        moi.categoriesCherchees.includes(annonce.categorie)
      ) {
        score += 3;
        raisons.push(
          `Répond à ce que tu cherches : ${CATEGORIES[annonce.categorie]}`,
        );
      }
      return { annonce, score, raison: raisons[0] ?? "", raisons };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    // Deux post-its au même titre (deux auteurs) : on n'en garde qu'un, sinon « Pour toi » bégaie.
    .filter((s, i, liste) => liste.findIndex((x) => normaliser(x.annonce.titre).trim() === normaliser(s.annonce.titre).trim()) === i)
    .slice(0, max);
}

// Un mot simple plutôt qu'un pourcentage inventé.
export function niveauMatch(score: number) {
  return score >= 5
    ? "Très bon match"
    : score >= 3
      ? "Bon match"
      : "Peut t'intéresser";
}
