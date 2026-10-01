import type { ReactNode } from "react";

// Titre de page de la charte : capitales condensées sur le bandeau jaune, accroche en serif.
// Une couche lilas fine, décalée, rappelle les affiches superposées de la charte.
// Un seul par page : c'est la signature visuelle, elle ne doit pas se répéter.
export function TitrePage({ children, accroche }: { children: ReactNode; accroche?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="titre-charte couche-fixe self-start bg-bandeau px-3 pt-1 text-titre">{children}</h1>
      {accroche && <p className="max-w-2xl font-serif text-lg leading-snug text-encre-douce sm:text-xl">{accroche}</p>}
    </div>
  );
}
