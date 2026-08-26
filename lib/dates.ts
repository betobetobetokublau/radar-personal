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
  return toYmd(new Date());
}

export function toYmd(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() + n);
  return copy;
}

/** Lunes de la semana de `d` (la semana SIEMPRE empieza en lunes). */
export function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0=Dom … 6=Sáb
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

export const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/** Etiqueta relativa para próximos eventos: "hoy", "mañana", "en 3 días",
 *  "en 2 semanas", "en 1 mes y medio", "en 2 meses". */
export function relativeUpcomingLabel(ymd: string): string {
  const n = daysUntil(ymd);
  if (n <= 0) return "hoy";
  if (n === 1) return "mañana";
  if (n < 7) return `en ${n} días`;
  if (n < 27) {
    const w = Math.round(n / 7);
    return w === 1 ? "en 1 semana" : `en ${w} semanas`;
  }
  const halves = Math.round(n / 15.2); // medios meses
  const months = Math.floor(halves / 2);
  const half = halves % 2 === 1;
  if (months === 0) return "en medio mes";
  if (months === 1) return half ? "en 1 mes y medio" : "en 1 mes";
  return half ? `en ${months} meses y medio` : `en ${months} meses`;
}
