"use client";

// La classe s'enregistre dès qu'on la choisit (plus de bouton « Enregistrer »).
export function ChoixClasse({ defaut, children }: { defaut: string; children: React.ReactNode }) {
  return (
    <select
      name="classe"
      defaultValue={defaut}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className="min-h-11 rounded-ui border-2 border-ligne-forte bg-surface px-3 text-base font-normal outline-none focus:border-encre focus:shadow-[3px_3px_0_0_var(--color-bandeau)]"
    >
      {children}
    </select>
  );
}
