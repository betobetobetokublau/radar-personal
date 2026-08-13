import type { MetadataRoute } from "next";

// Colores = tokens del tema "radar" (app/globals.css): --c-accent y --c-bg.
// El manifest es JSON estático — no puede leer variables CSS.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Radar Personal",
    short_name: "Radar",
    description: "Tareas, fechas importantes y proyectos — siempre a la mano",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F7F8",
    theme_color: "#3C464A",
    icons: [
      {
        src: "/logo-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
