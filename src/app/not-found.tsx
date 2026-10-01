import { BoutonLien } from "@/components/ui/bouton";
import { TitrePage } from "@/components/ui/titre-page";

export default function Introuvable() {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 py-16">
      <TitrePage accroche="Cette page n'existe pas, ou elle ne t'est pas accessible.">Introuvable</TitrePage>
      <div>
        <BoutonLien href="/annonces">Voir les annonces</BoutonLien>
      </div>
    </section>
  );
}
