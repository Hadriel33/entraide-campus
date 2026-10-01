import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { CATEGORIES, type Categorie } from "@/lib/annonces/validation";
import { Avatar } from "@/components/ui/avatar";
import { ilYa } from "@/lib/temps";

type Evenement = {
  aidant_pseudo: string;
  aidant_ecole: string;
  aidant_avatar: string | null;
  aidant_couleur: string;
  aide_pseudo: string;
  aide_ecole: string;
  aide_avatar: string | null;
  aide_couleur: string;
  categorie: Categorie;
  quand: string;
};


// Le fil du campus : seulement les entraides où les DEUX étudiants ont accepté d'apparaître (fonction fil_campus).
export async function FilCampus({ supabase, limite = 5, moiDansLeFil }: { supabase: SupabaseClient; limite?: number; moiDansLeFil: boolean }) {
  const { data } = await supabase.rpc("fil_campus", { limite });
  const evenements = (data ?? []) as Evenement[];

  return (
    <section className="flex flex-col gap-3 rounded-carte border border-ligne bg-surface p-5" aria-labelledby="fil-campus">
      <h2 id="fil-campus" className="titre-charte text-xl">
        Le fil du campus
      </h2>
      {evenements.length === 0 ? (
        <p className="text-sm text-encre-douce">Les entraides apparaîtront ici, quand les deux étudiants sont d&apos;accord pour s&apos;afficher.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {evenements.map((e, i) => {
            const croise = e.aidant_ecole !== e.aide_ecole;
            return (
              <li key={`${e.aidant_pseudo}-${e.aide_pseudo}-${e.quand}`} className="apparition flex items-start gap-3 text-sm" style={{ "--i": i } as React.CSSProperties}>
                <span className="flex shrink-0">
                  <Avatar chemin={e.aidant_avatar} nom={e.aidant_pseudo} taille="sm" colette={{ colette_couleur: e.aidant_couleur }} />
                  <span className="-ml-2 rounded-full ring-2 ring-surface">
                    <Avatar chemin={e.aide_avatar} nom={e.aide_pseudo} taille="sm" colette={{ colette_couleur: e.aide_couleur }} />
                  </span>
                </span>
                <span className="flex flex-col">
                  <span>
                    <Link href={`/profils/${e.aidant_pseudo}`} className="font-semibold hover:underline">
                      @{e.aidant_pseudo}
                    </Link>{" "}
                    ({e.aidant_ecole}) a aidé{" "}
                    <Link href={`/profils/${e.aide_pseudo}`} className="font-semibold hover:underline">
                      @{e.aide_pseudo}
                    </Link>{" "}
                    ({e.aide_ecole})
                  </span>
                  <span className="text-xs text-encre-douce">
                    {CATEGORIES[e.categorie]} · {ilYa(e.quand)}
                    {croise && <span className="ml-1.5 font-main text-sm text-alerte">croisement ESD × ESP !</span>}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {!moiDansLeFil && (
        <Link href="/compte#fil" className="-rotate-1 self-start font-main text-base text-alerte">
          et toi, tu veux apparaître dans le fil ?
        </Link>
      )}
    </section>
  );
}
