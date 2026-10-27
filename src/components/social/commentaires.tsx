"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { commenter, supprimerCommentaire, type EtatCommentaire } from "@/app/fil/actions";
import type { Commentaire } from "@/lib/social/requetes";
import { Avatar } from "@/components/ui/avatar";
import { ilYa } from "@/lib/temps";

// Commentaires sous un post : les 2 derniers visibles, le reste dépliable, et un champ pour répondre.
export function Commentaires({
  cible,
  id,
  liste,
  moi,
  estAdmin,
  ouvert = false,
}: {
  cible: "annonce" | "entraide";
  id: string;
  liste: Commentaire[];
  moi: string;
  estAdmin: boolean;
  ouvert?: boolean;
}) {
  const [tout, setTout] = useState(ouvert);
  const [etat, envoyer, enCours] = useActionState<EtatCommentaire, FormData>(commenter, {});
  const visibles = tout ? liste : liste.slice(-2);

  return (
    <div className="relative z-10 flex flex-col gap-2">
      {liste.length > 2 && !tout && (
        <button type="button" onClick={() => setTout(true)} className="self-start text-sm font-semibold text-encre-douce hover:text-encre">
          Voir les {liste.length} commentaires
        </button>
      )}
      {visibles.length > 0 && (
        <ul className="flex flex-col gap-2">
          {visibles.map((c) => (
            <li key={c.id} className="flex items-start gap-2 text-sm">
              <Avatar chemin={c.auteur?.avatar_chemin} nom={c.auteur?.pseudo ?? "?"} taille="sm" colette={c.auteur ?? undefined} />
              <div className="flex min-w-0 flex-1 flex-col rounded-ui bg-papier-fonce px-3 py-1.5">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <Link href={`/profils/${c.auteur?.pseudo}`} className="font-semibold hover:underline">
                    @{c.auteur?.pseudo}
                  </Link>
                  <span className="text-xs text-encre-douce">{ilYa(c.cree_le)}</span>
                  {(c.auteur_id === moi || estAdmin) && (
                    <button
                      type="button"
                      onClick={() => supprimerCommentaire(c.id, cible, id)}
                      className="ml-auto text-xs text-encre-douce hover:text-alerte"
                    >
                      Supprimer
                    </button>
                  )}
                </span>
                <span className="break-words">{c.contenu}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form key={etat.ok ?? 0} action={envoyer} className="flex items-center gap-2">
        <input type="hidden" name="cible" value={cible} />
        <input type="hidden" name="id" value={id} />
        <label className="sr-only" htmlFor={`com-${id}`}>
          Ton commentaire
        </label>
        <input
          id={`com-${id}`}
          name="contenu"
          maxLength={300}
          autoComplete="off"
          placeholder="Écrire un commentaire..."
          className="min-h-10 min-w-0 flex-1 rounded-full border border-ligne-forte bg-surface px-4 text-sm outline-none focus:border-encre"
        />
        <button disabled={enCours} className="presse min-h-10 rounded-full bg-encre px-4 text-sm font-semibold text-surface disabled:opacity-60">
          {enCours ? "..." : "Envoyer"}
        </button>
      </form>
      {etat.erreur && (
        <p role="alert" className="text-sm text-alerte">
          {etat.erreur}
        </p>
      )}
    </div>
  );
}
