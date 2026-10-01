import type { ReactNode } from "react";

// Titre de page de la charte : capitales condensées sur le bandeau jaune, accroche en serif.
// Une couche lilas fine, décalée, rappelle les affiches superposées de la charte.
// Un seul par page : c'est la signature visuelle, elle ne doit pas se répéter.
export function TitrePage({ children, accroche }: { children: ReactNode; accroche?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="titre-charte couche-fixe self-start bg-bandeau px-2.5 pt-0.5 text-3xl sm:text-4xl">{children}</h1>
      {accroche && <p className="font-serif text-base text-encre-douce sm:text-lg">{accroche}</p>}
    </div>
  );
}
