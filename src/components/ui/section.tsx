// Bloc de page (profil, réglages) : un titre, une aide, puis le contenu. Ciblable par une ancre (#id).
export function Section({ id, titre, aide, children }: { id?: string; titre: string; aide?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="apparition flex scroll-mt-6 flex-col gap-4 rounded-carte border border-ligne bg-surface p-5 target:border-encre target:shadow-[4px_4px_0_0_var(--color-bandeau)] sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="titre-charte text-section">{titre}</h2>
        {aide && <p className="text-sm text-encre-douce">{aide}</p>}
      </div>
      {children}
    </section>
  );
}

// Sommaire en pastilles en haut d'une longue page : on saute directement à la bonne section.
export function Sommaire({ liens }: { liens: { href: string; label: string }[] }) {
  return (
    <nav aria-label="Sur cette page" className="sticky top-0 z-10 -mx-1 flex gap-2 overflow-x-auto bg-papier/90 px-1 py-2 backdrop-blur md:top-0">
      {liens.map((l) => (
        <a key={l.href} href={l.href} className="presse shrink-0 rounded-full border border-ligne-forte bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-papier-fonce">
          {l.label}
        </a>
      ))}
    </nav>
  );
}
