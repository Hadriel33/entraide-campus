import { saisonDu } from "@/lib/design/saisons";

// Colette, la mascotte : un post-it avec une punaise sur la tête.
// Pur SVG + CSS (animations dans globals.css, section « Colette »), utilisable côté serveur.
// Les couleurs viennent des jetons du thème (test front-portable) : aucune couleur en dur ici.

export type CouleurColette = "jaune" | "lilas" | "ciel" | "ocre";
export type Humeur = "contente" | "surprise" | "fiere" | "decue" | "fachee" | "concentree" | "dort";
export type Accessoire =
  | "aucun"
  | "photo"
  | "design"
  | "dev"
  | "data"
  | "coloc"
  | "covoit"
  | "diplome"
  | "bde"
  | "noel"
  | "casque"
  | "noeud"
  | "echarpe"
  | "cape"
  | "etoile"
  | "couronne"
  // Tenues de saison (portées par la mascotte, pas choisissables en avatar)
  | "cartable"
  | "sorciere"
  | "cafe";
export type Motif = "uni" | "ligne" | "pois" | "quadrille" | "dore";
export type AnimColette = "flotte" | "coucou" | "lit" | "tampon" | "accroche" | "saute" | "dort" | "cherche" | "reflechit" | "debordee";

const PAPIER: Record<CouleurColette, [string, string]> = {
  jaune: ["var(--color-postit-jaune)", "var(--color-coin-jaune)"],
  lilas: ["var(--color-postit-lilas)", "var(--color-coin-lilas)"],
  ciel: ["var(--color-postit-ciel)", "var(--color-coin-ciel)"],
  ocre: ["var(--color-postit-ocre)", "var(--color-coin-ocre)"],
};

const K = "var(--color-encre)";
const ROUGE = "var(--color-accent)";
const BLANC = "var(--color-surface)";

// L'humeur imposée par certaines animations.
const HUMEUR_ANIM: Partial<Record<AnimColette, Humeur>> = {
  lit: "concentree",
  tampon: "fachee",
  saute: "fiere",
  dort: "dort",
  reflechit: "concentree",
  debordee: "surprise",
};

