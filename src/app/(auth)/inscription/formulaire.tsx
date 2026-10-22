"use client";

import { useActionState } from "react";
import Link from "next/link";
import { inscrire, type EtatFormulaire } from "../actions";
import { Champ } from "@/components/ui/champ";
import { Bouton } from "@/components/ui/bouton";
import { CAMPUS } from "@/lib/auth/validation";

export function FormulaireInscription() {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(inscrire, {});

  if (etat.succes) {
    return (
      <p role="status" className="rounded-ui bg-papier-fonce p-4">
        {etat.message}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Champ label="Prénom" name="prenom" autoComplete="given-name" erreur={etat.erreurs?.prenom} defaultValue={etat.valeurs?.prenom} />
      <Champ label="Pseudo" name="pseudo" autoComplete="username" aide="Ton nom sur l'appli, par exemple sam.photo" erreur={etat.erreurs?.pseudo} defaultValue={etat.valeurs?.pseudo} />
      <Champ label="Email de l'école" name="email" type="email" autoComplete="email" aide="prenom.nom@mail-esp.com (ou ton ancienne adresse @mail-esd.com)" erreur={etat.erreurs?.email} defaultValue={etat.valeurs?.email} />
      <fieldset className="flex flex-col gap-1.5 text-sm font-semibold">
        <legend className="mb-1.5">Ton campus</legend>
        <div className="grid grid-cols-3 gap-2">
          {CAMPUS.map((c) => (
            <label key={c} className="presse cursor-pointer">
              <input type="radio" name="campus" value={c} defaultChecked={etat.valeurs?.campus === c} className="peer sr-only" />
              <span className="flex min-h-10 items-center justify-center rounded-ui border border-ligne-forte bg-surface px-2 py-2 font-medium peer-checked:border-encre peer-checked:bg-bandeau peer-focus-visible:ring-3 peer-focus-visible:ring-accent/40">
                {c}
              </span>
            </label>
          ))}
        </div>
        {etat.erreurs?.campus ? (
          <span className="text-sm font-normal text-alerte">{etat.erreurs.campus}</span>
        ) : (
          <span className="text-xs font-normal text-encre-douce">Tu défends les couleurs de ton campus au championnat. Seul un admin peut le changer ensuite.</span>
        )}
      </fieldset>
      <Champ label="Mot de passe (8 caractères minimum)" name="motDePasse" type="password" autoComplete="new-password" erreur={etat.erreurs?.motDePasse} />
      {etat.message && <p role="alert" className="text-sm text-alerte">{etat.message}</p>}
      <Bouton disabled={enCours} className="py-3">
        {enCours ? "Création du compte..." : "Créer mon compte"}
      </Bouton>
      <p className="text-xs text-encre-douce">
        En créant un compte, tu acceptes nos règles de{" "}
        <Link href="/confidentialite" className="underline">
          confidentialité
        </Link>
        . Tes coordonnées restent cachées jusqu&apos;à ton accord.
      </p>
      <p className="text-sm">
        Déjà un compte ? <Link href="/connexion" className="underline">Se connecter</Link>
      </p>
    </form>
  );
}
