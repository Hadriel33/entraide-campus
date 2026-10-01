import type { Metadata } from "next";
import Link from "next/link";
import { exigerSession } from "@/lib/session";
import { calculerProgression, type Stats } from "@/lib/gamification/progression";
import { titrePrincipal } from "@/lib/gamification/titres";
import { Avatar } from "@/components/ui/avatar";
import { BadgeEcole } from "@/components/ui/badge";
import { TitrePage } from "@/components/ui/titre-page";
import { CarteDefi } from "@/components/profil/carte-defi";

export const metadata: Metadata = { title: "Classement" };

type Ligne = { id: string; pseudo: string; prenom: string; ecole: string; avatar_chemin: string | null; stats: Stats };

function debutSemaine() {
  const d = new Date();
  const jour = (d.getUTCDay() + 6) % 7; // lundi = 0
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - jour)).toISOString();
}

export default async function PageClassement({ searchParams }: PageProps<"/classement">) {
  const { supabase, user } = await exigerSession();
  const semaine = (await searchParams).periode !== "toujours";
  const { data } = await supabase.rpc("stats_classement", semaine ? { depuis: debutSemaine() } : {});
  const lignes = ((data ?? []) as Ligne[])
    .map((l) => {
      const p = calculerProgression(l.stats);
      return { ...l, p, titre: titrePrincipal(l.stats.aides_par_categorie ?? {}, p.niveau.nom) };
    })
    .filter((l) => l.p.points > 0 || l.id === user.id)
    .sort((a, b) => b.p.points - a.p.points)
    .slice(0, 30);

  // Score par école : la petite rivalité amicale ESD contre ESP.
  const parEcole = lignes.reduce<Record<string, number>>((acc, l) => ({ ...acc, [l.ecole]: (acc[l.ecole] ?? 0) + l.p.points }), {});

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <TitrePage accroche="Les étudiants qui font vivre l'entraide. Les points viennent des coups de main réellement acceptés.">Classement</TitrePage>

      <CarteDefi supabase={supabase} />

      <nav className="inline-flex self-start rounded-ui bg-papier-fonce p-1" aria-label="Période">
        {[
          { semaine: true, label: "Cette semaine", href: "/classement" },
          { semaine: false, label: "Depuis toujours", href: "/classement?periode=toujours" },
        ].map((o) => (
          <Link
            key={o.label}
            href={o.href}
            aria-current={semaine === o.semaine ? "page" : undefined}
            className="rounded-[4px] px-3.5 py-1.5 text-sm font-medium text-encre-douce aria-[current=page]:bg-surface aria-[current=page]:text-encre aria-[current=page]:shadow-sm"
          >
            {o.label}
          </Link>
        ))}
      </nav>

      <div className="grid grid-cols-2 gap-3">
        {["ESD", "ESP"].map((e, i) => (
          <div key={e} className="apparition flex items-center justify-between rounded-carte border border-ligne bg-surface p-4" style={{ "--i": i } as React.CSSProperties}>
            <BadgeEcole ecole={e} />
            <span className="text-right">
              <span className="titre-charte block text-3xl">{parEcole[e] ?? 0}</span>
              <span className="text-xs text-encre-douce">points {semaine ? "cette semaine" : "cumulés"}</span>
            </span>
          </div>
        ))}
      </div>

      <ol className="flex flex-col gap-2">
        {lignes.map((l, i) => (
          <li
            key={l.id}
            className={`apparition flex items-center gap-3 rounded-carte border bg-surface p-3 ${l.id === user.id ? "border-encre" : "border-ligne"}`}
            style={{ "--i": i } as React.CSSProperties}
          >
            <span className={`titre-charte w-9 text-center text-2xl ${i < 3 ? "rounded-ui bg-bandeau" : "text-encre-douce"}`}>{i + 1}</span>
            <Avatar chemin={l.avatar_chemin} nom={l.pseudo} />
            <Link href={`/profils/${l.pseudo}`} className="flex min-w-0 flex-1 flex-col hover:underline">
              <span className="truncate font-semibold">
                @{l.pseudo} {l.id === user.id && <span className="text-xs font-normal text-encre-douce">(toi)</span>}
              </span>
              <span className="truncate text-xs text-encre-douce">{l.titre}</span>
            </Link>
            <BadgeEcole ecole={l.ecole} />
            <span className="w-16 text-right font-semibold">{l.p.points} pts</span>
          </li>
        ))}
      </ol>
      {lignes.length <= 1 && (
        <p className="text-sm text-encre-douce">
          {semaine ? "La semaine commence : le premier coup de main accepté te place en tête." : "Le classement se remplit dès les premières entraides acceptées."}
        </p>
      )}
    </div>
  );
}