function Yeux({ h, anim }: { h: Humeur; anim?: AnimColette }) {
  if (anim === "cherche")
    return (
      <g>
        <circle cx="66" cy="76" r="13" fill={K} />
        <circle cx="100" cy="76" r="13" fill={K} />
        <rect x="74" y="70" width="18" height="10" fill={K} />
        <circle cx="62" cy="72" r="4" fill="var(--color-ciel)" />
        <circle cx="96" cy="72" r="4" fill="var(--color-ciel)" />
      </g>
    );
  if (anim === "reflechit")
    return (
      <g className="col-yeux">
        <ellipse cx="69" cy="74" rx="4.5" ry="6.5" fill={K} />
        <ellipse cx="103" cy="74" rx="4.5" ry="6.5" fill={K} />
        <path d="M58 62 L72 60 M94 60 L108 64" stroke={K} strokeWidth="3" strokeLinecap="round" />
      </g>
    );
  if (anim === "debordee")
    return (
      <g className="col-affole">
        <circle cx="66" cy="76" r="9" fill={BLANC} stroke={K} strokeWidth="3" />
        <circle cx="100" cy="76" r="9" fill={BLANC} stroke={K} strokeWidth="3" />
        <circle className="col-pupille" cx="66" cy="77" r="3.5" fill={K} />
        <circle className="col-pupille" cx="100" cy="77" r="3.5" fill={K} />
      </g>
    );
  switch (h) {
    case "surprise":
      return (
        <g>
          <circle cx="66" cy="76" r="9" fill={BLANC} stroke={K} strokeWidth="3" />
          <circle cx="100" cy="76" r="9" fill={BLANC} stroke={K} strokeWidth="3" />
          <circle cx="66" cy="77" r="3.5" fill={K} />
          <circle cx="100" cy="77" r="3.5" fill={K} />
        </g>
      );
    case "fiere":
      return (
        <g>
          <path d="M58 80 Q66 70 74 80 M92 80 Q100 70 108 80" stroke={K} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </g>
      );
    case "decue":
      return (
        <g className="col-yeux">
          <ellipse cx="66" cy="80" rx="4.5" ry="6" fill={K} />
          <ellipse cx="100" cy="80" rx="4.5" ry="6" fill={K} />
          <path d="M56 68 L72 62 M94 62 L110 68" stroke={K} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "fachee":
      return (
        <g className="col-yeux">
          <ellipse cx="66" cy="80" rx="5" ry="5.5" fill={K} />
          <ellipse cx="100" cy="80" rx="5" ry="5.5" fill={K} />
          <path d="M55 64 L73 71 M93 71 L111 64" stroke={K} strokeWidth="3.5" strokeLinecap="round" />
        </g>
      );
    case "concentree":
      return <path d="M59 78 h14 M93 78 h14 M56 66 L72 68 M94 68 L110 66" stroke={K} strokeWidth="3.5" strokeLinecap="round" />;
    case "dort":
      return <path d="M59 80 Q66 86 73 80 M93 80 Q100 86 107 80" stroke={K} strokeWidth="3.5" fill="none" strokeLinecap="round" />;
    default:
      return (
        <g className="col-yeux">
          <ellipse cx="66" cy="78" rx="5" ry="7" fill={K} />
          <ellipse cx="100" cy="78" rx="5" ry="7" fill={K} />
        </g>
      );
  }
}

function Bouche({ h, anim }: { h: Humeur; anim?: AnimColette }) {
  if (anim === "debordee") return <path d="M70 104 Q74 100 78 104 Q82 108 86 104 Q90 100 94 104" stroke={K} strokeWidth="3" fill="none" strokeLinecap="round" />;
  if (anim === "reflechit") return <path d="M76 102 Q83 99 90 102" stroke={K} strokeWidth="3.5" fill="none" strokeLinecap="round" />;
  switch (h) {
    case "surprise":
      return <ellipse cx="83" cy="103" rx="5" ry="6.5" fill={K} />;
    case "fiere":
      return <path d="M68 94 Q83 116 98 94 Z" fill={K} />;
    case "decue":
      return <path d="M72 106 Q83 96 94 106" stroke={K} strokeWidth="3.5" fill="none" strokeLinecap="round" />;
    case "fachee":
      return <path d="M74 102 L92 102" stroke={K} strokeWidth="3.5" strokeLinecap="round" />;
    case "concentree":
      return (
        <g>
          <path d="M74 100 h16" stroke={K} strokeWidth="3.5" strokeLinecap="round" />
          <ellipse cx="90" cy="104" rx="4" ry="4.5" fill={ROUGE} />
        </g>
      );
    case "dort":
      return <ellipse cx="83" cy="106" rx="4" ry="3" fill={K} />;
    default:
      return <path d="M72 96 Q83 108 94 96" stroke={K} strokeWidth="3.5" fill="none" strokeLinecap="round" />;
  }
}

function Bras({ h, anim }: { h: Humeur; anim?: AnimColette }) {
  const trait = { stroke: K, strokeWidth: 4, fill: "none", strokeLinecap: "round" as const };
  if (anim === "coucou")
    return (
      <g>
        <path d="M30 92 Q14 100 14 116" {...trait} />
        <g className="col-coucou">
          <path d="M136 92 Q152 82 154 62" {...trait} />
        </g>
      </g>
    );
  if (anim === "reflechit") return <path d="M30 92 Q14 100 14 116" {...trait} />;
  if (anim === "debordee")
    return (
      <g>
        <g className="col-agite">
          <path d="M30 90 Q12 76 10 54" {...trait} />
        </g>
        <g className="col-agite col-agite-2">
          <path d="M136 90 Q154 76 156 54" {...trait} />
        </g>
      </g>
    );
  if (anim === "lit" || anim === "tampon" || anim === "accroche") return <path d="M30 92 Q14 100 14 116" {...trait} />;
  if (anim === "saute" || h === "fiere" || h === "surprise") return <path d="M30 90 Q14 74 12 56 M136 90 Q152 74 154 56" {...trait} />;
  if (h === "fachee") return <path d="M30 92 Q16 104 34 112 M136 92 Q150 104 132 112" {...trait} />;
  if (anim === "dort") return null;
  return <path d="M30 92 Q14 100 14 116 M136 92 Q152 100 152 116" {...trait} />;
}

function AccessoireDevant({ a }: { a: Accessoire }) {
  switch (a) {
    case "photo":
      return (
        <g>
          <rect x="54" y="108" width="58" height="34" rx="5" fill={K} />
          <rect x="62" y="103" width="16" height="7" rx="2" fill={K} />
          <circle cx="83" cy="125" r="11" fill="var(--color-ciel)" stroke={BLANC} strokeWidth="3" />
          <circle cx="102" cy="114" r="2.5" fill={ROUGE} />
        </g>
      );
    case "dev":
      return (
        <g>
          <circle cx="66" cy="78" r="12" fill="none" stroke={K} strokeWidth="3" />
          <circle cx="100" cy="78" r="12" fill="none" stroke={K} strokeWidth="3" />
          <path d="M78 78 h10" stroke={K} strokeWidth="3" />
          <path d="M70 122 l-8 8 l8 8 M96 122 l8 8 l-8 8 M88 118 l-10 24" stroke="var(--color-encre-bleue)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </g>
      );
    case "design":
      return (
        <g>
          <path d="M36 36 Q50 8 104 20 Q92 36 36 36 Z" fill={K} />
          <circle cx="72" cy="12" r="4" fill={K} />
          <path d="M150 116 L164 90" stroke="var(--color-bois)" strokeWidth="5" strokeLinecap="round" />
          <path d="M164 90 l4 -10" stroke="var(--color-lilas)" strokeWidth="7" strokeLinecap="round" />
        </g>
      );
    case "data":
      return (
        <g stroke={K} strokeWidth="2">
          <rect x="56" y="118" width="12" height="20" fill="var(--color-ciel)" />
          <rect x="74" y="108" width="12" height="30" fill="var(--color-lilas)" />
          <rect x="92" y="98" width="12" height="40" fill="var(--color-bandeau)" />
        </g>
      );
    case "coloc":
      return (
        <g>
          <rect x="44" y="110" width="78" height="40" rx="2" fill="var(--color-ocre)" stroke={K} strokeWidth="2.5" />
          <path d="M44 120 h78 M83 110 v10" stroke="var(--color-coin-ocre)" strokeWidth="4" />
        </g>
      );
    case "covoit":
      return (
        <g>
          <path d="M34 34 Q56 4 112 24 L134 30 Q120 38 34 34 Z" fill="var(--color-encre-bleue)" />
          <circle cx="83" cy="128" r="20" fill="none" stroke={K} strokeWidth="6" />
          <path d="M63 128 h40 M83 128 v20" stroke={K} strokeWidth="4" />
        </g>
      );
    case "diplome":
      return (
        <g>
          <path d="M40 22 L83 6 L126 22 L83 38 Z" fill={K} />
          <rect x="66" y="28" width="34" height="12" fill={K} />
          <path d="M126 22 v22" stroke="var(--color-bandeau)" strokeWidth="3" />
          <circle cx="126" cy="46" r="4" fill="var(--color-bandeau)" />
        </g>
      );
    case "bde":
      return (
        <g>
          <rect x="52" y="68" width="28" height="18" rx="5" fill={K} />
          <rect x="86" y="68" width="28" height="18" rx="5" fill={K} />
          <path d="M80 74 h6" stroke={K} strokeWidth="3" />
        </g>
      );
    case "casque":
      return (
        <g>
          <path d="M34 66 Q34 22 83 22 Q132 22 132 66" stroke={K} strokeWidth="6" fill="none" strokeLinecap="round" />
          <rect x="22" y="60" width="18" height="30" rx="7" fill={K} />
          <rect x="126" y="60" width="18" height="30" rx="7" fill={K} />
          <rect x="25" y="64" width="9" height="22" rx="4" fill="var(--color-accent)" />
          <rect x="132" y="64" width="9" height="22" rx="4" fill="var(--color-accent)" />
        </g>
      );
    case "noeud":
      return (
        <g stroke={K} strokeWidth="2" strokeLinejoin="round">
          <path d="M83 120 L64 110 L64 132 Z" fill={ROUGE} />
          <path d="M83 120 L102 110 L102 132 Z" fill={ROUGE} />
          <circle cx="83" cy="121" r="5" fill={ROUGE} />
        </g>
      );
    case "echarpe":
      return (
        <g stroke={K} strokeWidth="2" strokeLinejoin="round">
          <path d="M28 112 Q83 126 138 112 L138 126 Q83 140 28 126 Z" fill="var(--color-lilas)" />
          <path d="M104 124 L112 158 L98 160 L94 128 Z" fill="var(--color-lilas)" />
          <path d="M40 118 v10 M56 121 v10 M72 123 v10 M88 123 v10 M120 120 v10" stroke="var(--color-coin-lilas)" strokeWidth="3" />
        </g>
      );
    case "etoile":
      return (
        <g>
          <path d="M108 104 l4.5 9 10 1.4 -7.2 7 1.7 10 -9 -4.7 -9 4.7 1.7 -10 -7.2 -7 10 -1.4 z" fill="var(--color-bandeau)" stroke={K} strokeWidth="2" strokeLinejoin="round" />
          <circle cx="108" cy="118" r="2.5" fill={K} />
        </g>
      );
    case "couronne":
      return (
        <g>
          <path d="M46 34 L50 8 L66 24 L83 4 L100 24 L116 8 L120 34 Z" fill="var(--color-bandeau)" stroke={K} strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="66" cy="27" r="3" fill={ROUGE} />
          <circle cx="100" cy="27" r="3" fill="var(--color-ciel)" />
        </g>
      );
    case "cartable":
      return <path d="M44 34 Q40 80 50 110 M122 34 Q126 80 116 110" stroke="var(--color-bois)" strokeWidth="6" fill="none" strokeLinecap="round" />;
    case "sorciere":
      return (
        <g stroke={K} strokeWidth="2.5" strokeLinejoin="round">
          <path d="M22 38 Q83 24 144 38 Q83 50 22 38 Z" fill={K} />
          <path d="M54 36 L92 -30 Q96 -22 104 -26 L110 36 Z" fill={K} />
          <path d="M58 30 Q83 24 108 30 L108 36 Q83 30 58 36 Z" fill="var(--color-ocre)" stroke="none" />
        </g>
      );
    case "cafe":
      return (
        <g>
          <path d="M58 88 Q66 92 74 88 M92 88 Q100 92 108 88" stroke="var(--color-lilas)" strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="132" y="104" width="26" height="30" rx="3" fill={BLANC} stroke={K} strokeWidth="2.5" />
          <path d="M158 112 q10 2 0 14" stroke={K} strokeWidth="2.5" fill="none" />
          <rect x="136" y="114" width="18" height="6" fill="var(--color-bois)" />
          <path className="col-vapeur" d="M140 98 q4 -6 0 -12 M150 98 q4 -6 0 -12" stroke="var(--color-encre-douce)" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      );
    case "noel":
      return (
        <g>
          <path d="M32 36 Q60 -10 120 8 Q132 26 134 36 Z" fill={ROUGE} />
          <rect x="28" y="30" width="110" height="12" rx="6" fill={BLANC} />
          <circle cx="122" cy="8" r="8" fill={BLANC} />
        </g>
      );
    default:
      return null;
  }
}

// Pièces portées derrière le corps (la cape, le cartable).
function AccessoireDerriere({ a }: { a: Accessoire }) {
  if (a === "cartable")
    return <rect x="18" y="52" width="130" height="78" rx="14" fill="var(--color-bois)" stroke={K} strokeWidth="2.5" />;
  if (a !== "cape") return null;
  return <path d="M34 40 Q8 110 22 170 L144 170 Q158 110 132 40 Z" fill={ROUGE} stroke={K} strokeWidth="2.5" strokeLinejoin="round" />;
}

// Motif imprimé sur le papier (débloqué en s'entraidant). Un id par motif : définitions identiques, donc sans conflit.
function MotifPapier({ m }: { m: Motif }) {
  if (m === "uni") return null;
  if (m === "dore")
    return (
      <g>
        <path d="M30 30 H136 V122 Q130 142 110 142 H30 Z" fill="var(--color-or)" />
        <path d="M44 30 L30 50 V64 L58 30 Z M78 30 L30 98 V108 L86 30 Z" fill={BLANC} opacity="0.35" />
      </g>
    );
  const id = `colette-motif-${m}`;
  return (
    <g>
      <defs>
        {m === "ligne" && (
          <pattern id={id} width="10" height="12" patternUnits="userSpaceOnUse">
            <path d="M0 11.5 H10" stroke="var(--color-ciel)" strokeWidth="1.2" />
          </pattern>
        )}
        {m === "pois" && (
          <pattern id={id} width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="4" cy="4" r="2.4" fill={BLANC} opacity="0.8" />
            <circle cx="12" cy="12" r="2.4" fill={BLANC} opacity="0.8" />
          </pattern>
        )}
        {m === "quadrille" && (
          <pattern id={id} width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M10 0 V10 M0 10 H10" stroke="var(--color-encre)" strokeOpacity="0.14" strokeWidth="1" />
          </pattern>
        )}
      </defs>
      <path d="M30 30 H136 V122 Q130 142 110 142 H30 Z" fill={`url(#${id})`} />
      {m === "ligne" && <path d="M44 32 V140" stroke={ROUGE} strokeOpacity="0.55" strokeWidth="1.5" />}
    </g>
  );
}

// Décor propre à chaque animation (CV, tampon, mur, bulles de pensée, post-it qui volent...).
function Decor({ anim, devant }: { anim?: AnimColette; devant: boolean }) {
  if (!devant) {
    if (anim === "lit")
      return (
        <g>
          <rect x="120" y="58" width="62" height="80" rx="3" fill={BLANC} stroke={K} strokeWidth="2.5" />
          <rect className="col-ligne" x="128" y="70" width="44" height="5" rx="2" fill="var(--color-ciel)" />
          <rect className="col-ligne col-ligne-2" x="128" y="82" width="36" height="5" rx="2" fill="var(--color-lilas)" />
          <rect className="col-ligne col-ligne-3" x="128" y="94" width="40" height="5" rx="2" fill="var(--color-bandeau)" />
          <rect x="128" y="106" width="30" height="5" rx="2" fill="var(--color-ligne)" />
        </g>
      );
    if (anim === "tampon")
      return (
        <g>
          <rect x="118" y="120" width="70" height="46" rx="3" fill="var(--color-postit-lilas)" />
          <g className="col-ok">
            <rect x="130" y="130" width="46" height="26" rx="4" fill="none" stroke="var(--color-ok)" strokeWidth="3" />
            <path d="M142 143 l6 6 l12 -12" stroke="var(--color-ok)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          </g>
        </g>
      );
    if (anim === "accroche")
      return (
        <g>
          <rect x="146" y="10" width="44" height="130" rx="4" fill="var(--color-papier-fonce)" />
          <g className="col-punaise-tombe">
            <circle cx="170" cy="30" r="6" fill={ROUGE} />
          </g>
        </g>
      );
    return null;
  }
  if (anim === "lit")
    return (
      <g className="col-loupe">
        <path d="M136 96 Q130 94 132 86" stroke={K} strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="140" cy="76" r="13" fill="var(--color-ciel)" fillOpacity="0.35" stroke={K} strokeWidth="4" />
        <path d="M131 86 L122 98" stroke={K} strokeWidth="5" strokeLinecap="round" />
      </g>
    );
  if (anim === "tampon")
    return (
      <g className="col-tampon">
        <path d="M136 92 Q146 92 150 100" stroke={K} strokeWidth="4" fill="none" strokeLinecap="round" />
        <rect x="142" y="80" width="22" height="18" rx="3" fill={K} />
        <rect x="136" y="98" width="34" height="10" rx="2" fill={ROUGE} />
      </g>
    );
  if (anim === "accroche")
    return (
      <g>
        <path d="M136 92 Q146 86 150 80" stroke={K} strokeWidth="4" fill="none" strokeLinecap="round" />
        <g className="col-colle">
          <rect x="128" y="64" width="34" height="34" rx="2" fill="var(--color-postit-ciel)" stroke={K} strokeWidth="1.5" />
        </g>
      </g>
    );
  if (anim === "reflechit")
    return (
      <g>
        {/* Main au menton */}
        <path d="M136 98 Q148 118 100 116" stroke={K} strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="98" cy="114" r="5" fill={K} />
        <circle className="col-pensee" cx="138" cy="44" r="4" fill={BLANC} stroke={K} strokeWidth="2" />
        <circle className="col-pensee col-pensee-2" cx="150" cy="28" r="6" fill={BLANC} stroke={K} strokeWidth="2" />
        <g className="col-pensee col-pensee-3">
          <ellipse cx="170" cy="4" rx="24" ry="16" fill={BLANC} stroke={K} strokeWidth="2.5" />
          <circle className="col-point" cx="160" cy="4" r="3" fill={K} />
          <circle className="col-point col-point-2" cx="170" cy="4" r="3" fill={K} />
          <circle className="col-point col-point-3" cx="180" cy="4" r="3" fill={K} />
        </g>
      </g>
    );
  if (anim === "debordee")
    return (
      <g>
        <path className="col-goutte" d="M128 52 q6 10 0 14 q-6 -4 0 -14 z" fill="var(--color-ciel)" stroke={K} strokeWidth="1.5" />
        <g className="col-orbite">
          <rect x="-10" y="-10" width="20" height="20" rx="1.5" fill="var(--color-postit-lilas)" stroke={K} strokeWidth="1.5" transform="translate(83 -18) rotate(12)" />
          <rect x="-10" y="-10" width="20" height="20" rx="1.5" fill="var(--color-postit-ciel)" stroke={K} strokeWidth="1.5" transform="translate(178 90) rotate(-15)" />
          <rect x="-10" y="-10" width="20" height="20" rx="1.5" fill="var(--color-postit-ocre)" stroke={K} strokeWidth="1.5" transform="translate(-12 96) rotate(20)" />
          <rect x="-10" y="-10" width="20" height="20" rx="1.5" fill="var(--color-postit-jaune)" stroke={K} strokeWidth="1.5" transform="translate(150 176) rotate(-8)" />
        </g>
        <rect x="38" y="112" width="18" height="18" rx="1.5" fill="var(--color-postit-ciel)" stroke={K} strokeWidth="1.2" transform="rotate(-10 47 121)" />
        <rect x="106" y="40" width="16" height="16" rx="1.5" fill="var(--color-postit-lilas)" stroke={K} strokeWidth="1.2" transform="rotate(14 114 48)" />
      </g>
    );
  if (anim === "dort")
    return (
      <g fontFamily="var(--font-main)" fontWeight="700" fill="var(--color-encre-douce)">
        <text className="col-z" x="128" y="44" fontSize="20">z</text>
        <text className="col-z col-z-2" x="136" y="38" fontSize="24">z</text>
        <text className="col-z col-z-3" x="144" y="32" fontSize="28">Z</text>
      </g>
    );
  return null;
}

export function Colette({
  couleur = "jaune",
  humeur = "contente",
  accessoire = "aucun",
  motif = "uni",
  saison = true,
  anim,
  taille = 120,
  titre,
  tete = false,
  className = "",
}: {
  couleur?: CouleurColette;
  humeur?: Humeur;
  accessoire?: Accessoire;
  motif?: Motif;
  /** La mascotte s'habille selon la date (rentrée, partiels, Noël...). Désactivé pour les avatars. */
  saison?: boolean;
  anim?: AnimColette;
  taille?: number;
  titre?: string;
  /** Seulement la tête (avatar) : ni jambes, ni bras, ni décor. */
  tete?: boolean;
  className?: string;
}) {
  const h = (anim && HUMEUR_ANIM[anim]) ?? humeur;
  const deSaison = saison && accessoire === "aucun" ? saisonDu(new Date()) : null;
  if (deSaison) accessoire = deSaison.tenue;
  const [fond, coin] = PAPIER[couleur];
  const joue = couleur === "lilas" ? "var(--color-ocre)" : "var(--color-lilas)";
  const cachePunaise = ["diplome", "noel", "couronne", "casque", "sorciere"].includes(accessoire);
  const corps = anim === "flotte" || anim === "coucou" ? "col-flotte" : anim === "saute" ? "col-saute" : anim === "dort" ? "col-respire" : anim === "cherche" ? "col-cherche" : anim === "debordee" ? "col-tremble" : anim === "reflechit" ? "col-penche" : "";

  return (
    <svg
      width={taille}
      height={tete ? taille : Math.round(taille * 1.12)}
      viewBox={tete ? "22 14 122 132" : "0 0 170 190"}
      className={`colette overflow-visible ${className}`}
      role={titre ? "img" : undefined}
      aria-label={titre}
      aria-hidden={titre ? undefined : true}
    >
      {!tete && <Decor anim={anim} devant={false} />}
      <g className={corps}>
        {!tete && anim !== "dort" && <path d="M66 140 L62 166 M100 140 L104 166" stroke={K} strokeWidth="4" strokeLinecap="round" />}
        {!tete && <AccessoireDerriere a={accessoire} />}
        {!tete && <Bras h={h} anim={anim} />}
        <path d="M30 30 H136 V122 Q130 142 110 142 H30 Z" fill={fond} />
        <MotifPapier m={motif} />
        <path d="M136 122 Q122 128 110 142 Q130 138 136 122 Z" fill={coin} />
        {h !== "dort" && (
          <g opacity="0.7">
            <circle cx="56" cy="94" r="6" fill={joue} />
            <circle cx="110" cy="94" r="6" fill={joue} />
          </g>
        )}
        <Yeux h={h} anim={anim} />
        <Bouche h={h} anim={anim} />
        {!cachePunaise && (
          <g>
            <circle cx="83" cy="30" r="10" fill={ROUGE} />
            <circle cx="80" cy="27" r="3" fill={BLANC} opacity="0.75" />
          </g>
        )}
        <AccessoireDevant a={accessoire} />
      </g>
      {!tete && <Decor anim={anim} devant />}
    </svg>
  );
}

// Couleur et accessoire d'avatar dérivés du pseudo quand l'étudiant n'a rien choisi.
export function coletteParDefaut(pseudo: string): { couleur: CouleurColette } {
  let h = 0;
  for (const c of pseudo) h = (h * 31 + c.charCodeAt(0)) | 0;
  return { couleur: (["jaune", "lilas", "ciel", "ocre"] as const)[Math.abs(h) % 4] };
}
