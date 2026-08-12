import type { MetadataRoute } from "next";

// Los colores vienen de los tokens del tema "seria" (app/globals.css):
// --c-accent y --c-bg. El manifest es JSON estático — no puede leer CSS.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Radar Personal",
    short_name: "Radar",
    description: "Tareas, fechas importantes y proyectos — siempre a la mano",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F8FA",
    theme_color: "#1C4E80",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
