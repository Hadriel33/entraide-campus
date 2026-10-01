import type { Metadata } from "next";
import Link from "next/link";
import { exigerSession } from "@/lib/session";
import { calculerProgression, type Stats } from "@/lib/gamification/progression";
import { titrePrincipal } from "@/lib/gamification/titres";
import { classerClasses } from "@/lib/gamification/classes";
import { Avatar } from "@/components/ui/avatar";
import { BadgeEcole } from "@/components/ui/badge";
import { TitrePage } from "@/components/ui/titre-page";
import { CarteDefi } from "@/components/profil/carte-defi";
import { Colette } from "@/components/colette/colette";

export const metadata: Metadata = { title: "Classement" };

type Ligne = { id: string; pseudo: string; prenom: string; ecole: string; avatar_chemin: string | null; stats: Stats };
type Vue = "etudiants" | "classes" | "ecoles";

function debutSemaine() {
  const d = new Date();
  const jour = (d.getUTCDay() + 6) % 7; // lundi = 0
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - jour)).toISOString();
}

const PODIUM = [
  { place: 2, papier: "papier-ciel", hauteur: "h-52", rot: "-2deg", taille: "text-6xl" },
  { place: 1, papier: "papier-jaune", hauteur: "h-72", rot: "1deg", taille: "text-7xl" },
  { place: 3, papier: "papier-lilas", hauteur: "h-44", rot: "2.5deg", taille: "text-5xl" },
];

