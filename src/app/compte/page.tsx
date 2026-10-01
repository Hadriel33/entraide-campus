import type { Metadata } from "next";
import { exigerSession } from "@/lib/session";
import type { Stats } from "@/lib/gamification/progression";
import { Avatar } from "@/components/ui/avatar";
import { BadgeEcole } from "@/components/ui/badge";
import { BoutonLien } from "@/components/ui/bouton";
import { TitrePage } from "@/components/ui/titre-page";
import { CarteProgression } from "@/components/profil/progression";
import { FormulaireCoordonnees, FormulaireIdentite, FormulairePhoto } from "./formulaires";

export const metadata: Metadata = { title: "Mon profil" };

function Section({ titre, aide, children }: { titre: string; aide?: string; children: React.ReactNode }) {
  return (
    <section className="apparition flex flex-col gap-4 rounded-carte border border-ligne bg-surface p-5">
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

      <Section titre="Photo de profil">
        <FormulairePhoto apercu={<Avatar chemin={profil.avatar_chemin} nom={profil.pseudo} taille="xl" />} />
      </Section>

      <Section titre="Mon identité" aide="Ce que les autres étudiants voient sur ton profil et tes annonces.">
        <FormulaireIdentite pseudo={profil.pseudo} prenom={profil.prenom} bio={profil.bio ?? ""} />
      </Section>

      <Section
        titre="Mes coordonnées"
        aide="Cachées par défaut. Seules les personnes dont tu acceptes la demande (ou qui acceptent la tienne) peuvent les voir."
      >
        <FormulaireCoordonnees telephone={coordonnees?.telephone ?? ""} email={coordonnees?.email ?? ""} reseau={coordonnees?.reseau ?? ""} />
      </Section>
    </div>
  );
}
