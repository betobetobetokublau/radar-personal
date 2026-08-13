import { NextResponse } from "next/server";

// Colector público de respuestas de validación de raicode. Las respuestas
// se ven en el tablero de raicode — aquí NO se guarda nada.
const COLLECTOR_URL =
  "https://raicode.ai/api/projects/aab96b79-7af9-4c8b-be51-f752318371f9/responses";

// Tope de tamaño del body (los campos suman máx ~2.2 KB; 16 KB es holgado).
// Sin esto, un abusivo podría mandar cuerpos gigantes a esta ruta pública.
const MAX_BODY_BYTES = 16_384;

// Freno simple por IP (por instancia): 5 envíos por minuto bastan para
// humanos y cortan ráfagas de bots baratos.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, { count: number; windowStart: number }>();

function throttled(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (!contentLength || contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false }, { status: 413 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (throttled(ip)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: { email?: unknown; answer?: unknown; module?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  // "null" es JSON válido: sin este chequeo, body.email truena con un 500
  // en vez de responder 400.
  if (body === null || typeof body !== "object") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().slice(0, 200) : "";
  const answer =
    typeof body.answer === "string" ? body.answer.trim().slice(0, 2000) : "";
  // `module` separa los experimentos en el tablero de raicode. Lista blanca
  // estricta: nunca reenviar texto arbitrario del cliente en este campo.
  const module = body.module === "crecer" ? "crecer" : undefined;

  // Validación mínima: correo con forma de correo y respuesta no vacía.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || answer.length === 0) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const res = await fetch(COLLECTOR_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(module ? { email, answer, module } : { email, answer }),
      // Si el colector se cuelga, soltamos a los 10s en vez de detener
      // la función hasta el timeout de la plataforma.
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
