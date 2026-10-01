import type { ReactNode } from "react";
import { Colette, type AnimColette } from "./colette";

// Page ou liste vide : Colette (qui dort, cherche, accroche...) sur un post-it gris, avec une action.
export function EtatVide({ anim = "dort", titre, children, action }: { anim?: AnimColette; titre: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-6 self-center py-6 sm:flex-row sm:items-end">
      <Colette anim={anim} taille={110} className="shrink-0" />
      <div className="postit papier-gris flex max-w-md flex-col items-start gap-2.5 p-6 pt-7" style={{ "--rot": "-1.2deg" } as React.CSSProperties}>
        <span className="punaise" aria-hidden />
        <strong className="font-main text-2xl leading-tight">{titre}</strong>
        {children && <p className="text-sm text-encre/75">{children}</p>}
        {action}
      </div>
    </div>
  );
}
