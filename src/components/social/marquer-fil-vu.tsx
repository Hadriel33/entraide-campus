"use client";

import { useEffect } from "react";
import { COOKIE_FIL } from "@/lib/social/revenir";

// Retient la date de cette visite du fil (cookie, 60 jours) : à la prochaine, ce qui est arrivé entre-temps
// porte la pastille « Nouveau ». Rien en base, rien de personnel.
export function MarquerFilVu() {
  useEffect(() => {
    document.cookie = `${COOKIE_FIL}=${new Date().toISOString()}; path=/; max-age=${60 * 24 * 3600}; samesite=lax`;
  }, []);
  return null;
}
