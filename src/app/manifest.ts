import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Açaí do Bairro | Cardápio Digital",
    short_name: "Açaí do Bairro",
    description:
      "Peça seu açaí online — monte do seu jeito, acompanhe o pedido e receba fresquinho em casa.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff8f1",
    theme_color: "#521a88",
    orientation: "portrait",
    icons: [
      { src: "/pwa-icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
