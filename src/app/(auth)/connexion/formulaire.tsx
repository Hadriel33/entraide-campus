"use client";

import { useActionState } from "react";
import Link from "next/link";
import { connecter, type EtatFormulaire } from "../actions";
import { Champ } from "../champ";

export function FormulaireConnexion() {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(connecter, {});

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Champ label="Email" name="email" type="email" autoComplete="email" erreur={etat.erreurs?.email} defaultValue={etat.valeurs?.email} />
      <Champ label="Mot de passe" name="motDePasse" type="password" autoComplete="current-password" erreur={etat.erreurs?.motDePasse} />
      {etat.message && <p role="alert" className="text-sm text-alerte">{etat.message}</p>}
      <button disabled={enCours} className="rounded-md bg-encre px-4 py-3 font-medium text-papier disabled:opacity-60">
        {enCours ? "Connexion..." : "Se connecter"}
      </button>
      <p className="text-sm">
        Pas encore de compte ? <Link href="/inscription" className="underline">Créer un compte</Link>
      </p>
    </form>
  );
}
