import { SAISIE } from "@/components/ui/saisie";

import type { Metadata } from "next";
import { exigerSession } from "@/lib/session";
import type { Stats } from "@/lib/gamification/progression";
import { Avatar } from "@/components/ui/avatar";
import { coletteParDefaut } from "@/components/colette/colette";
import { BadgeCampus } from "@/components/ui/badge";
import { BoutonLien } from "@/components/ui/bouton";
import { TitrePage } from "@/components/ui/titre-page";
import { Section, Sommaire } from "@/components/ui/section";
import { lireEtatAccueil } from "@/lib/profils/etat-accueil";
import { FormulaireCoordonnees, FormulaireIdentite, FormulairePhoto } from "./formulaires";
import { AssistantCompetences } from "./assistant-competences";
import { TenueGagnee } from "@/components/colette/tenue-gagnee";
import { piecesGagnees } from "@/lib/colette/recompenses";
import { AtelierColette } from "./atelier-colette";
import { ChoixClasse } from "./choix-classe";
import { choisirClasse, proposerClasse, retirerPhoto } from "./actions";
import { Bouton } from "@/components/ui/bouton";
import Link from "next/link";
import { ETAPES_PROFIL, etapeSuivante } from "@/lib/profils/accueil";

export const metadata: Metadata = { title: "Mon profil" };

// Mon profil, en étapes numérotées (retours de test des 19 et 26/11) : ma tête (Colette ou photo, au choix),
// compétences, coordonnées, classe. Chaque étape mène à la suivante, la dernière au premier post-it.
// Tout s'enregistre automatiquement. Confidentialité, apparence et compte restent dans Réglages.

