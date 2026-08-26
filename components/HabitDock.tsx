"use client";

import Link from "next/link";
import { Activity, Check, Plus, X } from "lucide-react";
import type { Habit, HabitCompletion } from "@/lib/habits";
import {
  doneInCurrentPeriod, habitColorVar, habitIcon,
  lastDoneLabel, periodStreak,
} from "@/lib/habits";
import { formatShortDate } from "@/lib/dates";

/**
 * Dock de hábitos: un tap marca o desmarca el hábito en el DÍA SELECCIONADO
 * (hoy por default; se puede editar cualquier día pasado desde la semana).
 * Completado hoy → racha; pendiente hoy → "última vez". En días pasados,
 * el estado es simplemente hecho / sin registro de ese día.
 */
export default function HabitDock({
  habits,
  completions,
  date,
  today,
  onToggle,
  onBackToToday,
}: {
  habits: Habit[];
  completions: HabitCompletion[];
  /** Día que se está editando (YYYY-MM-DD). */
  date: string;
  /** Hoy real (YYYY-MM-DD). */
  today: string;
  onToggle: (habit: Habit, wasDone: boolean) => void;
  onBackToToday: () => void;
}) {
  const isToday = date === today;
  const doneByHabit = new Map<string, Set<string>>();
  for (const c of completions) {
    if (!doneByHabit.has(c.habit_id)) doneByHabit.set(c.habit_id, new Set());
    doneByHabit.get(c.habit_id)!.add(c.done_on);
  }
  const pending = habits.filter(
    (h) => !doneInCurrentPeriod(doneByHabit.get(h.id) ?? new Set(), today, h.periodicity)
  ).length;

  return (
    <section className="flex flex-none flex-col gap-2" aria-label="Hábitos">
      <div className="flex items-center gap-2">
        <Activity className="icon text-muted" aria-hidden="true" />
        <h2 className="font-display text-lg text-default">Hábitos</h2>
        {isToday && pending > 0 && (
          <>
            <span className="badge-count">{pending}</span>
            <span className="text-xs text-muted">pendientes</span>
          </>
        )}
        {!isToday && (
          <span
            className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ background: "var(--c-warning-bg)", color: "var(--c-on-warning-bg)" }}
          >
            editando {formatShortDate(date)}
            <button
              type="button"
              aria-label="Volver a hoy"
              className="grid h-6 w-6 place-items-center"
              onClick={onBackToToday}
            >
              <X size={12} strokeWidth={2} aria-hidden="true" />
            </button>
          </span>
        )}
      </div>

      <ul className="scroll-panel-x flex gap-3">
        {habits.map((h) => {
          const dates = doneByHabit.get(h.id) ?? new Set<string>();
          const done = dates.has(date);
          const Icon = habitIcon(h.icon);
          const legend = isToday
            ? done
              ? (() => {
                  const s = periodStreak(dates, today, h.periodicity);
                  return s.count > 1
                    ? `x${s.count} ${s.unit} seguidos`
                    : "¡ya empezaste!";
                })()
              : lastDoneLabel([...dates], today)
            : done
              ? "hecho este día"
              : "sin registro este día";
          return (
            <li key={h.id} className="w-44 flex-none">
              <button
                type="button"
                aria-pressed={done}
                aria-label={
                  done
                    ? `Desmarcar "${h.title}" del ${formatShortDate(date)}`
                    : `Marcar "${h.title}" como hecho el ${formatShortDate(date)}`
                }
                onClick={() => onToggle(h, done)}
                className={`relative flex w-full flex-col items-center gap-1.5 rounded-[var(--radius-md)] border px-3 pb-3 pt-4 transition-colors ${
                  done
                    ? "border-[var(--c-accent)] bg-app"
                    : "border-default bg-surface"
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
                <span style={{ color: habitColorVar(h.color) }}>
                  <Icon size={30} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="max-w-full truncate text-sm font-semibold text-default">
                  {h.title}
                </span>
                {done && isToday ? (
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
        <li className="w-44 flex-none">
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
