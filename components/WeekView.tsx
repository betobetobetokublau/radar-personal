"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, TriangleAlert } from "lucide-react";
import { useItems } from "@/lib/useItems";
import { useHabits } from "@/lib/useHabits";
import type { Habit } from "@/lib/habits";
import { habitColorVar, habitIcon } from "@/lib/habits";
import {
  addDays, DAY_NAMES, daysUntil, formatShortDate, parseLocalDate,
  relativeUpcomingLabel, startOfWeek, todayYmd, toYmd,
} from "@/lib/dates";
import HabitDock from "@/components/HabitDock";
import Toast, { type ToastData } from "@/components/Toast";

/** "Hoy" como estado con tic de reloj: en una pantalla siempre prendida
 *  (el iPad de la pared), la vista debe rodar sola a medianoche. */
function useToday(): string {
  const [today, setToday] = useState(todayYmd);
  useEffect(() => {
    const id = setInterval(() => {
      setToday((t) => {
        const n = todayYmd();
        return n === t ? t : n;
      });
    }, 60_000);
    return () => clearInterval(id);
  }, []);
  return today;
}

export default function WeekView() {
  const { items, error: itemsError } = useItems();
  const {
    habits, completions, loading, error: habitsError, toggleToday,
  } = useHabits();
  const [toast, setToast] = useState<ToastData | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const today = useToday();
  const monday = useMemo(() => startOfWeek(parseLocalDate(today)), [today]);

  // Próximos eventos: los siguientes 2 meses, máx 5 tarjetas.
  const upcoming = useMemo(
    () =>
      items
        .filter((it) => it.kind === "date" && it.due_date && it.due_date >= today && daysUntil(it.due_date) <= 62)
        .sort((a, b) => a.due_date!.localeCompare(b.due_date!))
        .slice(0, 5),
    [items, today]
  );

  // Datos por día de la semana actual (Lun–Dom).
  const days = useMemo(() => {
    const habitById = new Map(habits.map((h) => [h.id, h]));
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(monday, i);
      const ymd = toYmd(date);
      const dayHabits = completions
        .filter((c) => c.done_on === ymd)
        .map((c) => habitById.get(c.habit_id))
        .filter((h): h is Habit => Boolean(h));
      const events = items
        .filter((it) => it.kind === "date" && it.due_date === ymd)
        .map((it) => ({ title: it.title, past: ymd < today }));
      return {
        name: DAY_NAMES[i],
        n: date.getDate(),
        ymd,
        today: ymd === today,
        habits: dayHabits,
        events,
      };
    });
  }, [habits, completions, items, today, monday]);

  async function handleToggle(habit: Habit, wasDone: boolean) {
    const ok = await toggleToday(habit.id);
    if (ok && !wasDone) {
      setToast({
        message: `"${habit.title}" marcado hoy.`,
        tone: "success",
        action: { label: "Deshacer", onClick: () => void toggleToday(habit.id) },
      });
    }
  }

  const error = itemsError || habitsError;

  const dayHabitIcons = (day: (typeof days)[number], size: number) =>
    day.habits.map((h, i) => {
      const Icon = habitIcon(h.icon);
      return (
        <span key={`${h.id}-${i}`} title={h.title} style={{ color: habitColorVar(h.color) }}>
          <Icon size={size} strokeWidth={1.75} aria-hidden="true" />
          <span className="sr-only">{h.title}</span>
        </span>
      );
    });

  const dayEvents = (day: (typeof days)[number]) =>
    day.events.map((e, i) => (
      <span
        key={i}
        className={`flex items-start gap-1.5 text-xs font-semibold ${
          e.past ? "text-muted opacity-70" : "text-[var(--c-accent)]"
        }`}
      >
        <Calendar size={12} strokeWidth={1.75} aria-hidden="true" className="mt-0.5 flex-none" />
        <span className="min-w-0">{e.title}</span>
      </span>
    ));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 md:gap-3">
      {error && (
        <p role="alert" className="alert-error flex-none px-4 py-3 text-sm">
          {error}
        </p>
      )}

      {/* Próximos eventos */}
      <section className="flex flex-none flex-col gap-2" aria-label="Próximos eventos">
        <div className="flex items-center gap-2">
          <Calendar className="icon text-muted" aria-hidden="true" />
          <h2 className="font-display text-lg text-default">Próximos eventos</h2>
          {upcoming.length > 0 && <span className="badge-count">{upcoming.length}</span>}
        </div>
        {upcoming.length === 0 ? (
          <p className="rounded-[var(--radius-md)] border border-default bg-surface px-4 py-3 text-sm text-muted">
            Sin eventos en los próximos 2 meses. Agrégalos en Listas → Fechas.
          </p>
        ) : (
          <ul className="scroll-panel-x flex gap-3 md:overflow-visible">
            {upcoming.map((u) => {
              const soon = daysUntil(u.due_date!) <= 2;
              return (
                <li
                  key={u.id}
                  className={`w-52 flex-none rounded-[var(--radius-md)] border bg-surface px-3.5 py-2.5 md:w-auto md:flex-1 md:min-w-0 ${
                    soon ? "border-[var(--c-accent)]" : "border-default"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-default">
                      {relativeUpcomingLabel(u.due_date!)}
                    </span>
                    <span className="text-xs text-muted">· {formatShortDate(u.due_date!)}</span>
                    {soon && (
                      <TriangleAlert
                        size={16}
                        strokeWidth={1.75}
                        aria-label="Muy pronto"
                        className="ml-auto flex-none text-[var(--c-error)]"
                      />
                    )}
                  </div>
                  <div className="truncate text-sm text-muted">{u.title}</div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Semana — escritorio/iPad: 7 columnas */}
      <div className="hidden min-h-0 flex-1 md:grid md:grid-cols-7 md:gap-2.5">
        {days.map((day) => (
          <div
            key={day.ymd}
            className={`flex min-h-0 min-w-0 flex-col gap-2 rounded-[var(--radius-md)] border p-2 ${
              day.today ? "border-[var(--c-accent)] bg-surface" : "border-default"
            }`}
          >
            <div className="flex-none border-b border-[var(--c-border)] pb-1.5 text-center">
              <div
                className={`text-xs font-semibold uppercase tracking-wide ${
                  day.today ? "text-[var(--c-accent)]" : "text-muted"
                }`}
              >
                {day.name}
              </div>
              <div className="font-display text-xl text-default">{day.n}</div>
              {day.today && (
                <div className="text-[11px] font-bold text-[var(--c-accent)]">HOY</div>
              )}
            </div>
            <div className="flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto pt-1.5">
              {dayHabitIcons(day, 24)}
            </div>
            {day.events.length > 0 && (
              <div className="flex flex-none flex-col gap-1.5 border-t border-[var(--c-border)] pt-2">
                {dayEvents(day)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Semana — celular: cards de día apiladas */}
      <div className="flex flex-col gap-2 md:hidden">
        {days.map((day) => (
          <div
            key={day.ymd}
            className={`flex flex-col gap-2 rounded-[var(--radius-md)] border bg-surface p-3 ${
              day.today ? "border-[var(--c-accent)]" : "border-default"
            }`}
          >
            <div className="flex items-baseline gap-2">
              <span className="font-display text-lg text-default">{day.n}</span>
              <span
                className={`text-xs font-semibold uppercase tracking-wide ${
                  day.today ? "text-[var(--c-accent)]" : "text-muted"
                }`}
              >
                {day.name}
              </span>
              {day.today && (
                <span className="text-[11px] font-bold text-[var(--c-accent)]">HOY</span>
              )}
            </div>
            {(day.habits.length > 0 || day.events.length > 0) ? (
              <>
                {day.habits.length > 0 && (
                  <div className="flex items-center gap-3">{dayHabitIcons(day, 22)}</div>
                )}
                {day.events.length > 0 && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    {dayEvents(day)}
                  </div>
                )}
              </>
            ) : (
              <span className="text-xs text-muted">—</span>
            )}
          </div>
        ))}
      </div>

      {!loading && (
        <HabitDock
          habits={habits}
          completions={completions}
          onToggle={(h, wasDone) => void handleToggle(h, wasDone)}
        />
      )}

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
