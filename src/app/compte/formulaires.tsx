"use client";

import { useActionState, useState } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Champ } from "@/components/ui/champ";
import { changerPhoto, enregistrerCoordonnees, enregistrerProfil, type EtatProfil } from "./actions";

function Message({ etat }: { etat: EtatProfil }) {
  return etat.message ? (
    <p role="alert" className="text-sm text-alerte">
      {etat.message}
    </p>
  ) : null;
}

export function FormulaireIdentite({ pseudo, prenom, bio }: { pseudo: string; prenom: string; bio: string }) {
  const [etat, action, enCours] = useActionState<EtatProfil, FormData>(enregistrerProfil, {});
  const [texte, setTexte] = useState(bio);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Champ label="Pseudo" name="pseudo" defaultValue={pseudo} erreur={etat.erreurs?.pseudo} aide="Visible par tous, par exemple sam.photo" />
        <Champ label="Prénom" name="prenom" defaultValue={prenom} erreur={etat.erreurs?.prenom} />
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Bio
        <textarea
          name="bio"
          rows={2}
          maxLength={160}
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder="En une phrase : ce que tu fais, ce que tu aimes."
          className="rounded-ui border border-ligne-forte bg-surface px-3 py-2 text-base font-normal outline-none focus:border-encre"
        />
        <span className="text-xs font-normal text-encre-douce">{texte.length} / 160</span>
      </label>
      <Message etat={etat} />
      <Bouton className="self-start" disabled={enCours}>
        {enCours ? "Enregistrement..." : "Enregistrer"}
      </Bouton>
    </form>
  );
}

export function FormulairePhoto({ apercu }: { apercu: React.ReactNode }) {
  const [etat, action, enCours] = useActionState<EtatProfil, FormData>(changerPhoto, {});
  const [nouvelle, setNouvelle] = useState<string | null>(null);
  return (
    <form action={action} className="flex flex-wrap items-center gap-4">
      {nouvelle ? (
        // Aperçu local avant envoi (URL blob temporaire, jamais envoyée ailleurs).
        // eslint-disable-next-line @next/next/no-img-element
        <img src={nouvelle} alt="" className="pop size-24 rounded-full object-cover" />
      ) : (
        apercu
      )}
      <div className="flex flex-col gap-2">
        <label className="presse inline-flex min-h-10 cursor-pointer items-center justify-center rounded-ui border border-ligne-forte bg-surface px-4 py-2 text-sm font-semibold hover:bg-papier-fonce">
          Choisir une photo
          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setNouvelle(f ? URL.createObjectURL(f) : null);
            }}
          />
        </label>
        <span className="text-xs text-encre-douce">JPG, PNG ou WebP, 2 Mo maximum.</span>
        {etat.erreurs?.photo && <span className="text-sm text-alerte">{etat.erreurs.photo}</span>}
        <Message etat={etat} />
      </div>
      {nouvelle && (
        <Bouton disabled={enCours} className="pop">
          {enCours ? "Envoi..." : "Enregistrer la photo"}
        </Bouton>
      )}
    </form>
  );
}

export function FormulaireCoordonnees({ telephone, email, reseau }: { telephone: string; email: string; reseau: string }) {
  const [etat, action, enCours] = useActionState<EtatProfil, FormData>(enregistrerCoordonnees, {});
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Champ label="Téléphone" name="telephone" type="tel" defaultValue={telephone} erreur={etat.erreurs?.telephone} autoComplete="tel" />
        <Champ label="Email de contact" name="email" type="email" defaultValue={email} erreur={etat.erreurs?.email} autoComplete="email" />
      </div>
      <Champ label="Réseau (facultatif)" name="reseau" defaultValue={reseau} erreur={etat.erreurs?.reseau} aide="Instagram, LinkedIn, Discord..." />
      {etat.erreurs?.general && <p className="text-sm text-alerte">{etat.erreurs.general}</p>}
      <Message etat={etat} />
      <Bouton className="self-start" disabled={enCours}>
        {enCours ? "Enregistrement..." : "Enregistrer mes coordonnées"}
      </Bouton>
    </form>
  );
}
