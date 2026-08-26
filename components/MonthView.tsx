"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useItems } from "@/lib/useItems";
import { useHabits } from "@/lib/useHabits";
import { habitColorVar } from "@/lib/habits";
import {
  addDays, DAY_NAMES, MONTH_NAMES, parseLocalDate, startOfWeek, todayYmd, toYmd,
} from "@/lib/dates";

const MAX_EVENT_CHIPS = 2;

export default function MonthView() {
  const { items, error: itemsError } = useItems();
  const { habits, completions, error: habitsError } = useHabits();
  // "Hoy" con tic de reloj: la pantalla de pared debe rodar sola a medianoche.
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
  const now = parseLocalDate(today);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth()); // 0-11

  function shift(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  // Cuadrícula SIEMPRE completa de 6 filas, inicio lunes; los días de
  // meses vecinos van atenuados.
  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const gridStart = startOfWeek(first);
    const habitById = new Map(habits.map((h) => [h.id, h]));
    const eventsByDay = new Map<string, { title: string }[]>();
    for (const it of items) {
      if (it.kind !== "date" || !it.due_date) continue;
      if (!eventsByDay.has(it.due_date)) eventsByDay.set(it.due_date, []);
      eventsByDay.get(it.due_date)!.push({ title: it.title });
    }
    const dotsByDay = new Map<string, string[]>();
    for (const c of completions) {
      const h = habitById.get(c.habit_id);
      if (!h) continue;
      if (!dotsByDay.has(c.done_on)) dotsByDay.set(c.done_on, []);
      dotsByDay.get(c.done_on)!.push(habitColorVar(h.color));
    }
    return Array.from({ length: 42 }, (_, i) => {
      const date = addDays(gridStart, i);
      const ymd = toYmd(date);
      return {
        ymd,
        n: date.getDate(),
        out: date.getMonth() !== month,
        today: ymd === today,
        events: eventsByDay.get(ymd) ?? [],
        dots: (dotsByDay.get(ymd) ?? []).slice(0, 5),
      };
    });
  }, [year, month, items, habits, completions, today]);

  const error = itemsError || habitsError;
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {error && (
        <p role="alert" className="alert-error flex-none px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <div className="flex flex-none items-center gap-3">
        <button
          type="button"
          className="icon-btn"
          aria-label="Mes anterior"
          onClick={() => shift(-1)}
        >
          <ChevronLeft className="icon" aria-hidden="true" />
        </button>
        <h2 className="font-display text-xl text-default">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button
          type="button"
          className="icon-btn"
          aria-label="Mes siguiente"
          onClick={() => shift(1)}
        >
          <ChevronRight className="icon" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="btn-primary ml-2 min-h-11 px-4 py-2"
          disabled={isCurrentMonth}
          onClick={() => {
            setYear(now.getFullYear());
            setMonth(now.getMonth());
          }}
        >
          Hoy
        </button>
      </div>

      <div className="grid flex-none grid-cols-7 gap-1.5">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="py-1 text-center text-xs font-semibold uppercase tracking-wide text-muted"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 gap-1.5">
        {cells.map((c) => (
          <div
            key={c.ymd}
            className={`flex min-h-0 min-w-0 flex-col gap-1 overflow-hidden rounded-[var(--radius-sm)] border p-1.5 ${
              c.today ? "border-[var(--c-accent)] bg-surface" : "border-default"
            } ${c.out ? "opacity-45" : ""}`}
          >
            <div className="flex flex-none items-center justify-between gap-1">
              <span
                className={`text-sm font-semibold ${
                  c.today ? "text-[var(--c-accent)]" : "text-default"
                }`}
              >
                {c.n}
              </span>
              {c.dots.length > 0 && (
                <span className="flex gap-0.5" aria-label={`${c.dots.length} hábitos completados`}>
                  {c.dots.map((color, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-1.5 flex-none rounded-full ${
                        i >= 3 ? "hidden md:inline-block" : ""
                      }`}
                      style={{ background: color }}
                    ></span>
                  ))}
                </span>
              )}
            </div>
            {c.events.slice(0, MAX_EVENT_CHIPS).map((e, i) => (
              <span
                key={i}
                className="hidden flex-none truncate rounded-[var(--radius-sm)] px-1.5 py-0.5 text-[11px] font-semibold md:block"
                style={{ background: "var(--c-info-bg)", color: "var(--c-on-info-bg)" }}
              >
                {e.title}
              </span>
            ))}
            {c.events.length > MAX_EVENT_CHIPS && (
              <span className="hidden flex-none text-[11px] font-semibold text-muted md:block">
                +{c.events.length - MAX_EVENT_CHIPS} más
              </span>
            )}
            {c.events.length > 0 && (
              <span
                className="h-1.5 w-1.5 flex-none rounded-full md:hidden"
                style={{ background: "var(--c-info)" }}
                aria-label={`${c.events.length} eventos`}
              ></span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
