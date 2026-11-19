"use client";

import { useEffect, useState } from "react";
import { SuiviColette } from "@/components/echanges/suivi-colette";
import type { Etape } from "@/lib/echanges/suivi";

// La vraie barre de suivi, en démonstration sur la page d'accueil : les étapes défilent toutes seules et
// Colette livreuse marche de l'une à l'autre. Mode démo : aucun bouton, aucune action serveur.
const SCENARIO: { etape: Etape | null; mot: string | null }[] = [
  { etape: "parti", mot: "on cale ça jeudi midi" },
  { etape: "en_cours", mot: "je monte ta vidéo" },
  { etape: "presque", mot: "dernier export ce soir" },
  { etape: "livre", mot: null },
  { etape: "recu", mot: null },
];

export function DemoSuivi() {
  const [i, setI] = useState(1);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % SCENARIO.length), 3200);
    return () => window.clearInterval(t);
  }, []);
  const s = SCENARIO[i];
  return <SuiviColette demandeId="demo" etape={s.etape} mot={s.mot} aide={false} prenomAutre="Sam" retour="liste" demo />;
}
