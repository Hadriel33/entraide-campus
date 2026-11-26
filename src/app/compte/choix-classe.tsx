"use client";

import { SAISIE } from "@/components/ui/saisie";

// La classe s'enregistre dès qu'on la choisit (plus de bouton « Enregistrer »).
export function ChoixClasse({ defaut, children }: { defaut: string; children: React.ReactNode }) {
  return (
    <select name="classe" defaultValue={defaut} className={SAISIE} onChange={(e) => e.currentTarget.form?.requestSubmit()}>
      {children}
    </select>
  );
}