function Suivante({ id }: { id: string }) {
  const s = etapeSuivante(id);
  if (!s) return null;
  return (
    <Link href={s.href} className="presse mt-2 self-end rounded-ui border-2 border-encre bg-surface px-4 py-2 text-sm font-semibold hover:bg-bandeau">
      {s.label} →
    </Link>
  );
}
export default async function PageCompte({ searchParams }: PageProps<"/compte">) {
  const { supabase, user, profil } = await exigerSession();
  const { erreur } = await searchParams;
  const [{ data: stats }, { data: classes }, etatAccueil, { data: coordonnees }] = await Promise.all([
    supabase.rpc("stats_profil", { cible: user.id }),
    supabase.from("classes").select("id, nom, validee").eq("campus", profil.campus).order("nom"),
    lireEtatAccueil(supabase, profil),
    supabase.from("coordonnees").select("telephone, email, reseau").eq("id", user.id).maybeSingle(),
  ]);
  // Les étapes et leur état (coche quand c'est fait).
  const faite: Record<string, boolean> = {
    tete: etatAccueil.avatar || etatAccueil.colette,
    competences: (profil.competences?.length ?? 0) > 0,
    coordonnees: etatAccueil.coordonnees,
    classe: !!profil.classe_id,
  };
  const etapes = ETAPES_PROFIL.map((e) => ({ ...e, fait: faite[e.id] }));
  const titreEtape = (id: string) => {
    const i = etapes.findIndex((e) => e.id === id);
    return `${i + 1}. ${etapes[i].titre}${etapes[i].fait ? "  ✓" : ""}`;
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <TenueGagnee
        moi={user.id}
        pieces={piecesGagnees((stats as Stats | null) ?? null)}
        couleur={profil.colette_couleur || coletteParDefaut(profil.pseudo).couleur}
        humeur={profil.colette_humeur}
        accessoire={profil.colette_accessoire}
        motif={profil.colette_motif}
      />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <TitrePage
          accroche={
            <span className="flex flex-wrap items-center gap-2">
              @{profil.pseudo} <BadgeCampus campus={profil.campus} /> {user.email}
            </span>
          }
        >
          Mon profil
        </TitrePage>
        <div className="flex flex-wrap gap-2">
          <BoutonLien href={`/profils/${profil.pseudo}`} variante="contour">
            Voir mon profil public
          </BoutonLien>
          <BoutonLien href="/reglages" variante="contour">
            Réglages
          </BoutonLien>
        </div>
      </div>
      {/* Les étapes du profil : ce sommaire numéroté (coché quand c'est fait) remplace l'ancienne liste « Bien démarrer »,
          qui faisait doublon ici avec une fin différente. Le parcours complet reste sur Bienvenue et le bureau. */}
      <Sommaire liens={etapes.map((e, i) => ({ href: `#${e.id}`, label: `${i + 1}. ${e.titre}${e.fait ? " ✓" : ""}` }))} />

      <Section
        id="tete"
        titre={titreEtape("tete")}
        aide="Ta Colette ou une photo, au choix : c'est ce que les autres voient sur ton profil, tes post-its et tes messages."
      >
        {(erreur === "verrouille" || erreur === "colette" || erreur === "photo") && (
          <p role="alert" className="rounded-ui border border-alerte bg-surface px-4 py-3 text-sm font-semibold text-alerte">
            {erreur === "verrouille"
              ? "Cette pièce n'est pas encore débloquée : ta Colette n'a pas changé. Le cadenas te dit comment la gagner."
              : erreur === "colette"
                ? "Ce choix n'existe pas : ta Colette n'a pas changé."
                : "La photo n'a pas pu être retirée. Réessaie."}
          </p>
        )}
        <div id="colette" className="flex scroll-mt-6 flex-col gap-3">
          <h3 className="font-semibold">
            Ta Colette{" "}
            <span className="font-normal text-encre-douce">
              {profil.avatar_chemin ? "(elle apparaît sur tes badges et au classement ; ta photo passe devant)" : "(c'est elle qui te représente partout)"}
            </span>
          </h3>
          <AtelierColette
            couleur={profil.colette_couleur || coletteParDefaut(profil.pseudo).couleur}
            humeur={profil.colette_humeur}
            accessoire={profil.colette_accessoire}
            motif={profil.colette_motif}
            stats={(stats as Stats | null) ?? null}
          />
        </div>
        <div className="flex flex-col gap-3 border-t border-ligne pt-4">
          <h3 className="font-semibold">
            Plutôt une photo ? <span className="font-normal text-encre-douce">(facultatif)</span>
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <FormulairePhoto apercu={<Avatar chemin={profil.avatar_chemin} nom={profil.pseudo} taille="xl" colette={profil} />} />
            {profil.avatar_chemin && (
              <form action={retirerPhoto}>
                <Bouton variante="contour">Retirer ma photo, garder ma Colette</Bouton>
              </form>
            )}
          </div>
        </div>
        <div className="border-t border-ligne pt-4">
          <FormulaireIdentite pseudo={profil.pseudo} prenom={profil.prenom} bio={profil.bio ?? ""} />
        </div>
        <Suivante id="tete" />
      </Section>

      <Section
        id="competences"
        titre={titreEtape("competences")}
        aide="Ce que tu peux proposer aux autres. Dépose ton CV : l'IA te fait des propositions, tu gardes ce qui est juste."
      >
        <AssistantCompetences actuelles={profil.competences ?? []} />
        <Suivante id="competences" />
      </Section>

      <Section
        id="coordonnees"
        titre={titreEtape("coordonnees")}
        aide="Cachées par défaut. Seules les personnes dont tu acceptes la demande (ou qui acceptent la tienne) peuvent les voir."
      >
        <FormulaireCoordonnees telephone={coordonnees?.telephone ?? ""} email={coordonnees?.email ?? ""} reseau={coordonnees?.reseau ?? ""} />
        <Suivante id="coordonnees" />
      </Section>

      <Section id="classe" titre={titreEtape("classe")} aide="Facultatif. Chaque coup de main que tu donnes fait monter ta classe au classement.">
        {classes && classes.length > 0 ? (
          <form action={choisirClasse} className="flex flex-wrap items-end gap-2">
            <label className="flex min-w-60 flex-1 flex-col gap-1.5 text-sm font-semibold">
              Classe (campus de {profil.campus})
              <ChoixClasse defaut={profil.classe_id ?? ""}>
                <option value="">Pas de classe</option>
                {[
                  { titre: "Bachelor", filtre: (n: string) => n.startsWith("B") },
                  { titre: "Mastère", filtre: (n: string) => n.startsWith("M") },
                  { titre: "Autres", filtre: (n: string) => !n.startsWith("B") && !n.startsWith("M") },
                ].map((g) => {
                  const liste = classes.filter((c) => g.filtre(c.nom));
                  return liste.length ? (
                    <optgroup key={g.titre} label={g.titre}>
                      {liste.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nom}
                          {!c.validee ? " (en attente de validation)" : ""}
                        </option>
                      ))}
                    </optgroup>
                  ) : null;
                })}
              </ChoixClasse>
            </label>
          </form>
        ) : (
          <p className="font-main text-lg text-encre-douce">Les classes de ton campus n&apos;ont pas encore été ajoutées : propose la tienne.</p>
        )}
        <details className="group/proposer">
          <summary className="w-fit cursor-pointer list-none text-sm font-semibold text-encre-douce hover:text-encre [&::-webkit-details-marker]:hidden">
            Ma classe n&apos;est pas dans la liste
          </summary>
          <form action={proposerClasse} className="mt-3 flex flex-wrap items-end gap-2">
            <label className="flex min-w-60 flex-1 flex-col gap-1.5 text-sm font-semibold">
              Nom de ta classe
              <input name="nom" required minLength={2} maxLength={60} placeholder="Ex. : M1 Data Marketing & IA" className={SAISIE} />
            </label>
            <Bouton variante="contour">Proposer</Bouton>
          </form>
          <p className="mt-2 text-xs text-encre-douce">Tu la rejoins tout de suite ; elle compte au classement dès qu&apos;un admin l&apos;a validée.</p>
        </details>
        <Suivante id="classe" />
      </Section>

    </div>
  );
}
