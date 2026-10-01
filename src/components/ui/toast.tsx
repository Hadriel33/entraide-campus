"use client";

import { useSearchParams } from "next/navigation";

// Messages de confirmation après une action. L'action redirige vers ?ok=<code>,
// le message apparaît en haut puis s'efface tout seul (animation CSS, pas de minuterie).
const MESSAGES: Record<string, string> = {
  publiee: "Annonce publiée.",
  modifiee: "Annonce modifiée.",
  archivee: "Annonce archivée.",
  republiee: "Annonce republiée.",
  supprimee: "Annonce supprimée.",
  demande: "Demande envoyée. Tu seras prévenu de la réponse dans Demandes.",
  annulee: "Demande annulée.",
  acceptee: "Demande acceptée : vous voyez maintenant vos coordonnées.",
  refusee: "Demande refusée.",
  avis: "Merci pour ton avis.",
  profil: "Profil enregistré.",
  photo: "Photo de profil mise à jour.",
  coordonnees: "Coordonnées enregistrées.",
  competences: "Compétences enregistrées sur ton profil.",
  moderation: "Décision de modération enregistrée.",
  signalement: "Merci, l'équipe de modération va regarder.",
  bienvenue: "Bienvenue sur l'entraide du campus.",
};

export function Toast() {
  const code = useSearchParams().get("ok");
  const message = code ? MESSAGES[code] : undefined;
  if (!message) return null;

  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-4">
      <p key={code} className="toast-anime rounded-ui bg-encre px-4 py-2.5 text-sm font-medium text-surface shadow-lg">
        {message}
      </p>
    </div>
  );
}
