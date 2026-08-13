"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { Kind } from "@/lib/types";
import type { NewItem } from "@/lib/useItems";

const PLACEHOLDERS: Record<Kind, string> = {
  task: "Nueva tarea…",
  date: "Nueva fecha (cumple, pago, cita)…",
  project: "Nuevo proyecto…",
};

export default function AddForm({
  kind,
  onAdd,
  inline = false,
}: {
  kind: Kind;
  onAdd: (draft: NewItem) => Promise<boolean>;
  /** true → todo en un solo renglón (título de la fila horizontal). */
  inline?: boolean;
}) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const valid = title.trim().length > 0 && (kind !== "date" || dueDate !== "");

  async function submit() {
    if (!valid || saving) return;
    setSaving(true);
    const draft: NewItem = { kind, title };
    if (kind === "date") draft.due_date = dueDate;
    const ok = await onAdd(draft);
    setSaving(false);
    if (ok) {
      setTitle("");
      setDueDate("");
    }
  }

  const submitButton = (
    <button
      type="submit"
      className="btn-primary grid h-11 w-11 flex-none place-items-center p-0"
      aria-label="Agregar"
      disabled={!valid || saving}
      data-loading={saving}
    >
      {saving ? (
        <span className="spinner" aria-hidden="true" />
      ) : (
        <Plus size={20} strokeWidth={1.75} aria-hidden="true" />
      )}
    </button>
  );

  const titleInput = (
    <input
      className={`input-default min-w-0 flex-1 ${inline ? "max-w-xs" : ""}`}
      placeholder={PLACEHOLDERS[kind]}
      aria-label={PLACEHOLDERS[kind]}
      value={title}
      required
      maxLength={500}
      onChange={(e) => setTitle(e.target.value)}
    />
  );

  const dateInput = (
    <input
      type="date"
      className={`input-default ${inline ? "w-40 flex-none" : "min-w-0 flex-1"}`}
      aria-label="Fecha del evento"
      value={dueDate}
      required
      onChange={(e) => setDueDate(e.target.value)}
    />
  );

  if (inline) {
    return (
      <form
        className="flex min-w-0 flex-1 items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {titleInput}
        {kind === "date" && dateInput}
        {submitButton}
      </form>
    );
  }

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="flex gap-2">
        {titleInput}
        {kind !== "date" && submitButton}
      </div>

      {kind === "date" && (
        <div className="flex gap-2">
          {dateInput}
          {submitButton}
        </div>
      )}
    </form>
  );
}
