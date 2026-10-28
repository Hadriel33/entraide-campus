import { niveauDiscussion } from "@/lib/social/revenir";

// Combien de commentaires sous un post : une bulle discrète, puis une flamme qui danse quand « ça chauffe ».
export function CompteurDiscussion({ n, className = "" }: { n: number; className?: string }) {
  const niveau = niveauDiscussion(n);
  if (niveau === "aucune") return null;
  const libelle = `${n} commentaire${n > 1 ? "s" : ""}`;
  if (niveau === "calme")
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold text-encre/70 ${className}`} title={libelle}>
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
          <path d="M4 5h16v11H9l-5 4z" />
        </svg>
        {n}
        <span className="sr-only"> {libelle}</span>
      </span>
    );
  return (
    <span className={`pop inline-flex items-center gap-1 rounded-full bg-accent py-0.5 pr-2.5 pl-1.5 text-surface shadow-[2px_2px_0_0_var(--color-encre)] ${className}`} title={libelle}>
      <svg viewBox="0 0 24 24" className="size-4 overflow-visible" fill="currentColor" aria-hidden>
        <path className="flamme-danse" d="M12 2c3 3.5 5 6.5 5 10a5 5 0 0 1-10 0c0-1.8.7-3.4 2-4.6.2 1.6 1 2.6 2 3 0-3.4.4-5.8 1-8.4z" />
      </svg>
      <span className="font-main text-base leading-none">ça chauffe</span>
      <span className="text-xs font-bold">{n}</span>
      <span className="sr-only"> {libelle}</span>
    </span>
  );
}
