import Link from "next/link";
import type { ComponentProps } from "react";

// Seuls des jetons du thème (globals.css) sont utilisés ici : changer de DA ne touche pas ce fichier.
const STYLES = {
  plein: "bg-encre text-papier hover:bg-accent",
  contour: "border border-encre text-encre hover:bg-papier-fonce",
} as const;

type Variante = keyof typeof STYLES;
const BASE = "inline-flex items-center justify-center rounded-ui px-4 py-2.5 font-medium transition-colors disabled:opacity-60";

export function Bouton({ variante = "plein", className = "", ...props }: ComponentProps<"button"> & { variante?: Variante }) {
  return <button className={`${BASE} ${STYLES[variante]} ${className}`} {...props} />;
}

export function BoutonLien({ variante = "plein", className = "", ...props }: ComponentProps<typeof Link> & { variante?: Variante }) {
  return <Link className={`${BASE} ${STYLES[variante]} ${className}`} {...props} />;
}
