import type { Categorie } from "@/lib/annonces/validation";

// Un pictogramme par catégorie : on reconnaît un covoit, une coloc ou un shooting avant de lire.
// Dessinés au trait (pas d'emoji : règle du test front-portable), ils prennent la couleur du texte.
const TRACES: Record<Categorie, string> = {
  photo: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  video: "M3 7h12v10H3zM15 10l6-3v10l-6-3",
  design: "M12 3l7 7-7 11-7-11zM12 3v8M10 13a2 2 0 1 0 4 0 2 2 0 0 0-4 0",
  ux_ui: "M3 4h18v14H3zM3 8h18M8 21h8M7 12h5M7 15h3",
  dev: "M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16",
  data_ia: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  redaction: "M4 20l4-1 11-11-3-3L5 16zM14 6l3 3M4 20h16",
  coloc: "M3 11l9-7 9 7M5 10v10h14V10M10 20v-5h4v5",
  covoiturage: "M5 16l1.5-5h11L19 16M3 16h18v3H3zM7 19v2M17 19v2M7.5 13.5h.01M16.5 13.5h.01",
  materiel: "M3 7l9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10",
  binome: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-3 3-5 6-5s6 2 6 5M12 20c0-3 2-5 4-5 3 0 6 2 6 5",
  shooting: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 3l3 7M21 12l-7 3M12 21l-3-7M3 12l7-3",
  coup_de_main: "M7 11V6a1.5 1.5 0 0 1 3 0v4m0-1.5V4a1.5 1.5 0 0 1 3 0v5m0-2.5a1.5 1.5 0 0 1 3 0V11m0-2a1.5 1.5 0 0 1 3 0v4.5A7.5 7.5 0 0 1 11.5 21h-.6a6 6 0 0 1-4.6-2.2L3.6 15.5a1.6 1.6 0 0 1 2.4-2.1L7 14.5",
};

export function PictoCategorie({ categorie, className = "size-5" }: { categorie: string; className?: string }) {
  const d = TRACES[categorie as Categorie] ?? TRACES.coup_de_main;
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}
