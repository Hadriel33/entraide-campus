"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Cloche de notifications en direct. Realtime respecte la RLS : chacun ne reçoit que les siennes.
// Une bulle apparaît quelques secondes quand une notification arrive.
export function Cloche({ moi, nonLues }: { moi: string; nonLues: number }) {
  // Compteur = valeur du serveur + notifications reçues en direct depuis le dernier rendu serveur.
  const [base, setBase] = useState(nonLues);
  const [enDirect, setEnDirect] = useState(0);
  const [bulle, setBulle] = useState<{ texte: string; lien: string } | null>(
    null,
  );
  const chemin = usePathname();
  if (base !== nonLues) {
    setBase(nonLues);
    setEnDirect(0);
  }
  const compte = chemin === "/notifications" ? 0 : base + enDirect;

  useEffect(() => {
    const supabase = createClient();
    const canal = supabase
      .channel(`notifications-${moi}-${Math.random().toString(36).slice(2)}`) // unique : 2 cloches (bureau et mobile)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `destinataire_id=eq.${moi}`,
        },
        (charge) => {
          const n = charge.new as { texte: string; lien: string };
          setEnDirect((c) => c + 1);
          setBulle(n);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [moi]);

  useEffect(() => {
    if (!bulle) return;
    const t = setTimeout(() => setBulle(null), 6000);
    return () => clearTimeout(t);
  }, [bulle]);

  return (
    <>
      <Link
        href="/notifications"
        aria-label={
          compte
            ? `Notifications : ${compte} non lue${compte > 1 ? "s" : ""}`
            : "Notifications"
        }
        className="presse relative flex size-10 items-center justify-center rounded-ui hover:bg-papier-fonce"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {compte > 0 && (
          <span
            key={compte}
            className="pop absolute -top-0.5 -right-0.5 min-w-5 rounded-full bg-accent px-1 text-center text-[11px] leading-5 font-semibold text-surface"
          >
            {compte > 9 ? "9+" : compte}
          </span>
        )}
      </Link>
      {bulle && (
        <Link
          href={bulle.lien}
          onClick={() => setBulle(null)}
          role="status"
          className="pop fixed right-4 bottom-4 z-50 max-w-xs rounded-carte bg-encre px-4 py-3 text-sm text-surface shadow-lg"
        >
          {bulle.texte}
        </Link>
      )}
    </>
  );
}
