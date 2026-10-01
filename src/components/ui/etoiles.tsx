// Étoile en SVG (pas de caractère ★ : règle « aucun pictogramme texte » du test front-portable).
export function Etoile({ pleine = true, className = "size-5" }: { pleine?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill={pleine ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
    </svg>
  );
}

export function NoteEtoiles({ note, taille = "size-4" }: { note: number; taille?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${note} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Etoile key={n} pleine={n <= Math.round(note)} className={`${taille} ${n <= Math.round(note) ? "text-encre" : "text-ligne-forte"}`} />
      ))}
    </span>
  );
}
