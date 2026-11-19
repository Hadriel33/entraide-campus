import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigerSession } from "@/lib/session";
import { suggerer, type AnnonceCandidate } from "@/lib/matching/suggestions";
import type { Stats } from "@/lib/gamification/progression";
import { SELECT_ANNONCE, dateCourte, type Annonce } from "@/lib/annonces/requetes";
import { Avatar } from "@/components/ui/avatar";
import { BadgeCampus } from "@/components/ui/badge";
import { NoteEtoiles } from "@/components/ui/etoiles";
import { CarteProgression } from "@/components/profil/progression";
import { CarteAnnonce } from "@/components/annonces/carte-annonce";
import { calculerProgression } from "@/lib/gamification/progression";
import { titrePrincipal } from "@/lib/gamification/titres";
import { Colette, coletteParDefaut, type Accessoire, type CouleurColette, type Humeur, type Motif } from "@/components/colette/colette";
import { inclinaison } from "@/lib/design/teintes";

type Avis = { id: string; note: number; commentaire: string | null; cree_le: string; auteur: { pseudo: string; avatar_chemin: string | null } | null };

export async function generateMetadata({ params }: PageProps<"/profils/[pseudo]">): Promise<Metadata> {
  return { title: `@${decodeURIComponent((await params).pseudo)}` };
}

