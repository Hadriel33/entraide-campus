import type { MetadataRoute } from "next";

// Appli installable sur le téléphone (« Ajouter à l'écran d'accueil ») : icône Colette, plein écran, sans App Store.
// Les couleurs sont écrites ici car le manifeste est lu par le téléphone, hors du thème CSS (comme opengraph-image).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Post-it campus",
    short_name: "Post-it",
    description: "Le tableau d'entraide des étudiants de l'ESD et de l'ESP Bordeaux.",
    start_url: "/bureau",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafaf8",
    theme_color: "#f3e54a",
    lang: "fr",
    categories: ["education", "social"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
    shortcuts: [
      { name: "Publier une annonce", url: "/annonces/nouvelle" },
      { name: "Mes demandes", url: "/demandes" },
      { name: "Le tableau en direct", url: "/mur" },
    ],
  };
}
