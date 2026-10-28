import type { Metadata } from "next";
import Link from "next/link";
import { Colette, type AnimColette } from "@/components/colette/colette";
import { BoutonRevoirTuto } from "@/components/colette/tuto";
import { TitrePage } from "@/components/ui/titre-page";
import { IAS } from "@/lib/ia/presentation";

export const metadata: Metadata = { title: "Les IA de Colette" };

const ANIM: Record<1 | 2 | 3 | 4, AnimColette> = { 1: "lit", 2: "reflechit", 3: "cherche", 4: "accroche" };

// À quoi servent les IA de l'appli, en clair : ce qu'elles font, où, ce que tu décides, ce qu'elles ne font jamais.
export default function PageIA() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
      <TitrePage accroche="Quatre coups de main, toujours relus par toi. Cherche la pastille bleue « IA » dans l'appli : c'est l'une d'elles.">
        Les IA de Colette
      </TitrePage>

      <ol className="flex flex-col gap-8">
        {IAS.map((ia) => (
          <li key={ia.numero} id={`ia-${ia.numero}`} className="scroll-mt-6">
            <article className="grid gap-5 rounded-carte border border-ligne-forte bg-surface p-5 sm:grid-cols-[120px_minmax(0,1fr)] sm:p-6">
              <div className="flex items-start justify-center rounded-carte bg-postit-ciel pt-4 pb-2">
                <Colette anim={ANIM[ia.numero]} saison={false} taille={96} />
              </div>
              <div className="flex flex-col gap-4">
                <header className="flex flex-col gap-1">
                  <span className="text-xs font-bold tracking-[0.14em] text-encre-bleue uppercase">IA n°{ia.numero}</span>
                  <h2 className="titre-charte text-2xl leading-tight">{ia.nom}</h2>
                </header>
                <p className="text-base leading-relaxed">{ia.sertA}</p>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="flex flex-col gap-1 rounded-ui bg-ok-fond px-3.5 py-2.5">
                    <dt className="font-bold text-ok">Tu décides</dt>
                    <dd className="leading-snug">{ia.tuDecides}</dd>
                  </div>
                  <div className="flex flex-col gap-1 rounded-ui bg-papier-fonce px-3.5 py-2.5">
                    <dt className="font-bold">Jamais</dt>
                    <dd className="leading-snug">{ia.jamais}</dd>
                  </div>
                </dl>
                <Link href={ia.ou.href} className="presse self-start rounded-ui bg-encre px-3.5 py-2 text-sm font-semibold text-surface hover:bg-encre/85">
                  Essayer : {ia.ou.label}
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ol>

      <section className="flex flex-col gap-3 border-t border-ligne pt-6 text-sm text-encre-douce">
        <p>
          Les IA tournent sur nos serveurs, jamais dans ton navigateur. Le détail des données est dans la page{" "}
          <Link href="/confidentialite" className="font-semibold text-encre underline">
            Confidentialité
          </Link>
          .
        </p>
        <BoutonRevoirTuto className="presse self-start rounded-ui border border-ligne-forte px-3.5 py-2 font-semibold text-encre hover:bg-papier-fonce" />
      </section>
    </div>
  );
}
