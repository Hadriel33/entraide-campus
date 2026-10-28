import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Bouton } from "@/components/ui/bouton";
import { FormulaireInvitation } from "./formulaire-invitation";
import { quitterGroupe, rejoindreGroupe } from "@/app/annonces/groupe-actions";
import { MAX_MEMBRES, peutInviter } from "@/lib/annonces/groupe";
import type { Annonce } from "@/lib/annonces/requetes";

// « L'équipe du post-it » : le créateur invite (4 personnes au plus), chacun accepte ou non, et peut partir.
// Les règles sont vérifiées en base (migration 0029) : ce bloc ne fait qu'afficher et envoyer.
export function EquipePostit({ annonce, moi, estAuteur }: { annonce: Annonce; moi: string; estAuteur: boolean }) {
  const membres = annonce.membres ?? [];
  const monInvitation = membres.find((m) => m.membre_id === moi && m.statut === "invite");
  const suisMembre = membres.some((m) => m.membre_id === moi && m.statut === "accepte");

  if (monInvitation)
    return (
      <section id="equipe" className="pop flex scroll-mt-6 flex-col gap-3 rounded-carte border-2 border-encre bg-bandeau p-5 shadow-[4px_4px_0_0_var(--color-encre)]">
        <h2 className="titre-charte text-xl">@{annonce.auteur?.pseudo} t&apos;invite sur ce post-it</h2>
        <p className="text-[0.95rem] leading-snug">
          Si tu dis oui, ton visage apparaît sur le post-it, tu reçois les demandes de contact avec le groupe, tu peux modifier le texte, et
          l&apos;entraide comptera aussi pour toi. Tes coordonnées ne sont montrées que si c&apos;est toi qui acceptes une demande.
        </p>
        <div className="flex flex-wrap gap-2">
          <form action={rejoindreGroupe.bind(null, annonce.id)}>
            <Bouton>Je rejoins le post-it</Bouton>
          </form>
          <form action={quitterGroupe.bind(null, annonce.id, moi)}>
            <Bouton variante="contour">Non merci</Bouton>
          </form>
        </div>
      </section>
    );

  if (!estAuteur && !suisMembre) return null;
  const places = membres.length;

  return (
    <section id="equipe" className="flex scroll-mt-6 flex-col gap-4 rounded-carte border border-ligne-forte bg-surface p-5" aria-labelledby="titre-equipe">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="titre-equipe" className="titre-charte text-xl">
          L&apos;équipe du post-it
        </h2>
        <span className="text-xs font-semibold text-encre-douce">
          {places + 1} / {MAX_MEMBRES + 1} personnes
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        <li className="flex items-center gap-3">
          <Avatar chemin={annonce.auteur?.avatar_chemin} nom={annonce.auteur?.pseudo ?? "?"} colette={annonce.auteur} />
          <Link href={`/profils/${annonce.auteur?.pseudo}`} className="font-semibold hover:underline">
            @{annonce.auteur?.pseudo}
          </Link>
          <span className="rounded-full bg-papier-fonce px-2 py-0.5 text-xs font-semibold">créateur</span>
        </li>
        {membres.map((m) => (
          <li key={m.membre_id} className="flex items-center gap-3">
            <Avatar chemin={m.membre?.avatar_chemin} nom={m.membre?.pseudo ?? "?"} colette={m.membre} />
            <Link href={`/profils/${m.membre?.pseudo}`} className="font-semibold hover:underline">
              @{m.membre?.pseudo}
            </Link>
            {m.statut === "invite" ? (
              <span className="rounded-full border border-dashed border-ligne-forte px-2 py-0.5 text-xs text-encre-douce">invité, pas encore répondu</span>
            ) : (
              <span className="rounded-full bg-ok-fond px-2 py-0.5 text-xs font-semibold text-ok">dans l&apos;équipe</span>
            )}
            {(estAuteur || m.membre_id === moi) && (
              <form action={quitterGroupe.bind(null, annonce.id, m.membre_id)} className="ml-auto">
                <button className="text-xs font-semibold text-encre-douce hover:text-alerte">
                  {m.membre_id === moi ? "Quitter" : m.statut === "invite" ? "Annuler l'invitation" : "Retirer"}
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
      {estAuteur &&
        (peutInviter(places) ? (
          <FormulaireInvitation annonceId={annonce.id} />
        ) : (
          <p className="text-sm text-encre-douce">L&apos;équipe est complète : 4 personnes au plus sur un post-it.</p>
        ))}
      <p className="text-xs leading-snug text-encre-douce">
        Toute l&apos;équipe reçoit les demandes de contact et peut répondre. Seules les coordonnées de celui qui accepte sont montrées.
      </p>
    </section>
  );
}
