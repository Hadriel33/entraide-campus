"use client";

import { Bouton } from "@/components/ui/bouton";
import { TitrePage } from "@/components/ui/titre-page";

// Erreur inattendue : un message clair et un bouton pour réessayer, jamais un écran bloqué.
export default function Erreur({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 py-16">
      <TitrePage accroche="Quelque chose s'est mal passé de notre côté. Réessaie dans un instant.">Oups</TitrePage>
      <div>
        <Bouton onClick={reset}>Réessayer</Bouton>
      </div>
    </section>
  );
}
