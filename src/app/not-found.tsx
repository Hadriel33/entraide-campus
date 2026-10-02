import { BoutonLien } from "@/components/ui/bouton";
import { TitrePage } from "@/components/ui/titre-page";
import { Colette } from "@/components/colette/colette";

export default function Introuvable() {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 py-16 sm:flex-row sm:items-center">
      <Colette anim="cherche" taille={140} className="shrink-0 self-center" />
      <div className="flex flex-col gap-6">
        <TitrePage accroche="Colette a fouillé tout le tableau : cette page n'existe pas, ou elle ne t'est pas accessible.">Introuvable</TitrePage>
        <div>
          <BoutonLien href="/bureau">Retour à mon bureau</BoutonLien>
        </div>
      </div>
    </section>
  );
}
