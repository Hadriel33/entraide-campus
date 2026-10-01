"use client";

import { useActionState } from "react";
import Link from "next/link";
import { inscrire, type EtatFormulaire } from "../actions";
import { Champ } from "@/components/ui/champ";
import { Bouton } from "@/components/ui/bouton";

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
      <Champ label="Email de l'école" name="email" type="email" autoComplete="email" aide="prenom.nom@mail-esd.com ou @mail-esp.com : ton école est reconnue automatiquement" erreur={etat.erreurs?.email} defaultValue={etat.valeurs?.email} />
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
