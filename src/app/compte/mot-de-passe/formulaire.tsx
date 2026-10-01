"use client";

import { useActionState } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Champ } from "@/components/ui/champ";
import { changerMotDePasse, type EtatFormulaire } from "@/app/(auth)/actions";

export function FormulaireMotDePasse() {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(changerMotDePasse, {});
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Champ label="Nouveau mot de passe (8 caractères minimum)" name="motDePasse" type="password" autoComplete="new-password" erreur={etat.erreurs?.motDePasse} />
      <Champ label="Confirme le mot de passe" name="confirmation" type="password" autoComplete="new-password" erreur={etat.erreurs?.confirmation} />
      {etat.message && (
        <p role="alert" className="text-sm text-alerte">
          {etat.message}
        </p>
      )}
      <Bouton disabled={enCours} className="py-3">
        {enCours ? "Enregistrement..." : "Enregistrer le mot de passe"}
      </Bouton>
    </form>
  );
}
