"use client";

import { useSearchParams } from "next/navigation";
import { Colette, type AnimColette } from "@/components/colette/colette";

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
  acceptee: "Demande acceptée : la discussion est ouverte, vos coordonnées sont visibles.",
  favori: "Ajoutée à tes favoris.",
  prolongee: "Annonce prolongée.",
  refusee: "Demande refusée.",
  avis: "Merci pour ton avis.",
  profil: "Profil enregistré.",
  photo: "Photo de profil mise à jour.",
  coordonnees: "Coordonnées enregistrées.",
  competences: "Compétences enregistrées sur ton profil.",
  colette: "Ta Colette est prête.",
  classe: "Classe enregistrée : tu joues pour elle au classement.",
  classe_creee: "Classe ajoutée.",
  classe_proposee: "Classe proposée : elle compte au classement dès qu'un admin la valide.",
  classe_validee: "Classe validée.",
  classe_supprimee: "Classe supprimée.",
  moderation: "Décision de modération enregistrée.",
  signalement: "Merci, l'équipe de modération va regarder.",
  bienvenue: "Bienvenue sur Post-it campus.",
  limite: "Limite du jour atteinte (anti-spam). Réessaie demain.",
  compte_supprime: "Ton compte et toutes tes données ont été supprimés.",
  mot_de_passe: "Mot de passe modifié.",
  lien_envoye: "Si un compte existe avec cet email, un lien vient de partir.",
};

// Colette réagit aux grands moments (sinon le message s'affiche seul).
const REACTION: Record<string, AnimColette> = {
  publiee: "accroche",
  acceptee: "saute",
  avis: "saute",
  bienvenue: "coucou",
  colette: "saute",
  classe: "saute",
  demande: "accroche",
  limite: "debordee",
};

export function Toast() {
  const code = useSearchParams().get("ok");
  const message = code ? MESSAGES[code] : undefined;
  if (!message) return null;
  const anim = code ? REACTION[code] : undefined;

  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-4">
      <p key={code} className="toast-anime flex items-center gap-3 rounded-ui bg-encre py-2.5 pr-4 pl-3 text-sm font-medium text-surface shadow-lg">
        {anim && <Colette anim={anim} taille={44} className="-my-3 shrink-0" />}
        {message}
      </p>
    </div>
  );
}
