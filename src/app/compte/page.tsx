import type { Metadata } from "next";
import { exigerSession } from "@/lib/session";
import type { Stats } from "@/lib/gamification/progression";
import { Avatar } from "@/components/ui/avatar";
import { BadgeCampus } from "@/components/ui/badge";
import { BoutonLien } from "@/components/ui/bouton";
import { TitrePage } from "@/components/ui/titre-page";
import { Section, Sommaire } from "@/components/ui/section";
import { ChecklistAccueil } from "@/components/profil/checklist-accueil";
import { lireEtatAccueil } from "@/lib/profils/etat-accueil";
import { FormulaireCoordonnees, FormulaireIdentite, FormulairePhoto } from "./formulaires";
import { AssistantCompetences } from "./assistant-competences";
import { TenueGagnee } from "@/components/colette/tenue-gagnee";
import { piecesGagnees } from "@/lib/colette/recompenses";
import { AtelierColette } from "./atelier-colette";
import { ChoixClasse } from "./choix-classe";
import { choisirClasse, proposerClasse } from "./actions";
import { Bouton } from "@/components/ui/bouton";

export const metadata: Metadata = { title: "Mon profil" };

// Mon profil, en étapes numérotées (retour de test du 19/11) : qui je suis, compétences, coordonnées, Colette, classe.
// Tout s'enregistre automatiquement. Confidentialité, apparence et compte restent dans Réglages.
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
  const etapes = [
    { id: "photo", titre: "Qui je suis", fait: !!profil.avatar_chemin },
    { id: "competences", titre: "Mes compétences", fait: (profil.competences?.length ?? 0) > 0 },
    { id: "coordonnees", titre: "Mes coordonnées", fait: etatAccueil.coordonnees },
    { id: "colette", titre: "Ma Colette", fait: true },
    { id: "classe", titre: "Ma classe", fait: !!profil.classe_id },
  ];
  const titreEtape = (id: string) => {
    const i = etapes.findIndex((e) => e.id === id);
    return `${i + 1}. ${etapes[i].titre}${etapes[i].fait ? "  ✓" : ""}`;
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <TenueGagnee
        moi={user.id}
        pieces={piecesGagnees((stats as Stats | null) ?? null)}
        couleur={profil.colette_couleur}
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
      {/* « Bien démarrer » : les étapes du profil, ici et plus sur le tableau. Disparaît quand tout est fait. */}
      <ChecklistAccueil etat={etatAccueil} />
      <Sommaire liens={etapes.map((e, i) => ({ href: `#${e.id}`, label: `${i + 1}. ${e.titre}${e.fait ? " ✓" : ""}` }))} />

      <Section id="photo" titre={titreEtape("photo")} aide="Ce que les autres étudiants voient sur ton profil et tes post-its.">
        <FormulairePhoto apercu={<Avatar chemin={profil.avatar_chemin} nom={profil.pseudo} taille="xl" colette={profil} />} />
        <div className="border-t border-ligne pt-4">
          <FormulaireIdentite pseudo={profil.pseudo} prenom={profil.prenom} bio={profil.bio ?? ""} />
        </div>
      </Section>

      <Section
        id="competences"
        titre={titreEtape("competences")}
        aide="Ce que tu peux proposer aux autres. Dépose ton CV : l'IA te fait des propositions, tu gardes ce qui est juste."
      >
        <AssistantCompetences actuelles={profil.competences ?? []} />
      </Section>

      <Section
        id="coordonnees"
        titre={titreEtape("coordonnees")}
        aide="Cachées par défaut. Seules les personnes dont tu acceptes la demande (ou qui acceptent la tienne) peuvent les voir."
      >
        <FormulaireCoordonnees telephone={coordonnees?.telephone ?? ""} email={coordonnees?.email ?? ""} reseau={coordonnees?.reseau ?? ""} />
      </Section>

      <Section
        id="colette"
        titre={titreEtape("colette")}
        aide={profil.avatar_chemin ? "Ton personnage dans l'appli (badges, classement). Ta photo reste ton avatar principal." : "Pas de photo ? Ta Colette te représente partout dans l'appli."}
      >
        {(erreur === "verrouille" || erreur === "colette") && (
          <p role="alert" className="mb-4 rounded-ui border border-alerte bg-surface px-4 py-3 text-sm font-semibold text-alerte">
            {erreur === "verrouille"
              ? "Cette pièce n'est pas encore débloquée : ta Colette n'a pas changé. Le cadenas te dit comment la gagner."
              : "Ce choix n'existe pas : ta Colette n'a pas changé."}
          </p>
        )}
        <AtelierColette
          couleur={profil.colette_couleur}
          humeur={profil.colette_humeur}
          accessoire={profil.colette_accessoire}
          motif={profil.colette_motif}
          stats={(stats as Stats | null) ?? null}
        />
      </Section>

      <Section id="classe" titre={titreEtape("classe")} aide="Chaque coup de main que tu donnes fait monter ta classe au classement.">
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
              <input name="nom" required minLength={2} maxLength={60} placeholder="Ex. : M1 Data Marketing & IA" className="min-h-11 rounded-ui border border-ligne-forte bg-surface px-3 text-base font-normal" />
            </label>
            <Bouton variante="contour">Proposer</Bouton>
          </form>
          <p className="mt-2 text-xs text-encre-douce">Tu la rejoins tout de suite ; elle compte au classement dès qu&apos;un admin l&apos;a validée.</p>
        </details>
      </Section>

    </div>
  );
}
