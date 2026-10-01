"use client";

import { useState } from "react";
import { Bouton } from "@/components/ui/bouton";
import { supprimerMonCompte } from "./actions";

// Droit à l'effacement (RGPD). Pas de boîte de dialogue du navigateur : on demande de taper SUPPRIMER.
export function ZoneSensible() {
  const [confirmation, setConfirmation] = useState("");
  const pret = confirmation.trim().toUpperCase() === "SUPPRIMER";

  return (
    <form action={supprimerMonCompte} className="flex flex-col gap-3">
      <p className="text-sm text-encre-douce">
        La suppression est <strong className="text-encre">immédiate et définitive</strong> : profil, coordonnées, photo, annonces,
        demandes, messages et avis. Tes points et badges disparaissent aussi.
      </p>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Pour confirmer, tape SUPPRIMER
        <input
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          autoComplete="off"
          className="min-h-10 max-w-xs rounded-ui border border-ligne-forte bg-surface px-3 font-normal outline-none focus:border-alerte"
        />
      </label>
      <Bouton variante="danger" disabled={!pret} className="self-start">
        Supprimer définitivement mon compte
      </Bouton>
    </form>
  );
}
