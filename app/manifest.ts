import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bibliothèque Ebene BLON",
    short_name: "Eblon Biblio LMF",
    description:
      "Gestion de la Bibliothèque : livres, élèves, prêts, retours, QR codes et statistiques.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f7fb",
    theme_color: "#2f6fed",
    lang: "fr",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/icon-512.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
