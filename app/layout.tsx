import type { Metadata, Viewport } from "next";
import { Libre_Franklin, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const display = Libre_Franklin({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Radar Personal",
  description: "Tareas, fechas importantes y proyectos — siempre a la mano",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Sin esto, iOS reporta env(safe-area-inset-*) = 0 y la barra de abajo
  // queda pegada al borde del iPhone (debajo de la barra del home).
  viewportFit: "cover",
};

// Decide el modo oscuro ANTES de pintar la página para evitar el parpadeo:
// respeta la preferencia del sistema en la primera visita; localStorage solo
// manda si el usuario cambió el modo con el toggle.
const darkModeScript = `(function(){try{var s=localStorage.getItem("theme");var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-theme="seria"
      className={`${display.variable} ${body.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: darkModeScript }} />
      </head>
      <body className="bg-app font-body text-default">{children}</body>
    </html>
  );
}
