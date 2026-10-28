import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { exigerSession } from "@/lib/session";
import { SELECT_ANNONCE, type Annonce } from "@/lib/annonces/requetes";
import { CATEGORIES, TYPES, type Categorie } from "@/lib/annonces/validation";
import { teinte } from "@/lib/design/teintes";
import { chargerSocial } from "@/lib/social/requetes";
import { ilYa, ilYaJours } from "@/lib/temps";
import { Avatar } from "@/components/ui/avatar";
import { BadgeCampus } from "@/components/ui/badge";
import { BoutonLien } from "@/components/ui/bouton";
import { TitrePage } from "@/components/ui/titre-page";
import { EtatVide } from "@/components/colette/etat-vide";
import { Reactions } from "@/components/social/reactions";
import { Commentaires } from "@/components/social/commentaires";
import { MarquerFilVu } from "@/components/social/marquer-fil-vu";
import { CompteurDiscussion } from "@/components/social/compteur-discussion";
import { BoutonSoutien } from "@/components/social/bouton-soutien";
import { PictoCategorie } from "@/components/annonces/picto-categorie";
import { COOKIE_FIL, estNouveau } from "@/lib/social/revenir";

export const metadata: Metadata = { title: "Le fil" };

type Entraide = {
  id: string;
  aidant_pseudo: string;
  aidant_campus: string;
  aidant_avatar: string | null;
  aidant_couleur: string;
  aide_pseudo: string;
  aide_campus: string;
  aide_avatar: string | null;
  aide_couleur: string;
  categorie: Categorie;
  titre: string;
  quand: string;
};

type Post = { genre: "entraide"; quand: string; e: Entraide } | { genre: "annonce"; quand: string; a: Annonce };

