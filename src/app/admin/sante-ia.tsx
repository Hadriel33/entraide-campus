"use client";

import { useActionState } from "react";
import { Colette } from "@/components/colette/colette";
import { Bouton } from "@/components/ui/bouton";
import { verifierIA, type EtatIA } from "./actions";

// « Les IA marchent-elles en prod ? » : un clic, deux vrais appels au modèle, et la clé serveur.
export function SanteIA() {
  const [etat, lancer, enCours] = useActionState<EtatIA>(verifierIA, null);
  const lignes = etat
    ? [
        {
          nom: "Connexion au modèle (passerelle Vercel, Gemini 2.5 Flash)",
          ok: etat.moderation.ok || etat.matching.ok,
          detail:
            etat.moderation.ok || etat.matching.ok
              ? "le modèle répond"
              : "aucune réponse : jeton OIDC ou passerelle",
        },
        {
          nom: "IA n°2, relecture d'une annonce piégée",
          ok: etat.moderation.ok,
          detail: `${etat.moderation.detail} (${etat.moderation.ms} ms)`,
        },
        {
          nom: "IA n°2, écriture du verdict en base",
          ok: etat.cleServeur,
          detail: etat.cleServeur
            ? "clé serveur présente"
            : "SUPABASE_SECRET_KEY absente de Vercel : les annonces restent « en attente »",
        },
        {
          nom: "IA n°3, « Pour moi » intelligent",
          ok: etat.matching.ok,
          detail: `${etat.matching.detail} (${etat.matching.ms} ms)`,
        },
      ]
    : [];
  return (
    <section className="flex flex-col gap-3 rounded-carte border border-ligne bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Colette
            anim={
              enCours
                ? "reflechit"
                : etat
                  ? lignes.every((l) => l.ok)
                    ? "saute"
                    : "debordee"
                  : "flotte"
            }
            taille={56}
            saison={false}
          />
          <div>
            <h2 className="titre-charte text-xl">Les IA en prod</h2>
            <p className="text-sm text-encre-douce">
              Deux vrais appels au modèle, et la clé serveur (jamais affichée).
            </p>
          </div>
        </div>
        <form action={lancer}>
          <Bouton disabled={enCours}>
            {enCours ? "Colette teste..." : "Tester maintenant"}
          </Bouton>
        </form>
      </div>
      {etat && (
        <ul className="flex flex-col gap-1.5">
          {lignes.map((l) => (
            <li
              key={l.nom}
              className={`pop flex flex-wrap items-baseline gap-x-2 rounded-ui px-3 py-2 text-sm ${l.ok ? "bg-offre" : "bg-postit-jaune"}`}
            >
              <strong>{l.ok ? "OK" : "À régler"}</strong>
              <span className="font-semibold">{l.nom}</span>
              <span className="text-encre-douce">{l.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
