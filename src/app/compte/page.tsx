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
import { FormulaireIdentite, FormulairePhoto } from "./formulaires";
import { AssistantCompetences } from "./assistant-competences";
import { AtelierColette } from "./atelier-colette";
import { choisirClasse, proposerClasse } from "./actions";
import { Bouton } from "@/components/ui/bouton";

export const metadata: Metadata = { title: "Mon profil" };

// Mon profil : seulement « qui je suis » (identité, compétences, Colette, classe).
// Coordonnées, confidentialité, apparence et compte sont dans Réglages.
export default async function PageCompte() {
  const { supabase, user, profil } = await exigerSession();
  const [{ data: stats }, { data: classes }, etatAccueil] = await Promise.all([
    supabase.rpc("stats_profil", { cible: user.id }),
    supabase.from("classes").select("id, nom, validee").eq("campus", profil.campus).order("nom"),
    lireEtatAccueil(supabase, profil),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
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
      <Sommaire
        liens={[
          { href: "#photo", label: "Qui je suis" },
          { href: "#competences", label: "Compétences" },
          { href: "#colette", label: "Ma Colette" },
          { href: "#classe", label: "Ma classe" },
        ]}
      />

      <Section id="photo" titre="Qui je suis" aide="Ce que les autres étudiants voient sur ton profil et tes annonces.">
        <FormulairePhoto apercu={<Avatar chemin={profil.avatar_chemin} nom={profil.pseudo} taille="xl" colette={profil} />} />
        <div className="border-t border-ligne pt-4">
          <FormulaireIdentite pseudo={profil.pseudo} prenom={profil.prenom} bio={profil.bio ?? ""} />
        </div>
      </Section>

      <Section
        id="competences"
        titre="Mes compétences"
        aide="Ce que tu peux proposer aux autres. Dépose ton CV : l'IA te fait des propositions, tu gardes ce qui est juste."
      >
        <AssistantCompetences actuelles={profil.competences ?? []} />
      </Section>

      <Section
        id="colette"
        titre="Ma Colette"
        aide={profil.avatar_chemin ? "Ton personnage dans l'appli (badges, classement). Ta photo reste ton avatar principal." : "Pas de photo ? Ta Colette te représente partout dans l'appli."}
      >
        <AtelierColette
          couleur={profil.colette_couleur}
          humeur={profil.colette_humeur}
          accessoire={profil.colette_accessoire}
          motif={profil.colette_motif}
          stats={(stats as Stats | null) ?? null}
        />
      </Section>

      <Section id="classe" titre="Ma classe" aide="Chaque coup de main que tu donnes fait monter ta classe au classement.">
        {classes && classes.length > 0 ? (
          <form action={choisirClasse} className="flex flex-wrap items-end gap-2">
            <label className="flex min-w-60 flex-1 flex-col gap-1.5 text-sm font-semibold">
              Classe (campus de {profil.campus})
              <select name="classe" defaultValue={profil.classe_id ?? ""} className="min-h-11 rounded-ui border border-ligne-forte bg-surface px-3 text-base font-normal">
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
              </select>
            </label>
            <Bouton>Enregistrer</Bouton>
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
