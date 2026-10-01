import type { Metadata } from "next";
import Link from "next/link";
import { exigerSession } from "@/lib/session";
import { SELECT_ANNONCE, type Annonce } from "@/lib/annonces/requetes";
import { joursRestants } from "@/lib/annonces/expiration";
import { TYPES, type Categorie } from "@/lib/annonces/validation";
import { suggerer } from "@/lib/matching/suggestions";
import { calculerProgression, type Stats } from "@/lib/gamification/progression";
import { classerClasses } from "@/lib/gamification/classes";
import { lireEtatAccueil } from "@/lib/profils/etat-accueil";
import { etapesAccueil } from "@/lib/profils/accueil";
import { inclinaison, teinte } from "@/lib/design/teintes";
import { Colette, type Accessoire, type CouleurColette } from "@/components/colette/colette";
import { CarteDefi } from "@/components/profil/carte-defi";
import { Avatar } from "@/components/ui/avatar";
import { Bouton } from "@/components/ui/bouton";

export const metadata: Metadata = { title: "Mon bureau" };

type AFaire = { cle: string; papier: string; etiquette: string; texte: string; action: string; lien: string };
type DemandeRecue = { id: string; demandeur: { pseudo: string } | null; annonce: { titre: string } | null };
type Contact = {
  id: string;
  demandeur_id: string;
  demandeur: { pseudo: string; prenom: string; avatar_chemin: string | null } | null;
  destinataire: { pseudo: string; prenom: string; avatar_chemin: string | null } | null;
  annonce: { titre: string } | null;
};
type Ligne = { id: string; pseudo: string; stats: Stats };

function debutSemaine() {
  const d = new Date();
  const jour = (d.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - jour)).toISOString();
}