export default async function PageProfil({ params }: PageProps<"/profils/[pseudo]">) {
  const { supabase, user, profil: moi } = await exigerSession();
  const pseudo = decodeURIComponent((await params).pseudo).toLowerCase();

  // Profil public : jamais de coordonnées ici (elles sont dans une autre table, protégée).
  const { data: profil } = await supabase.from("profils").select("id, prenom, pseudo, campus, avatar_chemin, bio, competences, role, cree_le, classe_id, colette_couleur, colette_humeur, colette_accessoire, colette_motif, classe:classes!profils_classe_id_fkey(nom)").eq("pseudo", pseudo).maybeSingle();
  if (!profil) notFound();

  const [{ data: stats }, { data: annoncesCreees }, { data: avis }, { data: groupes }] = await Promise.all([
    supabase.rpc("stats_profil", { cible: profil.id }),
    supabase.from("annonces").select(SELECT_ANNONCE).eq("auteur_id", profil.id).eq("statut", "publiee").order("cree_le", { ascending: false }),
    supabase
      .from("avis")
      .select("id, note, commentaire, cree_le, auteur:profils!avis_auteur_id_fkey(pseudo, avatar_chemin)")
      .eq("cible_id", profil.id)
      .order("cree_le", { ascending: false })
      .limit(20),
    // Les post-its de groupe dont la personne fait partie (membre qui a accepté) : ils sont aussi les siens.
    supabase.from("annonce_membres").select(`annonce:annonces(${SELECT_ANNONCE})`).eq("membre_id", profil.id).eq("statut", "accepte"),
  ]);
  const annonces = [
    ...((annoncesCreees ?? []) as unknown as Annonce[]),
    ...((groupes ?? []) as unknown as { annonce: Annonce | null }[]).map((g) => g.annonce).filter((a): a is Annonce => !!a && a.statut === "publiee"),
  ].sort((x, y) => Date.parse(y.cree_le) - Date.parse(x.cree_le));
  const s = stats as Stats | null;
  // « Ça matche avec toi » : les compétences en commun, et mes post-its « Je cherche » où cette personne peut m'aider.
  const sesCompetences = (profil.competences ?? []) as string[];
  const estMoi = profil.id === user.id;
  const communes = new Set(estMoi ? [] : sesCompetences.filter((c) => (moi.competences ?? []).some((m) => m.toLowerCase() === c.toLowerCase())).map((c) => c.toLowerCase()));
  const { data: mesRecherches } = estMoi || sesCompetences.length === 0
    ? { data: [] }
    : await supabase.from("annonces").select("id, type, categorie, titre, description").eq("auteur_id", user.id).eq("statut", "publiee").eq("type", "cherche");
  const peutAider = suggerer({ competences: sesCompetences, categoriesProposees: [], categoriesCherchees: [] }, (mesRecherches ?? []) as AnnonceCandidate[], 3);
  const listeAvis = (avis ?? []) as unknown as Avis[];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
      <header className="apparition flex flex-wrap items-center gap-5">
        <div className="relative">
          <Avatar chemin={profil.avatar_chemin} nom={profil.pseudo} taille="xl" colette={profil} />
          {profil.avatar_chemin && (
            <Colette
              couleur={(profil.colette_couleur || coletteParDefaut(profil.pseudo).couleur) as CouleurColette}
              humeur={(profil.colette_humeur || "contente") as Humeur}
              accessoire={(profil.colette_accessoire || "aucun") as Accessoire}
              motif={(profil.colette_motif || "uni") as Motif}
              saison={false}
              anim="flotte"
              taille={72}
              className="absolute -right-9 -bottom-4"
            />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="titre-charte couche-fixe self-start bg-bandeau px-2.5 pt-0.5 text-3xl">@{profil.pseudo}</h1>
          {s && <p className="pop self-start rounded-ui bg-encre px-2.5 py-1 text-xs font-semibold text-surface">{titrePrincipal(s.aides_par_categorie ?? {}, calculerProgression(s).niveau.nom)}</p>}
          <p className="flex flex-wrap items-center gap-2 text-encre-douce">
            {profil.prenom} <BadgeCampus campus={profil.campus} />
            {profil.role === "admin" && <span className="text-xs font-semibold text-accent">Modération</span>}
            {(profil.classe as unknown as { nom: string } | null)?.nom && (
              <span className="rounded-full bg-papier-fonce px-2 py-0.5 text-xs font-semibold text-encre">{(profil.classe as unknown as { nom: string }).nom}</span>
            )}
            <span className="text-xs">membre depuis le {dateCourte(profil.cree_le)}</span>
            {(s?.serie ?? 0) > 0 && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-surface" title="Semaines d'affilée où cette personne a participé">
                Série : {s?.serie} semaine{(s?.serie ?? 0) > 1 ? "s" : ""}
              </span>
            )}
          </p>
          {profil.bio && <p className="max-w-xl font-serif text-lg">{profil.bio}</p>}
          {s?.note_moyenne != null && (
            <p className="flex items-center gap-2 text-sm">
              <NoteEtoiles note={s.note_moyenne} /> <strong>{String(s.note_moyenne).replace(".", ",")}</strong>
              <span className="text-encre-douce">({s.nb_avis} avis)</span>
            </p>
          )}
        </div>
      </header>

      {s && (
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "personnes aidées", valeur: s.aides_donnees, teinte: "teinte-bandeau" },
            { label: "coups de main reçus", valeur: s.aides_recues, teinte: "teinte-lilas" },
            { label: "post-its publiés", valeur: s.annonces, teinte: "teinte-ciel" },
            { label: "entraides avec une autre formation", valeur: s.croisements, teinte: "teinte-ocre" },
          ].map((t, i) => (
            <div key={t.label} className={`apparition couche-fixe ${t.teinte} flex flex-col-reverse rounded-carte border border-ligne bg-surface p-4`} style={{ "--i": i } as React.CSSProperties}>
              <dt className="text-sm text-encre-douce">{t.label}</dt>
              <dd className="titre-charte text-4xl">{t.valeur}</dd>
            </div>
          ))}
        </dl>
      )}

      {/* Ses compétences, en grand (retour de test : aussi visibles que les badges), et ce qui matche avec moi. */}
      {sesCompetences.length > 0 && (
        <section className="flex flex-col gap-4" aria-labelledby="competences">
          <h2 id="competences" className="flex flex-wrap items-baseline gap-x-3">
            <span className="titre-charte text-section">{estMoi ? "Mes compétences" : "Ses compétences"}</span>
            {communes.size > 0 && <span className="-rotate-2 font-main text-lg text-alerte">{communes.size} en commun avec toi</span>}
          </h2>
          <ul className="flex flex-wrap gap-2.5">
            {sesCompetences.map((c, i) => {
              const commune = communes.has(c.toLowerCase());
              return (
                <li
                  key={c}
                  className={`apparition rounded-ui border-2 border-encre px-4 py-2 text-base font-semibold ${commune ? "bg-bandeau shadow-[3px_3px_0_0_var(--color-encre)]" : "bg-offre"}`}
                  style={{ "--i": i } as React.CSSProperties}
                >
                  {c}
                </li>
              );
            })}
          </ul>
          {peutAider.length > 0 && (
            <div className="flex flex-col gap-2 rounded-carte border border-encre bg-surface p-4 shadow-[3px_3px_0_0_var(--color-lilas)]">
              <p className="font-main text-xl">Ça matche avec toi : @{profil.pseudo} peut t&apos;aider sur</p>
              <ul className="flex flex-col gap-1.5">
                {peutAider.map(({ annonce, raison }) => (
                  <li key={annonce.id} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                    <Link href={`/annonces/${annonce.id}`} className="font-semibold underline decoration-2 underline-offset-4 hover:decoration-bandeau">
                      {annonce.titre}
                    </Link>
                    <span className="text-encre-douce">{raison}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {s && <CarteProgression stats={s} />}

      <section className="flex flex-col gap-3">
        <h2 className="titre-charte text-section">Annonces en cours</h2>
        {annonces?.length ? (
          <div className="grid gap-x-6 gap-y-9 pt-3 sm:grid-cols-2">
            {annonces.map((a, i) => (
              <CarteAnnonce key={a.id} annonce={a} index={i} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-encre-douce">Aucun post-it en cours.</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="titre-charte text-section">Avis reçus</h2>
        {listeAvis.length ? (
          <ul className="grid gap-6 pt-3 sm:grid-cols-2">
            {listeAvis.map((a, i) => (
              <li
                key={a.id}
                className={`colle postit ${["papier-jaune", "papier-lilas", "papier-ciel", "papier-ocre"][i % 4]} flex flex-col gap-2 p-5 pt-7`}
                style={{ "--i": i, "--rot": `${inclinaison(a.id) * 0.6}deg` } as React.CSSProperties}
              >
                <span className="punaise" aria-hidden />
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <Avatar chemin={a.auteur?.avatar_chemin} nom={a.auteur?.pseudo ?? "?"} taille="sm" />@{a.auteur?.pseudo}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-encre-douce">
                    <NoteEtoiles note={a.note} /> {dateCourte(a.cree_le)}
                  </span>
                </div>
                {a.commentaire && <p className="font-main text-xl leading-snug">« {a.commentaire} »</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-encre-douce">Pas encore d&apos;avis. Les avis arrivent après une mise en relation acceptée.</p>
        )}
      </section>
    </div>
  );
}
