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
import Link from "next/link";

export const metadata: Metadata = { title: "Mon profil" };

function Section({ id, titre, aide, children }: { id?: string; titre: string; aide?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="apparition flex scroll-mt-6 flex-col gap-4 rounded-carte border border-ligne bg-surface p-5 target:border-encre">
      <div>
        <h2 className="text-lg font-semibold">{titre}</h2>
        {aide && <p className="text-sm text-encre-douce">{aide}</p>}
      </div>
      {children}
    </section>
  );
}

export default async function PageCompte() {
  const { supabase, user, profil } = await exigerSession();
  const [{ data: stats }, { data: coordonnees }] = await Promise.all([
    supabase.rpc("stats_profil", { cible: user.id }),
    supabase.from("coordonnees").select("telephone, email, reseau").eq("id", user.id).single(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
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
        <FormulairePhoto apercu={<Avatar chemin={profil.avatar_chemin} nom={profil.pseudo} taille="xl" />} />
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
