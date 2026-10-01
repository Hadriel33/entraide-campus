import type { ReactNode } from "react";

// Badges aux couleurs des bandeaux de la charte, toujours avec du texte (jamais la couleur seule).
const STYLES = {
  offre: "bg-offre text-encre",
  besoin: "bg-besoin text-encre",
  esd: "bg-esd text-encre",
  esp: "bg-encre text-surface",
  neutre: "bg-papier-fonce text-encre font-medium",
  ok: "bg-ok-fond text-ok",
} as const;

export type VarianteBadge = keyof typeof STYLES;

export function Badge({ variante = "neutre", children }: { variante?: VarianteBadge; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${STYLES[variante]}`}>
      {children}
    </span>
  );
}

export function BadgeEcole({ ecole }: { ecole: string }) {
  return <Badge variante={ecole === "ESP" ? "esp" : "esd"}>{ecole}</Badge>;
}
