import {
  Activity, BookOpen, Coffee, Dumbbell, Heart, Leaf, Moon, Music,
  Pencil, Sun, type LucideIcon,
} from "lucide-react";

export type HabitComplexity = "baja" | "media" | "alta";
export type HabitPeriodicity = "diaria" | "semanal" | "mensual";
export type HabitColor = "ambar" | "vino" | "azul" | "violeta" | "verde";

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  complexity: HabitComplexity;
  periodicity: HabitPeriodicity;
  icon: string;
  color: HabitColor;
  created_at: string;
}

export interface HabitCompletion {
  id: string;
  user_id: string;
  habit_id: string;
  done_on: string; // "YYYY-MM-DD"
  created_at: string;
}

// Set curado de íconos de hábito (Lucide — cero emoji, regla del DS).
export const HABIT_ICONS: Record<string, LucideIcon> = {
  sol: Sun,
  corazon: Heart,
  actividad: Activity,
  libro: BookOpen,
  pesa: Dumbbell,
  luna: Moon,
  cafe: Coffee,
  pluma: Pencil,
  musica: Music,
  hoja: Leaf,
};
export const DEFAULT_HABIT_ICON = "sol";
export function habitIcon(name: string): LucideIcon {
  return HABIT_ICONS[name] ?? HABIT_ICONS[DEFAULT_HABIT_ICON];
}

// Colores de identidad (tokens --c-habit-* del DS).
export const HABIT_COLORS: HabitColor[] = ["ambar", "vino", "azul", "violeta", "verde"];
export const habitColorVar = (c: HabitColor) => `var(--c-habit-${c})`;

export const COMPLEXITIES: HabitComplexity[] = ["baja", "media", "alta"];
export const PERIODICITIES: HabitPeriodicity[] = ["diaria", "semanal", "mensual"];
export const COMPLEXITY_LABEL: Record<HabitComplexity, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
};
// Tono semántico del badge de complejidad (baja=verde, media=ámbar, alta=rojo)
export const COMPLEXITY_TONE: Record<HabitComplexity, "success" | "warning" | "error"> = {
  baja: "success",
  media: "warning",
  alta: "error",
};
export const PERIODICITY_LABEL: Record<HabitPeriodicity, string> = {
  diaria: "Diaria",
  semanal: "Semanal",
  mensual: "Mensual",
};

/** Racha de días CONSECUTIVOS terminando hoy (hoy incluido). */
export function streakEndingToday(doneDates: Set<string>, todayYmd: string): number {
  if (!doneDates.has(todayYmd)) return 0;
  let streak = 0;
  const d = parseYmd(todayYmd);
  for (;;) {
    const ymd = toYmd(d);
    if (!doneDates.has(ymd)) break;
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/** Lunes (YYYY-MM-DD) de la semana de una fecha. */
function weekKey(ymd: string): string {
  const d = parseYmd(ymd);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return toYmd(d);
}
const monthKey = (ymd: string) => ymd.slice(0, 7);

/** ¿El hábito ya se cumplió en su PERIODO actual (día/semana/mes)? */
export function doneInCurrentPeriod(
  doneDates: Set<string>,
  todayYmd: string,
  periodicity: HabitPeriodicity
): boolean {
  if (periodicity === "diaria") return doneDates.has(todayYmd);
  const key = periodicity === "semanal" ? weekKey(todayYmd) : monthKey(todayYmd);
  const keyOf = periodicity === "semanal" ? weekKey : monthKey;
  for (const d of doneDates) if (keyOf(d) === key) return true;
  return false;
}

/** Racha en unidades del periodo del hábito, terminando en el periodo actual:
 *  diaria → días consecutivos; semanal → semanas consecutivas con al menos
 *  un completado; mensual → meses consecutivos. */
export function periodStreak(
  doneDates: Set<string>,
  todayYmd: string,
  periodicity: HabitPeriodicity
): { count: number; unit: string } {
  if (periodicity === "diaria") {
    return { count: streakEndingToday(doneDates, todayYmd), unit: "días" };
  }
  const keyOf = periodicity === "semanal" ? weekKey : monthKey;
  const keys = new Set([...doneDates].map(keyOf));
  let count = 0;
  const d = parseYmd(todayYmd);
  for (;;) {
    if (!keys.has(keyOf(toYmd(d)))) break;
    count += 1;
    if (periodicity === "semanal") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
  }
  return { count, unit: periodicity === "semanal" ? "semanas" : "meses" };
}

/** "hoy" / "ayer" / "hace N días" / "hace N semanas" / "sin registro". */
export function lastDoneLabel(doneDates: string[], todayYmd: string): string {
  if (doneDates.length === 0) return "sin registro aún";
  const last = doneDates.reduce((a, b) => (a > b ? a : b));
  const days = Math.round(
    (parseYmd(todayYmd).getTime() - parseYmd(last).getTime()) / 86_400_000
  );
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 14) return `hace ${days} días`;
  return `hace ${Math.round(days / 7)} semanas`;
}

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function toYmd(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
