import { ImageResponse } from "next/og";

// Image d'aperçu quand on partage le lien (WhatsApp, Instagram, Discord...).
// Les couleurs sont écrites en dur ici car ImageResponse ne lit pas les variables CSS du thème :
// ce fichier est la seule exception du test front-portable (mêmes valeurs que globals.css).
export const alt = "L'entraide du campus : propose ce que tu sais faire, trouve ce dont tu as besoin";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 32, padding: 80, background: "#fafaf8", color: "#111111" }}>
        <div style={{ display: "flex" }}>
          <div style={{ background: "#f3e54a", padding: "8px 24px", fontSize: 88, fontWeight: 900, letterSpacing: -2 }}>L&apos;ENTRAIDE DU CAMPUS</div>
        </div>
        <div style={{ fontSize: 40, color: "#5a5a5a" }}>Propose ce que tu sais faire, trouve ce dont tu as besoin.</div>
        <div style={{ display: "flex", gap: 16, fontSize: 30 }}>
          <div style={{ background: "#faf1a8", padding: "6px 20px", borderRadius: 999 }}>Je propose</div>
          <div style={{ background: "#e6ddf7", padding: "6px 20px", borderRadius: 999 }}>Je cherche</div>
          <div style={{ background: "#111111", color: "#ffffff", padding: "6px 20px", borderRadius: 999 }}>ESD × ESP Bordeaux</div>
        </div>
      </div>
    ),
    size,
  );
}
