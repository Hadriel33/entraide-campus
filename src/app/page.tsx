import { BoutonLien } from "@/components/ui/bouton";

export default function Home() {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 py-16">
      <h1 className="font-titre text-4xl font-semibold leading-none tracking-tight sm:text-5xl">L&apos;entraide du campus</h1>
      <p className="max-w-md text-lg text-encre-douce">
        Propose ce que tu sais faire, trouve ce dont tu as besoin. Entre étudiants de l&apos;ESD et de l&apos;ESP
        Bordeaux.
      </p>
      <div>
        <BoutonLien href="/inscription" className="px-5 py-3">
          Créer mon compte
        </BoutonLien>
      </div>
    </section>
  );
}