// Le fil du campus : ce qui se passe, à liker et commenter. Les entraides n'y sont que si les deux personnes
// ont dit oui ; les nouvelles annonces sont celles du tableau (mêmes règles de visibilité).
export default async function PageFil({ searchParams }: PageProps<"/fil">) {
  const { supabase, user, profil } = await exigerSession();
  const tous = (await searchParams).campus === "tous";
  const depuis = ilYaJours(14);

  let requete = supabase
    .from("annonces")
    .select(tous ? SELECT_ANNONCE : SELECT_ANNONCE.replace("annonces_auteur_id_fkey(", "annonces_auteur_id_fkey!inner("))
    .eq("statut", "publiee")
    .gt("cree_le", depuis)
    .order("cree_le", { ascending: false })
    .limit(20);
  if (!tous) requete = requete.eq("auteur.campus", profil.campus);
  const [{ data: entraides }, { data: annonces }] = await Promise.all([supabase.rpc("fil_social", { limite: 30 }), requete]);

  const listeEntraides = ((entraides ?? []) as Entraide[]).filter((e) => tous || e.aidant_campus === profil.campus || e.aide_campus === profil.campus);
  const listeAnnonces = (annonces ?? []) as unknown as Annonce[];
  const posts: Post[] = [
    ...listeEntraides.map((e) => ({ genre: "entraide" as const, quand: e.quand, e })),
    ...listeAnnonces.map((a) => ({ genre: "annonce" as const, quand: a.cree_le, a })),
  ].sort((x, y) => Date.parse(y.quand) - Date.parse(x.quand));

  const [socialE, socialA] = await Promise.all([
    chargerSocial(supabase, "entraide", listeEntraides.map((e) => e.id), user.id),
    chargerSocial(supabase, "annonce", listeAnnonces.map((a) => a.id), user.id),
  ]);
  const estAdmin = profil.role === "admin";
  const derniereVisite = (await cookies()).get(COOKIE_FIL)?.value ?? null;
  const nouveaux = posts.filter((p) => estNouveau(p.quand, derniereVisite)).length;
  const pastilleNouveau = <span className="sautille shrink-0 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold tracking-wide text-surface uppercase">Nouveau</span>;
  const onglet = "rounded-[4px] px-3.5 py-1.5 text-sm font-semibold text-encre-douce aria-[current=page]:bg-surface aria-[current=page]:text-encre aria-[current=page]:shadow-sm";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <TitrePage accroche="Les coups de main réussis et les nouveaux post-it. Réagis, commente, et file sur le tableau.">Le fil</TitrePage>

      <MarquerFilVu />
      {derniereVisite && (
        <p className="rounded-ui border border-ligne-forte bg-surface px-4 py-3 text-[0.95rem]" role="status">
          {nouveaux > 0 ? (
            <>
              <strong>{nouveaux} nouveauté{nouveaux > 1 ? "s" : ""}</strong> depuis ta dernière visite, marquée{nouveaux > 1 ? "s" : ""} « Nouveau ».
            </>
          ) : (
            <>Rien de neuf depuis ta dernière visite. Et si c&apos;était toi, le prochain post-it ?</>
          )}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="inline-flex rounded-ui bg-papier-fonce p-1" aria-label="Fil de">
          <Link href="/fil" aria-current={!tous ? "page" : undefined} className={onglet}>
            Campus de {profil.campus}
          </Link>
          <Link href="/fil?campus=tous" aria-current={tous ? "page" : undefined} className={onglet}>
            Tous les campus
          </Link>
        </nav>
        {!profil.fil_public && (
          <Link href="/reglages#fil" className="-rotate-1 font-main text-lg text-alerte">
            et toi, tu apparais dans le fil ?
          </Link>
        )}
      </div>

      {posts.length === 0 ? (
        <EtatVide anim="dort" titre="Le fil est calme" action={<BoutonLien href="/annonces/nouvelle">Publier un post-it</BoutonLien>}>
          Publie un post-it ou accepte une demande : ça apparaîtra ici.
        </EtatVide>
      ) : (
        <ol className="flex flex-col gap-7">
          {posts.map((p, i) =>
            p.genre === "entraide" ? (
              <li
                key={`e-${p.e.id}`}
                id={`e-${p.e.id}`}
                className="apparition flex scroll-mt-6 flex-col gap-3 rounded-carte border border-ligne bg-surface p-4 target:border-encre sm:p-5"
                style={{ "--i": Math.min(i, 8) } as React.CSSProperties}
              >
                <div className="flex items-start gap-3">
                  <span className="flex shrink-0">
                    <Avatar chemin={p.e.aidant_avatar} nom={p.e.aidant_pseudo} colette={{ colette_couleur: p.e.aidant_couleur }} />
                    <span className="-ml-3 rounded-full ring-2 ring-surface">
                      <Avatar chemin={p.e.aide_avatar} nom={p.e.aide_pseudo} colette={{ colette_couleur: p.e.aide_couleur }} />
                    </span>
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <p className="text-[0.95rem] leading-snug">
                      <Link href={`/profils/${p.e.aidant_pseudo}`} className="font-semibold hover:underline">
                        @{p.e.aidant_pseudo}
                      </Link>{" "}
                      a aidé{" "}
                      <Link href={`/profils/${p.e.aide_pseudo}`} className="font-semibold hover:underline">
                        @{p.e.aide_pseudo}
                      </Link>
                    </p>
                    <p className="text-xs text-encre-douce">
                      {CATEGORIES[p.e.categorie]} · {ilYa(p.e.quand)}
                      {tous && <> · {p.e.aidant_campus}</>}
                    </p>
                  </div>
                  <span className="ml-auto flex shrink-0 flex-col items-end gap-1">
                    {estNouveau(p.quand, derniereVisite) && pastilleNouveau}
                    <span className="-rotate-3 font-main text-lg text-ok">entraide !</span>
                    <CompteurDiscussion n={socialE.commentaires.get(p.e.id)?.length ?? 0} />
                  </span>
                </div>
                <p className="rounded-ui border-l-4 border-ok bg-ok-fond px-4 py-2.5 text-base font-semibold">« {p.e.titre} »</p>
                <Reactions
                  cible="entraide"
                  id={p.e.id}
                  resume={socialE.reactions.get(p.e.id)!}
                  proprietaire={[p.e.aidant_pseudo, p.e.aide_pseudo].includes(profil.pseudo)}
                />
                <Commentaires cible="entraide" id={p.e.id} liste={socialE.commentaires.get(p.e.id) ?? []} moi={user.id} estAdmin={estAdmin} />
              </li>
            ) : (
              <li
                key={`a-${p.a.id}`}
                className="apparition flex flex-col gap-3 rounded-carte border border-ligne bg-surface p-4 sm:p-5"
                style={{ "--i": Math.min(i, 8) } as React.CSSProperties}
              >
                <div className="flex items-center gap-3">
                  <Avatar chemin={p.a.auteur?.avatar_chemin} nom={p.a.auteur?.pseudo ?? "?"} colette={p.a.auteur} />
                  <div className="flex min-w-0 flex-col">
                    <p className="text-[0.95rem] leading-snug">
                      <Link href={`/profils/${p.a.auteur?.pseudo}`} className="font-semibold hover:underline">
                        @{p.a.auteur?.pseudo}
                      </Link>{" "}
                      a punaisé un post-it
                    </p>
                    <p className="flex items-center gap-2 text-xs text-encre-douce">
                      {ilYa(p.a.cree_le)}
                      {tous && <BadgeCampus campus={p.a.auteur?.campus} />}
                    </p>
                  </div>
                  <span className="ml-auto flex shrink-0 flex-col items-end gap-1">
                    {estNouveau(p.quand, derniereVisite) && pastilleNouveau}
                    <CompteurDiscussion n={socialA.commentaires.get(p.a.id)?.length ?? 0} />
                  </span>
                </div>
                <Link
                  href={`/annonces/${p.a.id}`}
                  className={`postit ${teinte(p.a.categorie).papier} flex flex-col gap-1.5 p-4 pt-5 hover:no-underline`}
                  style={{ "--rot": i % 2 ? "0.8deg" : "-0.8deg" } as React.CSSProperties}
                >
                  <span className="scotch" aria-hidden />
                  <span className="flex items-center justify-between gap-2 text-xs font-semibold">
                    <span className={`titre-charte rounded-[3px] px-1.5 pt-0.5 text-sm ${p.a.type === "cherche" ? "bg-encre text-surface" : "border-[1.5px] border-encre"}`}>
                      {TYPES[p.a.type]}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <PictoCategorie categorie={p.a.categorie} className="size-4" />
                      {CATEGORIES[p.a.categorie]}
                    </span>
                  </span>
                  <strong className="text-lg leading-tight">{p.a.titre}</strong>
                  <span className="line-clamp-2 text-sm text-encre/75">{p.a.description}</span>
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  <BoutonSoutien annonceId={p.a.id} resume={socialA.soutiens.get(p.a.id) ?? { n: 0, moi: false }} proprietaire={p.a.auteur_id === user.id} />
                  <Reactions cible="annonce" id={p.a.id} resume={socialA.reactions.get(p.a.id)!} proprietaire={p.a.auteur_id === user.id} />
                </div>
                <Commentaires cible="annonce" id={p.a.id} liste={socialA.commentaires.get(p.a.id) ?? []} moi={user.id} estAdmin={estAdmin} />
              </li>
            ),
          )}
        </ol>
      )}
    </div>
  );
}
