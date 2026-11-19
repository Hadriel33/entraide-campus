"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";

// Seuls des jetons du thème (globals.css) sont utilisés ici : changer de DA ne touche pas ce fichier.
const STYLES = {
  plein: "bg-encre text-surface transition-[box-shadow,translate] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--color-bandeau)]",
  contour: "border border-ligne-forte bg-surface text-encre hover:border-encre hover:bg-papier-fonce",
  discret: "text-encre-douce hover:bg-papier-fonce hover:text-encre",
  danger: "border border-alerte bg-surface text-alerte hover:bg-papier-fonce",
} as const;

type Variante = keyof typeof STYLES;
const BASE =
  "presse inline-flex min-h-10 items-center justify-center gap-2 rounded-ui px-4 py-2 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

// Pendant l'envoi de son formulaire, un bouton d'envoi se grise et tourne : on voit que le clic est pris en compte
// (retour de test : « on dirait que le bouton ne marche pas »). Sans formulaire, useFormStatus reste au repos.
export function Bouton({ variante = "plein", className = "", type, disabled, children, ...props }: ComponentProps<"button"> & { variante?: Variante }) {
  const { pending } = useFormStatus();
  const envoi = pending && type !== "button" && type !== "reset";
  return (
    <button type={type} disabled={disabled || envoi} aria-busy={envoi || undefined} className={`${BASE} ${STYLES[variante]} ${className}`} {...props}>
      {envoi && <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
      {children}
    </button>
  );
}

export function BoutonLien({ variante = "plein", className = "", ...props }: ComponentProps<typeof Link> & { variante?: Variante }) {
  return <Link className={`${BASE} ${STYLES[variante]} ${className}`} {...props} />;
}