// Mon bureau : la page d'arrivée après connexion. Ce qui m'attend, mes suggestions, mon défi, ma progression.
export default async function PageBureau() {
  const { supabase, user, profil } = await exigerSession();
  const maintenant = new Date().toISOString();

  const [{ data: stats }, { data: recues }, { data: miennes }, { data: contacts }, { data: recentes }, { data: classement }, { data: profils }, { data: classes }, etat] =
    await Promise.all([
      supabase.rpc("stats_profil", { cible: user.id }),
      supabase
        .from("demandes_contact")
        .select("id, demandeur:profils!demandes_contact_demandeur_id_fkey(pseudo), annonce:annonces(titre)")
        .eq("destinataire_id", user.id)
        .eq("statut", "en_attente")
        .order("cree_le", { ascending: false })
        .limit(3),
      supabase.from("annonces").select("id, titre, type, categorie, expire_le").eq("auteur_id", user.id).eq("statut", "publiee"),
      supabase
        .from("demandes_contact")
        .select(
          "id, demandeur_id, demandeur:profils!demandes_contact_demandeur_id_fkey(pseudo, prenom, avatar_chemin), destinataire:profils!demandes_contact_destinataire_id_fkey(pseudo, prenom, avatar_chemin), annonce:annonces(titre)",
        )
        .eq("statut", "acceptee")
        .order("repondu_le", { ascending: false })
        .limit(3),
      supabase.from("annonces").select(SELECT_ANNONCE).eq("statut", "publiee").gt("expire_le", maintenant).neq("auteur_id", user.id).order("cree_le", { ascending: false }).limit(60),
      supabase.rpc("stats_classement", { depuis: debutSemaine() }),
      supabase.from("profils").select("id, classe_id"),
      supabase.from("classes").select("id, nom, ecole").eq("validee", true),
      lireEtatAccueil(supabase, profil),
    ]);

  const p = stats ? calculerProgression(stats as Stats) : null;

  // Ce qui m'attend : demandes reçues, annonces qui expirent, puis la prochaine étape du profil.
  const aFaire: AFaire[] = [
    ...((recues ?? []) as unknown as DemandeRecue[]).map((d) => ({
      cle: d.id,
      papier: "papier-jaune",
      etiquette: "Demande à traiter",
      texte: `@${d.demandeur?.pseudo ?? "quelqu'un"} veut ton aide pour « ${d.annonce?.titre ?? "ton annonce"} »`,
      action: "répondre",
      lien: "/demandes",
    })),
    ...(miennes ?? [])
      .filter((a) => joursRestants(a.expire_le) <= 3)
      .map((a) => ({
        cle: a.id,
        papier: "papier-ocre",
        etiquette: joursRestants(a.expire_le) === 0 ? "Expire aujourd'hui" : `Expire dans ${joursRestants(a.expire_le)} j`,
        texte: `Ton annonce « ${a.titre} »`,
        action: "prolonger",
        lien: `/annonces/${a.id}`,
      })),
  ];
  const prochaine = etapesAccueil(etat).etapes.find((e) => !e.fait);
  if (prochaine) aFaire.push({ cle: prochaine.code, papier: "papier-lilas", etiquette: "Ton profil", texte: `${prochaine.titre}. ${prochaine.aide}`, action: "y aller", lien: prochaine.lien });
  const visibles = aFaire.slice(0, 3);

  // Pour toi
  const categories = (type: string) => [...new Set((miennes ?? []).filter((m) => m.type === type).map((m) => m.categorie as Categorie))];
  const pourToi = suggerer(
    { competences: profil.competences ?? [], categoriesProposees: categories("propose"), categoriesCherchees: categories("cherche") },
    (recentes ?? []) as unknown as Annonce[],
  );

  // Classements de la semaine : étudiants et classes
  const lignes = ((classement ?? []) as Ligne[]).map((l) => ({ ...l, points: calculerProgression(l.stats).points }));
  const top = lignes.filter((l) => l.points > 0).sort((a, b) => b.points - a.points);
  const monRang = top.findIndex((l) => l.id === user.id) + 1;
  const classeDe = new Map((profils ?? []).map((x) => [x.id, x.classe_id as string | null]));
  const parClasse = classerClasses(classes ?? [], lignes.map((l) => ({ classe_id: classeDe.get(l.id) ?? null, points: l.points })));
  const rangClasse = profil.classe_id ? parClasse.findIndex((c) => c.id === profil.classe_id) + 1 : 0;
  const maClasse = (classes ?? []).find((c) => c.id === profil.classe_id);

  const nbAttente = aFaire.length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex items-end gap-4">
          <Colette
            anim={nbAttente > 2 ? "debordee" : "coucou"}
            couleur={(profil.colette_couleur || "jaune") as CouleurColette}
            accessoire={(profil.colette_accessoire || "aucun") as Accessoire}
            taille={92}
            className="hidden shrink-0 sm:block"
          />
          <div className="flex flex-col gap-2">
            <h1 className="titre-charte couche-fixe self-start bg-bandeau px-3 pt-1 text-titre">Salut {profil.prenom}</h1>
            <p className="-rotate-1 font-main text-2xl text-alerte">
              {nbAttente === 0 ? "rien ne t'attend, profites-en pour aider quelqu'un" : nbAttente === 1 ? "une chose t'attend" : `${nbAttente} choses t'attendent`}
            </p>
          </div>
        </div>
        {p && (
          <Link href="/classement" className="presse flex items-center gap-3 rounded-carte border border-ligne bg-surface px-4 py-3 hover:border-encre">
            <span className="titre-charte text-2xl">{p.niveau.nom}</span>
            <span className="flex flex-col gap-1">
              <span className="block h-2 w-32 overflow-hidden rounded-full bg-papier-fonce">
                <span className="block h-full rounded-full bg-bandeau" style={{ width: `${p.progression}%` }} />
              </span>
              <span className="text-xs text-encre-douce">{p.points} points</span>
            </span>
          </Link>
        )}
      </header>

      {visibles.length > 0 ? (
        <section className="grid gap-8 pt-2 sm:grid-cols-2 lg:grid-cols-3" aria-label="Ce qui t'attend">
          {visibles.map((f, i) => (
            <Link
              key={f.cle}
              href={f.lien}
              className={`colle postit ${f.papier} flex flex-col gap-2 p-5 pt-7`}
              style={{ "--i": i, "--rot": `${inclinaison(f.cle) * 0.8}deg` } as React.CSSProperties}
            >
              <span className="punaise" aria-hidden />
              <span className="titre-charte text-sm">{f.etiquette}</span>
              <strong className="text-lg leading-snug">{f.texte}</strong>
              <span className="-rotate-2 self-end font-main text-xl text-alerte">{f.action}</span>
            </Link>
          ))}
        </section>
      ) : null}

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-10">
          {/* Un post-it en 20 secondes : on pré-remplit le formulaire de publication. */}
          <section className="couche-fixe teinte-bandeau flex flex-col gap-4 rounded-carte border border-ligne bg-surface p-5 sm:p-6">
            <h2 className="titre-charte text-section">Un post-it en 20 secondes</h2>
            <form action="/annonces/nouvelle" className="flex flex-col gap-3">
              <div className="flex gap-1 self-start rounded-ui bg-papier-fonce p-1">
                {Object.entries(TYPES).map(([v, l], i) => (
                  <label key={v} className="cursor-pointer rounded-[4px] px-3.5 py-1.5 text-sm font-semibold text-encre-douce has-[:checked]:bg-surface has-[:checked]:text-encre has-[:checked]:shadow-sm">
                    <input type="radio" name="type" value={v} defaultChecked={i === 0} className="sr-only" />
                    {l}
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="flex min-w-60 flex-1">
                  <span className="sr-only">Ton annonce en une phrase</span>
                  <input
                    name="titre"
                    maxLength={80}
                    placeholder="Ex. : je fais tes photos de profil LinkedIn"
                    className="min-h-12 w-full rounded-ui border border-ligne-forte bg-papier px-4 text-base outline-none focus:border-encre focus:bg-surface"
                  />
                </label>
                <Bouton className="min-h-12">Continuer</Bouton>
              </div>
            </form>
          </section>

          <section className="flex flex-col gap-5" aria-labelledby="pour-toi">
            <h2 id="pour-toi" className="flex items-baseline gap-3">
              <span className="titre-charte text-section">Pour toi</span>
              <span className="-rotate-2 font-main text-lg text-encre-douce">d&apos;après ton profil</span>
            </h2>
            {pourToi.length > 0 ? (
              <ul className="grid gap-6 sm:grid-cols-3">
                {pourToi.map(({ annonce, raison }) => (
                  <li key={annonce.id}>
                    <Link
                      href={`/annonces/${annonce.id}`}
                      className={`postit ${teinte(annonce.categorie).papier} flex h-full flex-col gap-1.5 p-4 pt-6`}
                      style={{ "--rot": `${inclinaison(annonce.id) / 2}deg` } as React.CSSProperties}
                    >
                      <span className="scotch" aria-hidden />
                      <span className="text-xs font-bold">{raison}</span>
                      <span className="font-semibold leading-snug">{annonce.titre}</span>
                      <span className="text-xs text-encre/60">
                        @{annonce.auteur?.pseudo} · {annonce.auteur?.ecole}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center gap-4 rounded-carte border border-dashed border-ligne-forte p-5">
                <Colette anim="cherche" taille={70} />
                <p className="text-sm text-encre-douce">
                  Colette cherche encore. Ajoute tes compétences ou publie une annonce : elle saura quoi te montrer.{" "}
                  <Link href="/compte#competences" className="font-semibold text-encre underline underline-offset-2">
                    Mes compétences
                  </Link>
                </p>
              </div>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <CarteDefi supabase={supabase} />

          {p && (
            <section className="flex flex-col gap-3 rounded-carte border border-ligne bg-surface p-5">
              <h2 className="titre-charte text-xl">Mes badges</h2>
              <div className="flex flex-wrap gap-2.5">
                {p.badges.map((b, i) => (
                  <span
                    key={b.code}
                    title={b.description}
                    className={`flex size-16 items-center justify-center rounded-full p-1.5 text-center text-[10px] leading-tight font-bold ${
                      b.obtenu ? `${["bg-bandeau", "bg-lilas", "bg-ciel", "bg-ocre"][i % 4]} shadow-[2px_2px_0_0_var(--color-encre)]` : "border-2 border-dashed border-ligne-forte text-encre-douce"
                    }`}
                    style={{ rotate: b.obtenu ? `${(i % 3) * 6 - 6}deg` : undefined }}
                  >
                    {b.nom}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="flex flex-col gap-3 rounded-carte border border-ligne bg-surface p-5">
            <h2 className="titre-charte text-xl">Discussions</h2>
            {((contacts ?? []) as unknown as Contact[]).length === 0 ? (
              <p className="text-sm text-encre-douce">Quand une demande est acceptée, la discussion apparaît ici.</p>
            ) : (
              ((contacts ?? []) as unknown as Contact[]).map((c) => {
                const autre = c.demandeur_id === user.id ? c.destinataire : c.demandeur;
                return (
                  <Link key={c.id} href={`/demandes/${c.id}`} className="presse -mx-2 flex items-center gap-3 rounded-ui p-2 hover:bg-papier-fonce">
                    <Avatar chemin={autre?.avatar_chemin} nom={autre?.pseudo ?? "?"} />
                    <span className="min-w-0 flex-1">
                      <strong className="block text-sm">@{autre?.pseudo}</strong>
                      <span className="block truncate text-xs text-encre-douce">{c.annonce?.titre}</span>
                    </span>
                  </Link>
                );
              })
            )}
          </section>

          <section className="flex flex-col gap-3 rounded-carte border border-ligne bg-surface p-5">
            <h2 className="titre-charte text-xl">Cette semaine</h2>
            {top.slice(0, 3).map((l, i) => (
              <p key={l.id} className="flex items-center gap-3 text-sm">
                <span className="titre-charte w-7 bg-bandeau pt-0.5 text-center text-lg">{i + 1}</span>
                <strong>@{l.pseudo}</strong>
                <span className="ml-auto text-encre-douce">{l.points} pts</span>
              </p>
            ))}
            {top.length === 0 && <p className="text-sm text-encre-douce">Personne n&apos;a encore marqué de points cette semaine. La place est libre.</p>}
            <p className="mt-1 rounded-ui bg-papier-fonce px-3 py-2 text-sm">
              {monRang > 0 ? `Tu es ${monRang}e cette semaine.` : "Aide quelqu'un pour entrer au classement."}{" "}
              {maClasse ? (rangClasse > 0 ? `${maClasse.nom} est ${rangClasse}e des classes.` : `${maClasse.nom} n'a pas encore de points.`) : ""}
            </p>
            {!maClasse && (
              <Link href="/compte#classe" className="-rotate-1 self-start font-main text-lg text-alerte">
                choisis ta classe pour la faire monter
              </Link>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
