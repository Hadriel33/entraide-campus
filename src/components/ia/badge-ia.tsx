import Link from "next/link";
import { iaNumero } from "@/lib/ia/presentation";

// Pastille posée partout où une IA intervient : on sait que c'est Colette qui travaille, et en un clic pourquoi.
export function BadgeIA({ numero, className = "" }: { numero: 1 | 2 | 3 | 4; className?: string }) {
  const ia = iaNumero(numero);
  return (
    <Link
      href={`/ia#ia-${numero}`}
      title={`${ia.nom} : à quoi ça sert ?`}
      className={`presse inline-flex shrink-0 items-center gap-1.5 rounded-full border border-encre-bleue/40 bg-postit-ciel px-2.5 py-0.5 text-xs font-bold text-encre-bleue hover:border-encre-bleue ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      {ia.badge}
      <span className="sr-only">, en savoir plus</span>
    </Link>
  );
}
