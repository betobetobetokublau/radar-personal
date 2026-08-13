import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // No poner código entre createServerClient y getUser: el refresh de la
  // sesión depende de que esta llamada ocurra de inmediato.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthPath = path.startsWith("/login") || path.startsWith("/dev-login");
  // Rutas PÚBLICAS (sin login): la página de validación/waitlist y su
  // endpoint de envío. Match EXACTO — con prefijos, cualquier ruta futura
  // bajo /validar* nacería pública sin que nadie lo note.
  const isPublicPath =
    path === "/validar" || path === "/api/validar" || path === "/crece";

  // Los redirects deben CONSERVAR las cookies que getUser() acaba de rotar
  // (viven en supabaseResponse); si no, la sesión renovada se pierde.
  function redirectTo(pathname: string) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const redirect = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie);
    });
    return redirect;
  }

  if (!user && !isAuthPath && !isPublicPath) {
    return redirectTo("/login");
  }

  if (user && isAuthPath) {
    return redirectTo("/");
  }

  return supabaseResponse;
}
