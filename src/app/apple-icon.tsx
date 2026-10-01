import { ImageResponse } from "next/og";

// Icône de l'écran d'accueil iPhone et Android : le post-it « P » penché.
// Couleurs écrites ici : ImageResponse ne lit pas les variables CSS (même exception que opengraph-image).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#111111" }}>
        <div
          style={{
            width: 118,
            height: 118,
            background: "#fcf08f",
            transform: "rotate(-7deg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 92,
            fontWeight: 900,
            color: "#111111",
            borderRadius: "4px 4px 22px 4px",
          }}
        >
          P
        </div>
      </div>
    ),
    size,
  );
}
