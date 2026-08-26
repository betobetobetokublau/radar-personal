"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, TriangleAlert } from "lucide-react";
import { useItems } from "@/lib/useItems";
import { useHabits } from "@/lib/useHabits";
import type { Habit } from "@/lib/habits";
import { habitColorVar, habitIcon } from "@/lib/habits";
import {
  addDays, DAY_NAMES, daysUntil, formatShortDate, MONTH_NAMES,
  parseLocalDate, relativeUpcomingLabel, startOfWeek, todayYmd, toYmd,
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

export type WeekMode = "semana" | "rodante";

/** "Agosto 24–30" (o "Ago 31 – Sep 6" cuando la semana cruza de mes). */
function weekLabel(startYmd: string, endYmd: string): string {
  const s = parseLocalDate(startYmd);
  const e = parseLocalDate(endYmd);
  if (s.getMonth() === e.getMonth()) {
    return `${MONTH_NAMES[s.getMonth()]} ${s.getDate()}–${e.getDate()}`;
  }
  return `${MONTH_NAMES[s.getMonth()].slice(0, 3)} ${s.getDate()} – ${MONTH_NAMES[e.getMonth()].slice(0, 3)} ${e.getDate()}`;
}

export default function WeekView({ mode = "semana" }: { mode?: WeekMode }) {
  const { items, error: itemsError } = useItems();
  const {
    habits, completions, loading, error: habitsError, toggleOn,
  } = useHabits();
  const [toast, setToast] = useState<ToastData | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const today = useToday();
  const monday = useMemo(() => startOfWeek(parseLocalDate(today)), [today]);

  // Navegación de semanas (0 = actual) y día seleccionado para editar
  // hábitos (hoy por default; al cambiar el día real, regresa a hoy).
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState<string>(today);
  useEffect(() => {
    setSelected(today);
    setWeekOffset(0);
  }, [today]);

  // Próximos eventos: los siguientes 2 meses, máx 5 tarjetas.
  const upcoming = useMemo(
    () =>
      items
        .filter((it) => it.kind === "date" && it.due_date && it.due_date >= today && daysUntil(it.due_date) <= 62)
        .sort((a, b) => a.due_date!.localeCompare(b.due_date!))
        .slice(0, 5),
    [items, today]
  );

  // Datos por día. Dos modos (± semanas con weekOffset):
  //  - "semana": Lun–Dom de la semana calendario (el resaltado se corre).
  //  - "rodante": ventana de 7 días que termina en HOY (extremo derecho).
  const days = useMemo(() => {
    const habitById = new Map(habits.map((h) => [h.id, h]));
    const todayDate = parseLocalDate(today);
    return Array.from({ length: 7 }, (_, i) => {
      const date =
        mode === "rodante"
          ? addDays(todayDate, i - 6 + weekOffset * 7)
          : addDays(monday, i + weekOffset * 7);
      const ymd = toYmd(date);
      const dayHabits = completions
        .filter((c) => c.done_on === ymd)
        .map((c) => habitById.get(c.habit_id))
        .filter((h): h is Habit => Boolean(h));
      const events = items
        .filter((it) => it.kind === "date" && it.due_date === ymd)
        .map((it) => ({ title: it.title, past: ymd < today }));
      return {
        name: DAY_NAMES[(date.getDay() + 6) % 7],
        n: date.getDate(),
        ymd,
        today: ymd === today,
        habits: dayHabits,
        events,
      };
    });
  }, [habits, completions, items, today, monday, mode, weekOffset]);

  // Orden dinámico de la semana: los hábitos más repetidos en la ventana
  // visible van arriba, así el que se hizo varios días queda alineado entre
  // columnas sin dejar huecos (cada día muestra solo lo hecho, compactado).
  // Empates → completado más temprano primero, luego orden de creación.
  const weekRank = useMemo(() => {
    const count = new Map<string, number>();
    const earliest = new Map<string, string>();
    for (const day of days) {
      for (const h of day.habits) {
        count.set(h.id, (count.get(h.id) ?? 0) + 1);
        const cur = earliest.get(h.id);
        if (!cur || day.ymd < cur) earliest.set(h.id, day.ymd);
      }
    }
    const ordered = [...habits]
      .filter((h) => count.has(h.id))
      .sort((a, b) => {
        const ca = count.get(a.id)!;
        const cb = count.get(b.id)!;
        if (ca !== cb) return cb - ca;
        const ea = earliest.get(a.id)!;
        const eb = earliest.get(b.id)!;
        if (ea !== eb) return ea < eb ? -1 : 1;
        return habits.indexOf(a) - habits.indexOf(b);
      });
    return new Map(ordered.map((h, i) => [h.id, i]));
  }, [days, habits]);

  async function handleToggle(habit: Habit, wasDone: boolean) {
    const date = selected;
    const ok = await toggleOn(habit.id, date);
    if (ok && !wasDone) {
      setToast({
        message:
          date === today
            ? `"${habit.title}" marcado hoy.`
            : `"${habit.title}" marcado el ${formatShortDate(date)}.`,
        tone: "success",
        action: { label: "Deshacer", onClick: () => void toggleOn(habit.id, date) },
      });
    }
  }

  const error = itemsError || habitsError;

  // Íconos del día: solo lo hecho, sin huecos, en el orden dinámico de la
  // semana — los repetidos suben y coinciden visualmente entre columnas.
  const dayHabitIcons = (day: (typeof days)[number], size: number) => {
    if (day.habits.length === 0) return null;
    const sorted = [...day.habits].sort(
      (a, b) => (weekRank.get(a.id) ?? 0) - (weekRank.get(b.id) ?? 0)
    );
    return sorted.map((h) => {
      const Icon = habitIcon(h.icon);
      return (
        <span
          key={h.id}
          title={h.title}
          className="grid flex-none place-items-center rounded-full border border-current"
          style={{
            color: habitColorVar(h.color),
            width: size + 14,
            height: size + 14,
          }}
        >
          <Icon size={size} strokeWidth={1.75} aria-hidden="true" />
          <span className="sr-only">{h.title}</span>
        </span>
      );
    });
  };

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

      {/* Próximos eventos + navegador de semanas */}
      <section className="flex flex-none flex-col gap-2" aria-label="Próximos eventos">
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="icon text-muted" aria-hidden="true" />
          <h2 className="font-display text-lg text-default">Próximos eventos</h2>
          {upcoming.length > 0 && <span className="badge-count">{upcoming.length}</span>}
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              className="icon-btn"
              data-plain="true"
              aria-label="Semana anterior"
              onClick={() => setWeekOffset((o) => o - 1)}
            >
              <ChevronLeft className="icon" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="min-h-11 rounded-[var(--radius-md)] px-2 text-sm font-semibold text-default"
              title="Volver a la semana actual"
              onClick={() => setWeekOffset(0)}
            >
              {weekLabel(days[0].ymd, days[6].ymd)}
            </button>
            <button
              type="button"
              className="icon-btn"
              data-plain="true"
              aria-label="Semana siguiente"
              onClick={() => setWeekOffset((o) => o + 1)}
            >
              <ChevronRight className="icon" aria-hidden="true" />
            </button>
          </div>
        </div>
        {upcoming.length === 0 ? (
          <p className="rounded-[var(--radius-md)] border border-default bg-surface px-4 py-3 text-sm text-muted">
            Sin eventos en los próximos 2 meses. Agrégalos en Listas → Fechas.
          </p>
        ) : (
          <ul className="scroll-panel-x flex gap-3">
            {upcoming.map((u) => {
              const dias = daysUntil(u.due_date!);
              const soon = dias <= 2;
              return (
                <li
                  key={u.id}
                  className={`w-56 flex-none rounded-[var(--radius-md)] border px-3.5 py-2.5 ${
                    soon ? "border-[var(--c-accent)]" : "border-default"
                  } ${dias <= 14 ? "bg-surface" : "bg-app"}`}
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

      {/* Semana — escritorio/iPad: 7 columnas. Tocar un día pasado lo
          selecciona: el dock edita los hábitos de ESE día. */}
      <div className="hidden min-h-0 flex-1 md:grid md:grid-cols-7 md:gap-2.5">
        {days.map((day) => (
          <button
            key={day.ymd}
            type="button"
            disabled={day.ymd > today}
            aria-pressed={day.ymd === selected}
            aria-label={`Seleccionar ${day.name} ${day.n}`}
            onClick={() => setSelected(day.ymd)}
            className={`flex min-h-0 min-w-0 flex-col gap-2 rounded-[var(--radius-md)] border p-2 text-left focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] ${
              day.ymd === selected
                ? "border-[var(--c-accent)] bg-surface"
                : "border-[var(--c-border-strong)]"
            } ${day.ymd > today ? "cursor-default" : "cursor-pointer"}`}
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
              {/* Renglón SIEMPRE presente (invisible si no es hoy) para que
                  la línea divisoria quede a la misma altura en las 7 columnas. */}
              <div className="text-[11px] font-bold text-[var(--c-accent)]" aria-hidden={!day.today}>
                {day.today ? "HOY" : " "}
              </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto pt-1.5">
              {dayHabitIcons(day, 24)}
            </div>
            {day.events.length > 0 && (
              <div className="flex flex-none flex-col gap-1.5 border-t border-[var(--c-border)] pt-2">
                {dayEvents(day)}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Semana — celular: cards de día apiladas (tocar selecciona el día) */}
      <div className="flex flex-col gap-2 md:hidden">
        {days.map((day) => (
          <button
            key={day.ymd}
            type="button"
            disabled={day.ymd > today}
            aria-pressed={day.ymd === selected}
            aria-label={`Seleccionar ${day.name} ${day.n}`}
            onClick={() => setSelected(day.ymd)}
            className={`flex w-full flex-col gap-2 rounded-[var(--radius-md)] border bg-surface p-3 text-left focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] ${
              day.ymd === selected
                ? "border-[var(--c-accent)]"
                : "border-[var(--c-border-strong)]"
            } ${day.ymd > today ? "cursor-default" : "cursor-pointer"}`}
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
          </button>
        ))}
      </div>

      {!loading && (
        <HabitDock
          habits={habits}
          completions={completions}
          date={selected}
          today={today}
          onToggle={(h, wasDone) => void handleToggle(h, wasDone)}
          onBackToToday={() => setSelected(today)}
        />
      )}

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
