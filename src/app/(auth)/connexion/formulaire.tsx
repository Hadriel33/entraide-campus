"use client";

import { useActionState } from "react";
import Link from "next/link";
import { connecter, type EtatFormulaire } from "../actions";
import { Champ } from "@/components/ui/champ";
import { Bouton } from "@/components/ui/bouton";

export function FormulaireConnexion() {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(connecter, {});

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Champ label="Email" name="email" type="email" autoComplete="email" erreur={etat.erreurs?.email} defaultValue={etat.valeurs?.email} />
      <Champ label="Mot de passe" name="motDePasse" type="password" autoComplete="current-password" erreur={etat.erreurs?.motDePasse} />
      {etat.message && <p role="alert" className="text-sm text-alerte">{etat.message}</p>}
      <Bouton disabled={enCours} className="py-3">
        {enCours ? "Connexion..." : "Se connecter"}
      </Bouton>
      <p className="text-sm">
        Pas encore de compte ? <Link href="/inscription" className="underline">Créer un compte</Link>
      </p>
    </form>
  );
}
