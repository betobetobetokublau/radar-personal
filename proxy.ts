import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Convención de Next 16: este archivo se llama "proxy" (antes "middleware").
// Corre en cada request: refresca la sesión y protege las rutas.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Todas las rutas excepto estáticos y assets generados
     * (_next, favicon, íconos, manifest, imágenes).
     */
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
