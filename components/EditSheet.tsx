"use client";

import { useEffect, useState } from "react";
import type { Item } from "@/lib/types";

export default function EditSheet({
  item,
  onSave,
  onDelete,
  onClose,
  escapeDisabled = false,
}: {
  item: Item;
  onSave: (
    patch: Partial<Pick<Item, "title" | "due_date" | "note">>
  ) => Promise<boolean>;
  onDelete: (item: Item) => void;
  onClose: () => void;
  /** true cuando hay otra ventana encima (p. ej. la confirmación de borrado):
      Esc debe cerrar SOLO la de hasta arriba. */
  escapeDisabled?: boolean;
}) {
  const [title, setTitle] = useState(item.title);
  const [dueDate, setDueDate] = useState(item.due_date ?? "");
  const [note, setNote] = useState(item.note ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !escapeDisabled) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, escapeDisabled]);

  const valid =
    title.trim().length > 0 && (item.kind !== "date" || dueDate !== "");

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    const patch: Partial<Pick<Item, "title" | "due_date" | "note">> = {
      title: title.trim(),
    };
    if (item.kind === "date") patch.due_date = dueDate;
    if (item.kind === "project") patch.note = note.trim() || null;
    const ok = await onSave(patch);
    setSaving(false);
    if (ok) onClose();
  }

  const heading =
    item.kind === "task"
      ? "Editar tarea"
      : item.kind === "date"
        ? "Editar fecha"
        : "Editar proyecto";

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-label={heading} className="modal">
        <div className="sheet-handle" aria-hidden="true" />
        <h2 className="font-display text-lg text-default">{heading}</h2>

        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <div className="flex flex-col gap-1">
            <label className="label-default" htmlFor="edit-title">
              Título
            </label>
            <input
              id="edit-title"
              className="input-default"
              value={title}
              autoFocus
              required
              maxLength={500}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {item.kind === "date" && (
            <div className="flex flex-col gap-1">
              <label className="label-default" htmlFor="edit-date">
                Fecha
              </label>
              <input
                id="edit-date"
                type="date"
                className="input-default"
                value={dueDate}
                required
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          )}

          {item.kind === "project" && (
            <div className="flex flex-col gap-1">
              <label className="label-default" htmlFor="edit-note">
                Nota
              </label>
              <textarea
                id="edit-note"
                className="input-default min-h-24 resize-y"
                placeholder="Detalles, siguientes pasos, lo que quieras apuntar…"
                value={note}
                maxLength={5000}
                onChange={(e) => setNote(e.target.value)}
              />
              <p className="help-text">Opcional. Se guarda con el proyecto.</p>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={!valid || saving}
              data-loading={saving}
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>

        <hr className="border-default" />
        <button
          type="button"
          className="btn-danger"
          onClick={() => onDelete(item)}
        >
          Borrar
        </button>
      </div>
    </div>
  );
}
