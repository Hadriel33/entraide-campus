import Link from "next/link";

export default function Home() {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 py-16">
      <h1 className="text-4xl font-semibold leading-none tracking-tight sm:text-5xl">L&apos;entraide du campus</h1>
      <p className="max-w-md text-lg text-encre-douce">
        Propose ce que tu sais faire, trouve ce dont tu as besoin. Entre étudiants de l&apos;ESD et de l&apos;ESP
        Bordeaux.
      </p>
      <div>
        <Link href="/inscription" className="inline-block rounded-md bg-encre px-5 py-3 font-medium text-papier">
          Créer mon compte
        </Link>
      </div>
    </section>
  );
}
