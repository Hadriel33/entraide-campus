import type { Metadata } from "next";
import { exigerSession } from "@/lib/session";
import type { Stats } from "@/lib/gamification/progression";
import { Avatar } from "@/components/ui/avatar";
import { BadgeEcole } from "@/components/ui/badge";
import { BoutonLien } from "@/components/ui/bouton";
import { TitrePage } from "@/components/ui/titre-page";
import { CarteProgression } from "@/components/profil/progression";
import { CarteDefi } from "@/components/profil/carte-defi";
import { FormulaireCoordonnees, FormulaireIdentite, FormulairePhoto } from "./formulaires";
import { AssistantCompetences } from "./assistant-competences";
import { ZoneSensible } from "./zone-sensible";
import { AtelierColette } from "./atelier-colette";
import { choisirClasse, proposerClasse } from "./actions";
import { Bouton } from "@/components/ui/bouton";
import Link from "next/link";

export const metadata: Metadata = { title: "Mon profil" };

function Section({ id, titre, aide, children }: { id?: string; titre: string; aide?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="apparition flex scroll-mt-6 flex-col gap-4 rounded-carte border border-ligne bg-surface p-5 target:border-encre target:shadow-[4px_4px_0_0_var(--color-bandeau)] sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="titre-charte text-section">{titre}</h2>
        {aide && <p className="text-sm text-encre-douce">{aide}</p>}
      </div>
      {children}
    </section>
  );
}

export default async function PageCompte() {
  const { supabase, user, profil } = await exigerSession();
  const [{ data: stats }, { data: coordonnees }, { data: classes }] = await Promise.all([
    supabase.rpc("stats_profil", { cible: user.id }),
    supabase.from("coordonnees").select("telephone, email, reseau").eq("id", user.id).single(),
    supabase.from("classes").select("id, nom, validee").eq("ecole", profil.ecole).order("nom"),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <TitrePage
          accroche={
            <span className="flex flex-wrap items-center gap-2">
              @{profil.pseudo} <BadgeEcole ecole={profil.ecole} /> {user.email}
            </span>
          }
        >
          Mon profil
        </TitrePage>
        <BoutonLien href={`/profils/${profil.pseudo}`} variante="contour">
          Voir mon profil public
        </BoutonLien>
      </div>

      {stats && <CarteProgression stats={stats as Stats} moi />}
      <CarteDefi supabase={supabase} />

      <Section id="photo" titre="Photo de profil">
        <FormulairePhoto apercu={<Avatar chemin={profil.avatar_chemin} nom={profil.pseudo} taille="xl" colette={profil} />} />
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
              Classe ({profil.ecole})
              <select name="classe" defaultValue={profil.classe_id ?? ""} className="min-h-11 rounded-ui border border-ligne-forte bg-surface px-3 text-base font-normal">
                <option value="">Pas de classe</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                    {!c.validee ? " (en attente de validation)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <Bouton>Enregistrer</Bouton>
          </form>
        ) : (
          <p className="font-main text-lg text-encre-douce">Les classes de ton école n&apos;ont pas encore été ajoutées.</p>
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

      <Section
        id="competences"
        titre="Mes compétences"
        aide="Ce que tu peux proposer aux autres. Dépose ton CV : l'IA te fait des propositions, tu gardes ce qui est juste."
      >
        <AssistantCompetences actuelles={profil.competences ?? []} />
      </Section>

      <Section titre="Mon identité" aide="Ce que les autres étudiants voient sur ton profil et tes annonces.">
        <FormulaireIdentite pseudo={profil.pseudo} prenom={profil.prenom} bio={profil.bio ?? ""} />
      </Section>

      <Section
        id="coordonnees"
        titre="Mes coordonnées"
        aide="Cachées par défaut. Seules les personnes dont tu acceptes la demande (ou qui acceptent la tienne) peuvent les voir."
      >
        <FormulaireCoordonnees telephone={coordonnees?.telephone ?? ""} email={coordonnees?.email ?? ""} reseau={coordonnees?.reseau ?? ""} />
      </Section>

      <Section titre="Mot de passe">
        <Link href="/compte/mot-de-passe" className="self-start text-sm font-semibold underline-offset-2 hover:underline">
          Changer mon mot de passe
        </Link>
      </Section>

      <Section titre="Supprimer mon compte" aide="Ton droit à l'effacement (RGPD). Voir aussi la page Confidentialité.">
        <ZoneSensible />
      </Section>
    </div>
  );
}
