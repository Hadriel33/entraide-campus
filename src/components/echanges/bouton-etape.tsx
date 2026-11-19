"use client";

import { useFormStatus } from "react-dom";
import { Bouton } from "@/components/ui/bouton";

// Retour immédiat pendant que le serveur enregistre (2 ou 3 secondes) : le bouton cliqué dit « Colette y va... »,
// les autres se grisent. Sans ça, on avait l'impression que le clic ne faisait rien.
export function BoutonEtape({
  code,
  variante,
  className = "",
  children,
}: {
  /** Valeur envoyée dans « etape » ; sans code, c'est le seul bouton du formulaire (« Bien reçu »). */
  code?: string;
  variante: "plein" | "contour";
  className?: string;
  children: React.ReactNode;
}) {
  const { pending, data } = useFormStatus();
  const clique = pending && (!code || data?.get("etape") === code);
  return (
    <Bouton name={code ? "etape" : undefined} value={code} variante={variante} disabled={pending} aria-busy={clique} className={className}>
      {clique ? "Colette y va..." : children}
    </Bouton>
  );
}
