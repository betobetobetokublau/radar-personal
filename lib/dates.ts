// Helpers de fechas para la columna "Fechas importantes".
// Todo se calcula comparando SOLO fechas (sin hora) en la zona horaria
// local del dispositivo — decisión del documento de diseño.

/** Parsea "YYYY-MM-DD" como fecha local (new Date("YYYY-MM-DD") sería UTC). */
export function parseLocalDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Días entre hoy (local, sin hora) y la fecha dada. Negativo si ya pasó. */
export function daysUntil(ymd: string): number {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = parseLocalDate(ymd);
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}

/** Texto de cuenta regresiva: "hoy", "mañana", "faltan N días", "pasó hace N días". */
export function countdownLabel(ymd: string): string {
  const n = daysUntil(ymd);
  if (n === 0) return "hoy";
  if (n === 1) return "mañana";
  if (n === -1) return "ayer";
  if (n > 1) return `faltan ${n} días`;
  return `pasó hace ${-n} días`;
}

/** Fecha corta legible: "15 sep 2026". */
export function formatShortDate(ymd: string): string {
  return parseLocalDate(ymd).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Hoy como "YYYY-MM-DD" local (para el min del input de fecha). */
export function todayYmd(): string {
  const t = new Date();
  const mm = String(t.getMonth() + 1).padStart(2, "0");
  const dd = String(t.getDate()).padStart(2, "0");
  return `${t.getFullYear()}-${mm}-${dd}`;
}
