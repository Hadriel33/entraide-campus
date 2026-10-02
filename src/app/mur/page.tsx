import type { Metadata } from "next";
import { exigerSession } from "@/lib/session";
import { SELECT_ANNONCE, type Annonce } from "@/lib/annonces/requetes";
import { CarteAnnonce } from "@/components/annonces/carte-annonce";
import { BoutonProjection, EnDirect } from "./en-direct";
import { EtatVide } from "@/components/colette/etat-vide";

export const metadata: Metadata = { title: "Le tableau en direct" };

type Impact = {
  etudiants: number;
  annonces_actives: number;
  entraides: number;
  croisements: number;
};

// Le tableau du campus, à projeter : les dernières annonces en post-it, mises à jour en direct.
export default async function PageMur() {
  const { supabase } = await exigerSession();
  const [{ data }, { data: stats }] = await Promise.all([
    supabase
      .from("annonces")
      .select(SELECT_ANNONCE)
      .eq("statut", "publiee")
      .gt("expire_le", new Date().toISOString())
      .order("cree_le", { ascending: false })
      .limit(24),
    supabase.rpc("stats_publiques"),
  ]);
  const annonces = (data ?? []) as unknown as Annonce[];
  const impact = stats as Impact | null;

  return (
    <div
      id="mur"
      className="mx-auto flex w-full max-w-7xl flex-col gap-10 bg-papier bg-[radial-gradient(var(--color-ligne-forte)_1px,transparent_1.3px)] bg-size-[22px_22px] [&:fullscreen]:max-w-none [&:fullscreen]:overflow-y-auto [&:fullscreen]:p-10"
    >
      <header className="flex flex-wrap items-end justify-between gap-6">
        {/* Un vrai titre de page (lecteurs d'écran), habillé en deux bandeaux. */}
        <h1 className="flex flex-col items-start gap-1.5">
          <span className="titre-charte couche-fixe teinte-lilas bg-bandeau px-3 pt-1 text-affiche">
            Le tableau
          </span>
          <span className="titre-charte couche-fixe teinte-ocre ml-6 bg-ciel px-3 pt-1 text-affiche sm:ml-14">
            du campus
          </span>
        </h1>
        <div className="flex flex-col items-end gap-3">
          <EnDirect />
          <BoutonProjection cible="mur" />
        </div>
      </header>

      <p className="-mt-4 max-w-3xl -rotate-1 font-main text-2xl leading-snug sm:text-3xl">
        Publie depuis ton téléphone sur{" "}
        <strong className="text-alerte">entraide-campus.vercel.app</strong> :
        ton post-it arrive ici en direct.
        {impact && impact.etudiants >= 5 && (
          <span className="block text-xl text-encre-douce sm:text-2xl">
            {impact.etudiants} étudiants inscrits, {impact.annonces_actives}{" "}
            annonces en cours, {impact.entraides} entraides réalisées.
          </span>
        )}
      </p>

      {annonces.length > 0 ? (
        <div className="grid gap-x-7 gap-y-10 pt-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {annonces.map((a, i) => (
            <CarteAnnonce key={a.id} annonce={a} index={i} />
          ))}
        </div>
      ) : (
        <EtatVide anim="accroche" titre="Le tableau attend son premier post-it">
          À toi de jouer : publie depuis ton téléphone et regarde-la arriver
          ici.
        </EtatVide>
      )}
    </div>
  );
}
