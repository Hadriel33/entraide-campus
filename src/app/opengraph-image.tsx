import { ImageResponse } from "next/og";

// Image d'aperçu quand on partage le lien (WhatsApp, Instagram, Discord...).
// Les couleurs sont écrites en dur ici car ImageResponse ne lit pas les variables CSS du thème :
// ce fichier est la seule exception du test front-portable (mêmes valeurs que globals.css).
export const alt = "Post-it campus : le tableau d'entraide des étudiants ESD et ESP Bordeaux";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function PostIt({ fond, titre, note, rot, haut, gauche }: { fond: string; titre: string; note: string; rot: number; haut: number; gauche: number }) {
  return (
    <div
      style={{
        position: "absolute",
        top: haut,
        left: gauche,
        width: 300,
        height: 220,
        background: fond,
        transform: `rotate(${rot}deg)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "34px 26px 22px",
        boxShadow: "0 16px 24px -14px rgba(17,17,17,0.5)",
        borderRadius: "3px 3px 22px 3px",
      }}
    >
      <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.15 }}>{titre}</div>
      <div style={{ fontSize: 30, color: "#b91217", alignSelf: "flex-end" }}>{note}</div>
      <div style={{ position: "absolute", top: -12, left: 140, width: 26, height: 26, borderRadius: 999, background: "#d7141a" }} />
    </div>
  );
}

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#fafaf8", color: "#111111", padding: 70 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 26, width: 560 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 84, height: 84, background: "#fcf08f", transform: "rotate(-7deg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64, fontWeight: 900, boxShadow: "3px 4px 0 0 #111111" }}>P</div>
            <div style={{ fontSize: 76, fontWeight: 900, letterSpacing: -2 }}>POST-IT</div>
          </div>
          <div style={{ display: "flex", background: "#f3e54a", alignSelf: "flex-start", padding: "6px 18px", fontSize: 58, fontWeight: 900, letterSpacing: -1, boxShadow: "8px 8px 0 0 #b9a4de" }}>CAMPUS</div>
          <div style={{ fontSize: 34, color: "#5a5a5a", lineHeight: 1.3 }}>Le tableau d&apos;entraide des étudiants ESD et ESP Bordeaux.</div>
        </div>
        <PostIt fond="#e5daf7" titre="Shooting portrait pour ton book" note="Gratuit !" rot={-5} haut={60} gauche={680} />
        <PostIt fond="#d4e6f8" titre="Aide sur mon site Next.js" note="Troc" rot={4} haut={270} gauche={870} />
        <PostIt fond="#f6dfb4" titre="Covoit Mérignac lundi 8 h" note="Frais partagés" rot={-2} haut={330} gauche={640} />
      </div>
    ),
    size,
  );
}
