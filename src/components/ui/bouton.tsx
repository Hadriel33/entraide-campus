import Link from "next/link";
import type { ComponentProps } from "react";

// Seuls des jetons du thème (globals.css) sont utilisés ici : changer de DA ne touche pas ce fichier.
const STYLES = {
  plein: "bg-encre text-surface hover:bg-encre/85",
  contour: "border border-ligne-forte bg-surface text-encre hover:bg-papier-fonce",
  discret: "text-encre-douce hover:bg-papier-fonce hover:text-encre",
  danger: "border border-alerte bg-surface text-alerte hover:bg-papier-fonce",
} as const;

type Variante = keyof typeof STYLES;
const BASE =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-ui px-4 py-2 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

export function Bouton({ variante = "plein", className = "", ...props }: ComponentProps<"button"> & { variante?: Variante }) {
  return <button className={`${BASE} ${STYLES[variante]} ${className}`} {...props} />;
}

export function BoutonLien({ variante = "plein", className = "", ...props }: ComponentProps<typeof Link> & { variante?: Variante }) {
  return <Link className={`${BASE} ${STYLES[variante]} ${className}`} {...props} />;
}
