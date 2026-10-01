import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigerSession } from "@/lib/session";
import type { Stats } from "@/lib/gamification/progression";
import { SELECT_ANNONCE, dateCourte, type Annonce } from "@/lib/annonces/requetes";
import { Avatar } from "@/components/ui/avatar";
import { BadgeEcole } from "@/components/ui/badge";
import { NoteEtoiles } from "@/components/ui/etoiles";
import { CarteProgression } from "@/components/profil/progression";
import { CarteAnnonce } from "@/components/annonces/carte-annonce";
import { calculerProgression } from "@/lib/gamification/progression";
import { titrePrincipal } from "@/lib/gamification/titres";
import { Colette, coletteParDefaut, type Accessoire, type CouleurColette, type Humeur } from "@/components/colette/colette";
import { inclinaison } from "@/lib/design/teintes";

type Avis = { id: string; note: number; commentaire: string | null; cree_le: string; auteur: { pseudo: string; avatar_chemin: string | null } | null };

export async function generateMetadata({ params }: PageProps<"/profils/[pseudo]">): Promise<Metadata> {
  return { title: `@${decodeURIComponent((await params).pseudo)}` };
}

export default async function PageProfil({ params }: PageProps<"/profils/[pseudo]">) {
  const { supabase } = await exigerSession();
  const pseudo = decodeURIComponent((await params).pseudo).toLowerCase();

  // Profil public : jamais de coordonnées ici (elles sont dans une autre table, protégée).
  const { data: profil } = await supabase.from("profils").select("id, prenom, pseudo, ecole, avatar_chemin, bio, competences, role, cree_le, classe_id, colette_couleur, colette_humeur, colette_accessoire, classe:classes(nom)").eq("pseudo", pseudo).maybeSingle();
  if (!profil) notFound();

  const [{ data: stats }, { data: annonces }, { data: avis }] = await Promise.all([
    supabase.rpc("stats_profil", { cible: profil.id }),
    supabase.from("annonces").select(SELECT_ANNONCE).eq("auteur_id", profil.id).eq("statut", "publiee").order("cree_le", { ascending: false }),
    supabase
      .from("avis")
      .select("id, note, commentaire, cree_le, auteur:profils!avis_auteur_id_fkey(pseudo, avatar_chemin)")
      .eq("cible_id", profil.id)
      .order("cree_le", { ascending: false })
      .limit(20),
  ]);
  const s = stats as Stats | null;
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
              anim="flotte"
              taille={54}
              className="absolute -right-6 -bottom-3"
            />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="titre-charte couche-fixe self-start bg-bandeau px-2.5 pt-0.5 text-3xl">@{profil.pseudo}</h1>
          {s && <p className="pop self-start rounded-ui bg-encre px-2.5 py-1 text-xs font-semibold text-surface">{titrePrincipal(s.aides_par_categorie ?? {}, calculerProgression(s).niveau.nom)}</p>}
          <p className="flex flex-wrap items-center gap-2 text-encre-douce">
            {profil.prenom} <BadgeEcole ecole={profil.ecole} />
            {profil.role === "admin" && <span className="text-xs font-semibold text-accent">Modération</span>}
            {(profil.classe as unknown as { nom: string } | null)?.nom && (
              <span className="rounded-full bg-papier-fonce px-2 py-0.5 text-xs font-semibold text-encre">{(profil.classe as unknown as { nom: string }).nom}</span>
            )}
            <span className="text-xs">membre depuis le {dateCourte(profil.cree_le)}</span>
          </p>
          {profil.bio && <p className="max-w-xl font-serif text-lg">{profil.bio}</p>}
          {profil.competences?.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Compétences">
              {(profil.competences as string[]).map((c) => (
                <li key={c} className="rounded-full bg-offre px-2.5 py-0.5 text-xs font-medium">
                  {c}
                </li>
              ))}
            </ul>
          )}
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
            { label: "annonces publiées", valeur: s.annonces, teinte: "teinte-ciel" },
            { label: "entraides ESD × ESP", valeur: s.croisements, teinte: "teinte-ocre" },
          ].map((t, i) => (
            <div key={t.label} className={`apparition couche-fixe ${t.teinte} flex flex-col-reverse rounded-carte border border-ligne bg-surface p-4`} style={{ "--i": i } as React.CSSProperties}>
              <dt className="text-sm text-encre-douce">{t.label}</dt>
              <dd className="titre-charte text-4xl">{t.valeur}</dd>
            </div>
          ))}
        </dl>
      )}

      {s && <CarteProgression stats={s} />}

      <section className="flex flex-col gap-3">
        <h2 className="titre-charte text-section">Annonces en cours</h2>
        {annonces?.length ? (
          <div className="grid gap-x-6 gap-y-9 pt-3 sm:grid-cols-2">
            {(annonces as unknown as Annonce[]).map((a, i) => (
              <CarteAnnonce key={a.id} annonce={a} index={i} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-encre-douce">Aucune annonce en cours.</p>
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
