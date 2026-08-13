import type { Kind } from "@/lib/types";

// Acomodos del panel (pensados para el iPad de pared, ≥768px):
// "3v"   → 3 columnas verticales
// "2v1h" → 2 columnas verticales arriba + 1 fila horizontal abajo
export type LayoutMode = "3v" | "2v1h";

export const LAYOUT_LABELS: Record<LayoutMode, string> = {
  "3v": "3 columnas",
  "2v1h": "2 + fila",
};

// Asignación default de listas a zonas. En "2v1h" las zonas son:
// [columna izquierda, columna derecha, fila horizontal de abajo].
export const DEFAULT_ASSIGNMENTS: Record<LayoutMode, Kind[]> = {
  "3v": ["task", "date", "project"],
  "2v1h": ["task", "project", "date"],
};

const MODE_KEY = "radar-layout-mode";
const ASSIGN_KEYS: Record<LayoutMode, string> = {
  "3v": "radar-layout-assign-3v",
  "2v1h": "radar-layout-assign-2v1h",
};

const ALL_KINDS: Kind[] = ["task", "date", "project"];

/** Válido solo si es una permutación exacta de las 3 listas. */
function isValidAssignment(value: unknown): value is Kind[] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    ALL_KINDS.every((k) => value.includes(k))
  );
}

/** Lee las preferencias guardadas en ESTE dispositivo (cada pantalla
 *  recuerda su propio acomodo — el iPad de la pared, lo suyo). */
export function loadLayoutPrefs(): {
  mode: LayoutMode;
  assignments: Record<LayoutMode, Kind[]>;
} {
  const prefs = {
    mode: "3v" as LayoutMode,
    assignments: { ...DEFAULT_ASSIGNMENTS },
  };
  try {
    const mode = localStorage.getItem(MODE_KEY);
    if (mode === "3v" || mode === "2v1h") prefs.mode = mode;
  } catch {
    // localStorage inaccesible → defaults.
  }
  // Cada layout se lee por separado: si UNA entrada está corrupta, la otra
  // (válida) se conserva en vez de descartarse junto con ella.
  for (const m of ["3v", "2v1h"] as const) {
    try {
      const raw = localStorage.getItem(ASSIGN_KEYS[m]);
      if (!raw) continue;
      const parsed: unknown = JSON.parse(raw);
      if (isValidAssignment(parsed)) prefs.assignments[m] = parsed;
    } catch {
      // Entrada corrupta → default solo para este layout.
    }
  }
  return prefs;
}

export function saveLayoutMode(mode: LayoutMode) {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {}
}

export function saveAssignment(mode: LayoutMode, zones: Kind[]) {
  try {
    localStorage.setItem(ASSIGN_KEYS[mode], JSON.stringify(zones));
  } catch {}
}
