"use client";

import { useActionState } from "react";
import Link from "next/link";
import { inscrire, renvoyerConfirmation, type EtatFormulaire } from "../actions";
import { Colette } from "@/components/colette/colette";
import { Champ } from "@/components/ui/champ";
import { Bouton } from "@/components/ui/bouton";
import { CAMPUS } from "@/lib/auth/validation";

export function FormulaireInscription() {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(inscrire, {});

  if (etat.succes) return <RegardeTesMails email={etat.email ?? ""} />;

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
              <span className="flex min-h-10 items-center justify-center rounded-ui border border-ligne-forte bg-surface px-2 py-2 font-medium peer-checked:border-encre peer-checked:bg-encre peer-checked:text-surface peer-focus-visible:ring-3 peer-focus-visible:ring-accent/40">
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

// Après l'inscription : Colette est partie poster le lien. On dit quoi faire, et on peut le renvoyer.
function RegardeTesMails({ email }: { email: string }) {
  const [renvoi, renvoyer, enCours] = useActionState<EtatFormulaire, FormData>(renvoyerConfirmation, {});
  return (
    <div role="status" className="pop flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {/* Un rond blanc derrière Colette : jaune sur post-it jaune, on ne la voyait pas. */}
        <span className="flex size-24 shrink-0 items-center justify-center rounded-full bg-surface ring-2 ring-encre">
          <Colette anim="coucou" humeur="contente" accessoire="bob" saison={false} taille={80} titre="Colette part poster ton lien" />
        </span>
        <div className="flex flex-col gap-1">
          <strong className="titre-charte text-2xl leading-none">Regarde tes mails</strong>
          <span className="font-main text-lg leading-snug text-encre-douce">Colette a posté ton lien de confirmation.</span>
        </div>
      </div>
      <p className="rounded-ui bg-surface/70 px-3 py-2 text-sm">
        Envoyé à <strong className="break-all">{email}</strong>
      </p>
      <ol className="flex flex-col gap-1.5 text-sm">
        <li><strong>1.</strong> Ouvre le mail « Post-it campus ».</li>
        <li><strong>2.</strong> Clique sur « Je confirme mon adresse ».</li>
        <li><strong>3.</strong> Tu arrives sur ton bureau : c&apos;est parti.</li>
      </ol>
      <p className="text-xs text-encre-douce">
        Rien après 2 minutes ? Regarde dans les spams. Le lien sert à prouver que l&apos;adresse de l&apos;école est bien la tienne.
      </p>
      <form action={renvoyer} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="email" value={email} />
        <Bouton variante="contour" disabled={enCours} className="text-sm">
          {enCours ? "Colette y retourne..." : "Renvoyer le mail"}
        </Bouton>
        {renvoi.message && <span className={`text-sm ${renvoi.succes ? "text-ok" : "text-alerte"}`}>{renvoi.message}</span>}
      </form>
    </div>
  );
}
