"use client";

import { useActionState } from "react";
import Link from "next/link";
import { inscrire, type EtatFormulaire } from "../actions";
import { Champ } from "@/components/ui/champ";
import { Bouton } from "@/components/ui/bouton";
import { ECOLES } from "@/lib/auth/validation";

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
      <fieldset className="flex flex-col gap-1.5 text-sm font-medium">
        <legend className="mb-1.5">École</legend>
        <div className="flex gap-3">
          {ECOLES.map((ecole) => (
            <label key={ecole} className="flex items-center gap-2 min-h-10 cursor-pointer rounded-ui border border-ligne-forte bg-surface px-4 py-2 font-normal has-[:checked]:border-encre has-[:checked]:bg-papier-fonce">
              <input type="radio" name="ecole" value={ecole} defaultChecked={etat.valeurs?.ecole === ecole} />
              {ecole}
            </label>
          ))}
        </div>
        {etat.erreurs?.ecole && <span className="font-normal text-alerte">{etat.erreurs.ecole}</span>}
      </fieldset>
      <Champ label="Email" name="email" type="email" autoComplete="email" erreur={etat.erreurs?.email} defaultValue={etat.valeurs?.email} />
      <Champ label="Mot de passe (8 caractères minimum)" name="motDePasse" type="password" autoComplete="new-password" erreur={etat.erreurs?.motDePasse} />
      {etat.message && <p role="alert" className="text-sm text-alerte">{etat.message}</p>}
      <Bouton disabled={enCours} className="py-3">
        {enCours ? "Création du compte..." : "Créer mon compte"}
      </Bouton>
      <p className="text-sm">
        Déjà un compte ? <Link href="/connexion" className="underline">Se connecter</Link>
      </p>
    </form>
  );
}