export default async function PageClassement({ searchParams }: PageProps<"/classement">) {
  const { supabase, user, profil } = await exigerSession();
  const sp = await searchParams;
  const semaine = sp.periode !== "toujours";
  const vue: Vue = sp.vue === "classes" || sp.vue === "ecoles" ? sp.vue : "etudiants";

  const [{ data }, { data: profils }, { data: classes }] = await Promise.all([
    supabase.rpc("stats_classement", semaine ? { depuis: debutSemaine() } : {}),
    supabase.from("profils").select("id, classe_id, colette_couleur, colette_humeur, colette_accessoire"),
    supabase.from("classes").select("id, nom, ecole"),
  ]);
  const infos = new Map((profils ?? []).map((p) => [p.id, p]));
  const toutes = ((data ?? []) as Ligne[]).map((l) => {
    const p = calculerProgression(l.stats);
    return { ...l, p, titre: titrePrincipal(l.stats.aides_par_categorie ?? {}, p.niveau.nom), info: infos.get(l.id) };
  });
  const lignes = toutes
    .filter((l) => l.p.points > 0 || l.id === user.id)
    .sort((a, b) => b.p.points - a.p.points)
    .slice(0, 30);

  const parClasse = classerClasses(classes ?? [], toutes.map((l) => ({ classe_id: l.info?.classe_id ?? null, points: l.p.points })));
  // Score par école : la petite rivalité amicale ESD contre ESP.
  const parEcole = toutes.reduce<Record<string, number>>((acc, l) => ({ ...acc, [l.ecole]: (acc[l.ecole] ?? 0) + l.p.points }), {});

  const lien = (v: Vue, toujours = !semaine) => `/classement?vue=${v}${toujours ? "&periode=toujours" : ""}`;
  const onglet = "rounded-[4px] px-3.5 py-1.5 text-sm font-semibold text-encre-douce aria-[current=page]:bg-surface aria-[current=page]:text-encre aria-[current=page]:shadow-sm";

  // Podium : les 3 premiers (étudiants ou classes) en post-it de hauteurs différentes.
  const podium =
    vue === "classes"
      ? parClasse.slice(0, 3).map((c) => ({ cle: c.id, nom: c.nom, sous: `${c.ecole} · ${c.actifs} actif${c.actifs > 1 ? "s" : ""}`, points: c.score, moi: c.id === profil.classe_id }))
      : lignes.filter((l) => l.p.points > 0).slice(0, 3).map((l) => ({ cle: l.id, nom: `@${l.pseudo}`, sous: l.titre, points: l.p.points, moi: l.id === user.id }));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <TitrePage accroche="Les points viennent des coups de main réellement acceptés. Et ta classe monte avec toi.">Classement</TitrePage>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="inline-flex rounded-ui bg-papier-fonce p-1" aria-label="Classement de">
          {[
            { v: "etudiants" as const, label: "Étudiants" },
            { v: "classes" as const, label: "Classes" },
            { v: "ecoles" as const, label: "ESD contre ESP" },
          ].map((o) => (
            <Link key={o.v} href={lien(o.v)} aria-current={vue === o.v ? "page" : undefined} className={onglet}>
              {o.label}
            </Link>
          ))}
        </nav>
        <nav className="inline-flex rounded-ui bg-papier-fonce p-1" aria-label="Période">
          <Link href={lien(vue, false)} aria-current={semaine ? "page" : undefined} className={onglet}>
            Cette semaine
          </Link>
          <Link href={lien(vue, true)} aria-current={!semaine ? "page" : undefined} className={onglet}>
            Depuis toujours
          </Link>
        </nav>
      </div>

      {vue !== "ecoles" && podium.length > 0 && (
        <div className="grid grid-cols-3 items-end gap-3 pt-4 sm:gap-6">
          {PODIUM.map((pl) => {
            const x = podium[pl.place - 1];
            if (!x) return <div key={pl.place} />;
            return (
              <div
                key={x.cle}
                className={`colle postit ${pl.papier} ${pl.hauteur} flex flex-col gap-1.5 p-3 pt-6 sm:p-5 sm:pt-7 ${x.moi ? "ring-2 ring-encre" : ""}`}
                style={{ "--rot": pl.rot, "--i": pl.place } as React.CSSProperties}
              >
                <span className="punaise" aria-hidden />
                <span className={`titre-charte ${pl.taille}`}>{pl.place}</span>
                <strong className="truncate text-sm sm:text-lg">{x.nom}</strong>
                <span className="truncate text-xs text-encre/65">{x.sous}</span>
                <span className="mt-auto text-sm font-bold">{x.points} pts</span>
                {pl.place === 1 && <span className="hidden -rotate-3 self-end font-main text-lg text-alerte sm:block">{vue === "classes" ? "la classe en feu" : "en tête !"}</span>}
              </div>
            );
          })}
        </div>
      )}

      {vue === "etudiants" && (
        <ol className="flex flex-col gap-2">
          {lignes.slice(3).map((l, i) => (
            <li
              key={l.id}
              className={`apparition flex items-center gap-3 rounded-carte border p-3 ${l.id === user.id ? "border-encre bg-encre text-surface" : "border-ligne bg-surface"}`}
              style={{ "--i": i } as React.CSSProperties}
            >
              <span className="titre-charte w-9 text-center text-2xl">{i + 4}</span>
              <Avatar chemin={l.avatar_chemin} nom={l.pseudo} colette={l.info} />
              <Link href={`/profils/${l.pseudo}`} className="flex min-w-0 flex-1 flex-col hover:underline">
                <span className="truncate font-semibold">
                  @{l.pseudo} {l.id === user.id && <span className="font-main text-base font-normal text-bandeau">c&apos;est toi</span>}
                </span>
                <span className={`truncate text-xs ${l.id === user.id ? "text-surface/70" : "text-encre-douce"}`}>{l.titre}</span>
              </Link>
              <BadgeEcole ecole={l.ecole} />
              <span className="w-16 text-right font-semibold">{l.p.points} pts</span>
            </li>
          ))}
          {lignes.length <= 1 && (
            <li className="flex items-center gap-4 rounded-carte border border-dashed border-ligne-forte p-5">
              <Colette anim="dort" taille={70} />
              <p className="text-sm text-encre-douce">
                {semaine ? "La semaine commence : le premier coup de main accepté te place en tête." : "Le classement se remplit dès les premières entraides acceptées."}
              </p>
            </li>
          )}
        </ol>
      )}

      {vue === "classes" && (
        <>
          <ol className="flex flex-col gap-2">
            {parClasse.slice(3).map((c, i) => (
              <li key={c.id} className={`flex items-center gap-3 rounded-carte border p-3 ${c.id === profil.classe_id ? "border-encre bg-encre text-surface" : "border-ligne bg-surface"}`}>
                <span className="titre-charte w-9 text-center text-2xl">{i + 4}</span>
                <span className="flex-1 font-semibold">
                  {c.nom} {c.id === profil.classe_id && <span className="font-main text-base font-normal text-bandeau">ta classe</span>}
                </span>
                <BadgeEcole ecole={c.ecole} />
                <span className="w-16 text-right font-semibold">{c.score} pts</span>
              </li>
            ))}
          </ol>
          {parClasse.length === 0 && (
            <div className="flex items-center gap-4 rounded-carte border border-dashed border-ligne-forte p-5">
              <Colette anim="cherche" taille={70} />
              <p className="text-sm text-encre-douce">Aucune classe n&apos;a encore marqué de points. Choisis la tienne dans ton profil et aide quelqu&apos;un.</p>
            </div>
          )}
          <p className="text-sm text-encre-douce">
            Score d&apos;une classe = moyenne des points de ses membres actifs : une petite classe peut battre une grosse.{" "}
            {!profil.classe_id && (
              <Link href="/compte#classe" className="font-semibold text-encre underline underline-offset-2">
                Choisir ma classe
              </Link>
            )}
          </p>
        </>
      )}

      {vue === "ecoles" && (
        <div className="grid gap-6 pt-4 sm:grid-cols-2">
          {[
            { e: "ESD", papier: "papier-ciel", rot: "-2deg" },
            { e: "ESP", papier: "papier-lilas", rot: "2deg" },
          ].map(({ e, papier, rot }) => {
            const tete = (parEcole[e] ?? 0) >= Math.max(parEcole.ESD ?? 0, parEcole.ESP ?? 0) && (parEcole[e] ?? 0) > 0;
            return (
              <div key={e} className={`postit ${papier} flex flex-col gap-2 p-6 pt-8`} style={{ "--rot": rot } as React.CSSProperties}>
                <span className="punaise" aria-hidden />
                <span className="titre-charte text-6xl">{e}</span>
                <span className="titre-charte text-4xl">{parEcole[e] ?? 0} pts</span>
                <span className="text-sm text-encre/70">{semaine ? "cette semaine" : "cumulés"}</span>
                {tete && <span className="-rotate-3 self-end font-main text-2xl text-alerte">devant !</span>}
              </div>
            );
          })}
        </div>
      )}

      <CarteDefi supabase={supabase} />
    </div>
  );
}
