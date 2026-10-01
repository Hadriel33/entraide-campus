import type { Metadata } from "next";
import { Bouton } from "@/components/ui/bouton";
import { Champ } from "@/components/ui/champ";
import { TitrePage } from "@/components/ui/titre-page";
import { demanderReinitialisation } from "../actions";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function PageMotDePasseOublie() {
  return (
    <section className="mx-auto w-full max-w-sm py-12">
      <div className="mb-8">
        <TitrePage accroche="Indique ton email : on t'envoie un lien pour choisir un nouveau mot de passe.">Mot de passe oublié</TitrePage>
      </div>
      <form action={demanderReinitialisation} className="flex flex-col gap-4">
        <Champ label="Email" name="email" type="email" autoComplete="email" />
        <Bouton className="py-3">Recevoir le lien</Bouton>
      </form>
    </section>
  );
}
