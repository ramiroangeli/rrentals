import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rrentals",
    short_name: "Rrentals",
    description: "Registro de caja para el alquiler de autos en Queensland.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f4c42",
    theme_color: "#0f4c42",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
