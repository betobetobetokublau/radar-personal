import type { Metadata, Viewport } from "next";
import { Archivo, Instrument_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Branding propio (2026-08-13): Archivo para display (grotesca geométrica,
// misma sangre que la "B" del logo) e Instrument Sans para texto.
const display = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = Instrument_Sans({
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
      data-theme="radar"
      className={`${display.variable} ${body.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: darkModeScript }} />
      </head>
      <body className="bg-app font-body text-default">
        {children}
        {/* Vistas básicas de Vercel Analytics (plan Hobby): SIN track() ni
            eventos custom — son de plan Pro y fallan en silencio en gratis. */}
        <Analytics />
      </body>
    </html>
  );
}
