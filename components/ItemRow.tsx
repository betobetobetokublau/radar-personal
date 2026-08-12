"use client";

import { Check } from "lucide-react";
import type { Item } from "@/lib/types";
import { countdownLabel, daysUntil, formatShortDate } from "@/lib/dates";

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
    <li className={`list-row ${dimmed ? "opacity-60" : ""}`}>
      {!isDate && (
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
      )}

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
