"use client";

import Link from "next/link";
import { Activity, Check, Plus } from "lucide-react";
import type { Habit, HabitCompletion } from "@/lib/habits";
import {
  COMPLEXITY_TONE, doneInCurrentPeriod, habitColorVar, habitIcon,
  lastDoneLabel, periodStreak,
} from "@/lib/habits";
import { todayYmd } from "@/lib/dates";

const TONE_VAR = {
  success: "var(--c-success)",
  warning: "var(--c-warning)",
  error: "var(--c-error)",
} as const;

/**
 * Dock de hábitos (barra inferior de la vista Semana): un tap marca o
 * desmarca el hábito de HOY. Completado → palomita + racha; pendiente →
 * "última vez". En móvil scrollea horizontal.
 */
export default function HabitDock({
  habits,
  completions,
  onToggle,
}: {
  habits: Habit[];
  completions: HabitCompletion[];
  onToggle: (habit: Habit, wasDone: boolean) => void;
}) {
  const today = todayYmd();
  const doneByHabit = new Map<string, Set<string>>();
  for (const c of completions) {
    if (!doneByHabit.has(c.habit_id)) doneByHabit.set(c.habit_id, new Set());
    doneByHabit.get(c.habit_id)!.add(c.done_on);
  }
  // Pendiente = no cumplido en SU periodo (día, semana o mes según el hábito).
  const pending = habits.filter(
    (h) => !doneInCurrentPeriod(doneByHabit.get(h.id) ?? new Set(), today, h.periodicity)
  ).length;

  return (
    <section className="flex flex-none flex-col gap-2" aria-label="Hábitos">
      <div className="flex items-center gap-2">
        <Activity className="icon text-muted" aria-hidden="true" />
        <h2 className="font-display text-lg text-default">Hábitos</h2>
        {pending > 0 && (
          <>
            <span className="badge-count">{pending}</span>
            <span className="text-xs text-muted">pendientes</span>
          </>
        )}
      </div>

      <ul className="scroll-panel-x flex gap-3 md:overflow-visible">
        {habits.map((h) => {
          const dates = doneByHabit.get(h.id) ?? new Set<string>();
          const done = dates.has(today);
          const Icon = habitIcon(h.icon);
          const legend = done
            ? (() => {
                const s = periodStreak(dates, today, h.periodicity);
                return s.count > 1
                  ? `x${s.count} ${s.unit} seguidos`
                  : "¡ya empezaste!";
              })()
            : lastDoneLabel([...dates], today);
          return (
            <li key={h.id} className="w-40 flex-none md:w-auto md:flex-1">
              <button
                type="button"
                aria-pressed={done}
                aria-label={done ? `Desmarcar "${h.title}" de hoy` : `Marcar "${h.title}" como hecho hoy`}
                onClick={() => onToggle(h, done)}
                className={`relative flex w-full flex-col items-center gap-1.5 rounded-[var(--radius-md)] border bg-surface px-3 pb-3 pt-4 transition-colors ${
                  done ? "border-[var(--c-accent)]" : "border-default"
                }`}
              >
                {done && (
                  <span
                    aria-hidden="true"
                    className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full"
                    style={{ background: "var(--c-success)", color: "var(--c-surface)" }}
                  >
                    <Check size={12} strokeWidth={2} />
                  </span>
                )}
                <span className="relative" style={{ color: habitColorVar(h.color) }}>
                  <Icon size={30} strokeWidth={1.75} aria-hidden="true" />
                  <span
                    title={`Complejidad ${h.complexity}`}
                    className="absolute -right-1.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--c-surface)]"
                    style={{ background: TONE_VAR[COMPLEXITY_TONE[h.complexity]] }}
                  ></span>
                </span>
                <span className="max-w-full truncate text-sm font-semibold text-default">
                  {h.title}
                </span>
                {done ? (
                  <span
                    className="rounded-full px-2 text-xs font-semibold"
                    style={{ background: "var(--c-success-bg)", color: "var(--c-on-success-bg)" }}
                  >
                    {legend}
                  </span>
                ) : (
                  <span className="text-xs text-muted">{legend}</span>
                )}
              </button>
            </li>
          );
        })}
        <li className="w-40 flex-none md:w-auto md:flex-1">
          <Link
            href="/habitos"
            className="flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-default bg-surface px-3 py-4 text-muted transition-colors hover:border-[var(--c-accent)]"
          >
            <Plus size={30} strokeWidth={1.75} aria-hidden="true" />
            <span className="text-sm font-semibold">
              {habits.length === 0 ? "Crear tu primer hábito" : "Administrar hábitos"}
            </span>
          </Link>
        </li>
      </ul>
    </section>
  );
}
