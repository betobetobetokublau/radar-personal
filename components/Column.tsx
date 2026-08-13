"use client";

import { useMemo } from "react";
import type { Item, Kind } from "@/lib/types";
import { KIND_LABELS } from "@/lib/types";
import type { NewItem } from "@/lib/useItems";
import { daysUntil } from "@/lib/dates";
import AddForm from "@/components/AddForm";
import ItemRow, { ItemCard } from "@/components/ItemRow";

const EMPTY_COPY: Record<Kind, { title: string; help: string }> = {
  task: { title: "Sin pendientes", help: "Agrega tu primera tarea aquí arriba." },
  date: {
    title: "Sin fechas importantes",
    help: "Un cumpleaños, un pago, una cita — con su cuenta regresiva.",
  },
  project: {
    title: "Sin proyectos",
    help: "Apunta ese proyecto que traes en mente, con su nota.",
  },
};

/** Ordena según las reglas del diseño (por tipo de columna). */
function sortForColumn(kind: Kind, items: Item[]): Item[] {
  const list = items.filter((it) => it.kind === kind);
  if (kind === "date") {
    // Próximas por cercanía; las pasadas al fondo, de la más reciente
    // a la más vieja, atenuadas (eso lo pinta ItemRow).
    const upcoming = list
      .filter((it) => it.due_date && daysUntil(it.due_date) >= 0)
      .sort((a, b) => a.due_date!.localeCompare(b.due_date!));
    const past = list
      .filter((it) => it.due_date && daysUntil(it.due_date) < 0)
      .sort((a, b) => b.due_date!.localeCompare(a.due_date!));
    return [...upcoming, ...past];
  }
  // Tareas y proyectos: activos por creación (recientes arriba);
  // tachados siempre al fondo (recién tachados arriba del grupo).
  const active = list
    .filter((it) => !it.done)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const done = list
    .filter((it) => it.done)
    .sort((a, b) => (b.done_at ?? "").localeCompare(a.done_at ?? ""));
  return [...active, ...done];
}

export default function Column({
  kind,
  items,
  loading,
  onAdd,
  onToggle,
  onOpen,
  titleAction,
  horizontal = false,
}: {
  kind: Kind;
  items: Item[];
  loading: boolean;
  onAdd: (draft: NewItem) => Promise<boolean>;
  onToggle: (item: Item) => void;
  onOpen: (item: Item) => void;
  /** Control extra junto al título (p. ej. el selector de lista de la zona). */
  titleAction?: React.ReactNode;
  /** true → los ítems se pintan como tarjetas en una fila con scroll lateral. */
  horizontal?: boolean;
}) {
  const sorted = useMemo(() => sortForColumn(kind, items), [kind, items]);
  const pending = sorted.filter((it) =>
    kind === "date" ? it.due_date && daysUntil(it.due_date) >= 0 : !it.done
  ).length;

  if (horizontal) {
    return (
      <section className="flex min-w-0 flex-col gap-3" aria-label={KIND_LABELS[kind]}>
        {/* Encabezado compacto: título + selector, y la captura EN el mismo
            renglón (a 48px del selector) para que la fila sea menos alta. */}
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg text-default">{KIND_LABELS[kind]}</h2>
          {pending > 0 && <span className="badge-count">{pending}</span>}
          {titleAction}
          <div className="ml-12 flex min-w-0 flex-1 items-center">
            <AddForm kind={kind} onAdd={onAdd} inline />
          </div>
        </div>

        {loading ? (
          <div className="flex h-36 gap-3" aria-hidden="true">
            <div className="skeleton h-full w-56 flex-none" />
            <div className="skeleton h-full w-56 flex-none" style={{ animationDelay: "150ms" }} />
            <div className="skeleton h-full w-56 flex-none" style={{ animationDelay: "300ms" }} />
          </div>
        ) : sorted.length === 0 ? (
          <div className="empty-state h-36 justify-center py-0">
            <p className="font-display text-default">{EMPTY_COPY[kind].title}</p>
            <p className="text-sm text-muted">{EMPTY_COPY[kind].help}</p>
          </div>
        ) : (
          <ul className="scroll-panel-x flex h-36 gap-3">
            {sorted.map((item) => (
              <ItemCard key={item.id} item={item} onToggle={onToggle} onOpen={onOpen} />
            ))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <section
      className="flex min-w-0 flex-col gap-3 md:min-h-0 md:flex-1"
      aria-label={KIND_LABELS[kind]}
    >
      <div className="flex items-center gap-2">
        <h2 className="font-display text-lg text-default">{KIND_LABELS[kind]}</h2>
        {pending > 0 && <span className="badge-count">{pending}</span>}
        {titleAction}
      </div>

      <AddForm kind={kind} onAdd={onAdd} />

      {loading ? (
        <div className="flex flex-col gap-2" aria-hidden="true">
          <div className="skeleton h-14 flex-none" />
          <div className="skeleton h-14 flex-none" style={{ animationDelay: "150ms" }} />
          <div className="skeleton h-14 flex-none" style={{ animationDelay: "300ms" }} />
        </div>
      ) : sorted.length === 0 ? (
        <div className="empty-state">
          <p className="font-display text-default">{EMPTY_COPY[kind].title}</p>
          <p className="text-sm text-muted">{EMPTY_COPY[kind].help}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2 md:min-h-0 md:flex-1 md:scroll-panel">
          {sorted.map((item) => (
            <ItemRow key={item.id} item={item} onToggle={onToggle} onOpen={onOpen} />
          ))}
        </ul>
      )}
    </section>
  );
}
