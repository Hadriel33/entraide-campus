import type { ReactNode } from "react";

// Badges aux couleurs des bandeaux de la charte, toujours avec du texte (jamais la couleur seule).
const STYLES = {
  offre: "bg-offre text-encre",
  besoin: "bg-besoin text-encre",
  campus: "bg-surface text-encre ring-1 ring-encre/20",
  neutre: "bg-papier-fonce text-encre font-medium",
  ok: "bg-ok-fond text-ok",
} as const;

export type VarianteBadge = keyof typeof STYLES;

// `point` : pastille de couleur (teinte de la catégorie) devant le texte.
export function Badge({ variante = "neutre", point, children }: { variante?: VarianteBadge; point?: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${STYLES[variante]}`}>
      {point && <span className={`size-2 rounded-full ${point}`} aria-hidden />}
      {children}
    </span>
  );
}

// Le campus ESP de la personne (les deux écoles ont fusionné : on ne les distingue plus).
export function BadgeCampus({ campus }: { campus?: string | null }) {
  if (!campus) return null;
  return (
    <Badge variante="campus">
      <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
        <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
        <circle cx="12" cy="9.5" r="2.5" />
      </svg>
      {campus}
    </Badge>
  );
}
