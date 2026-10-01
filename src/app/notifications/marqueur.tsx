"use client";

import { useEffect } from "react";
import { marquerToutLu } from "./actions";

// En ouvrant la page, les notifications passent en « lues » (après l'affichage, pour garder le repère visuel).
export function MarqueurLu({ actif }: { actif: boolean }) {
  useEffect(() => {
    if (actif) void marquerToutLu();
  }, [actif]);
  return null;
}
