"use client";

import { Check } from "lucide-react";
import type { Item } from "@/lib/types";
import { countdownLabel, daysUntil, formatShortDate } from "@/lib/dates";

function CheckCircle({
  item,
  onToggle,
}: {
  item: Item;
  onToggle: (item: Item) => void;
}) {
  return (
    <button
      type="button"
      aria-label={item.done ? `Destachar "${item.title}"` : `Tachar "${item.title}"`}
      aria-pressed={item.done}
      onClick={() => onToggle(item)}
      className="-m-2 grid h-11 w-11 flex-none place-items-center"
    >
      <span
        aria-hidden="true"
        className={`grid h-6 w-6 place-items-center rounded-full border ${
          item.done ? "control-checked border-transparent" : "border-default bg-surface"
        }`}
      >
        {item.done && <Check size={16} strokeWidth={1.75} />}
      </span>
    </button>
  );
}

export default function ItemRow({
  item,
  onToggle,
  onOpen,
}: {
  item: Item;
  onToggle: (item: Item) => void;
  onOpen: (item: Item) => void;
}) {
  const isDate = item.kind === "date";
  const isPastDate = isDate && item.due_date !== null && daysUntil(item.due_date) < 0;
  const dimmed = item.done || isPastDate;
  const noteFirstLine = item.note?.split("\n")[0]?.trim();

  return (
    <li className={`list-row flex-none ${dimmed ? "opacity-60" : ""}`}>
      {!isDate && <CheckCircle item={item} onToggle={onToggle} />}

      <button
        type="button"
        className="list-row-main min-h-11 cursor-pointer justify-center border-none bg-transparent p-0 text-left"
        onClick={() => onOpen(item)}
        aria-label={`Abrir "${item.title}"`}
      >
        <span className={`list-row-title ${item.done ? "line-through" : ""}`}>
          {item.title}
        </span>
        {isDate && item.due_date && (
          <span className="list-row-meta">{formatShortDate(item.due_date)}</span>
        )}
        {item.kind === "project" && noteFirstLine && (
          <span className="list-row-meta truncate">{noteFirstLine}</span>
        )}
      </button>

      {isDate && item.due_date && (
        <span
          className="badge num"
          data-tone={
            isPastDate ? undefined : daysUntil(item.due_date) <= 1 ? "warning" : "info"
          }
        >
          {countdownLabel(item.due_date)}
        </span>
      )}
    </li>
  );
}

/** Variante tarjeta, para la fila horizontal del acomodo "2 + fila". */
export function ItemCard({
  item,
  onToggle,
  onOpen,
}: {
  item: Item;
  onToggle: (item: Item) => void;
  onOpen: (item: Item) => void;
}) {
  const isDate = item.kind === "date";
  const isPastDate = isDate && item.due_date !== null && daysUntil(item.due_date) < 0;
  const dimmed = item.done || isPastDate;
  const noteFirstLine = item.note?.split("\n")[0]?.trim();

  return (
    <li
      className={`border-default flex w-56 flex-none flex-col gap-2 rounded-[var(--radius-md)] border bg-surface p-3 ${
        dimmed ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-1">
        {!isDate && <CheckCircle item={item} onToggle={onToggle} />}
        <button
          type="button"
          className="min-h-11 min-w-0 flex-1 cursor-pointer border-none bg-transparent p-0 text-left"
          onClick={() => onOpen(item)}
          aria-label={`Abrir "${item.title}"`}
        >
          <span
            className={`line-clamp-2 text-base font-semibold ${
              item.done ? "line-through" : ""
            }`}
          >
            {item.title}
          </span>
        </button>
      </div>

      {isDate && item.due_date && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted">{formatShortDate(item.due_date)}</span>
          <span
            className="badge num"
            data-tone={
              isPastDate ? undefined : daysUntil(item.due_date) <= 1 ? "warning" : "info"
            }
          >
            {countdownLabel(item.due_date)}
          </span>
        </div>
      )}
      {item.kind === "project" && noteFirstLine && (
        <span className="truncate text-sm text-muted">{noteFirstLine}</span>
      )}
    </li>
  );
}
