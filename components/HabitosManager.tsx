"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import type { Habit, HabitColor, HabitComplexity, HabitPeriodicity } from "@/lib/habits";
import {
  COMPLEXITIES, COMPLEXITY_LABEL, COMPLEXITY_TONE, DEFAULT_HABIT_ICON,
  HABIT_COLORS, HABIT_ICONS, PERIODICITIES, PERIODICITY_LABEL,
  habitColorVar, habitIcon,
} from "@/lib/habits";
import { useHabits } from "@/lib/useHabits";
import ConfirmDialog from "@/components/ConfirmDialog";
import Toast, { type ToastData } from "@/components/Toast";

type Draft = {
  title: string;
  complexity: HabitComplexity;
  periodicity: HabitPeriodicity;
  icon: string;
  color: HabitColor;
};
const EMPTY_DRAFT: Draft = {
  title: "",
  complexity: "baja",
  periodicity: "diaria",
  icon: DEFAULT_HABIT_ICON,
  color: "ambar",
};

export default function HabitosManager() {
  const { habits, loading, error, addHabit, updateHabit, removeHabit } = useHabits();
  const [editing, setEditing] = useState<Habit | "nuevo" | null>(null);
  const [confirming, setConfirming] = useState<Habit | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  async function handleDeleteConfirmed() {
    if (!confirming) return;
    const target = confirming;
    setConfirming(null);
    setEditing(null);
    const ok = await removeHabit(target.id);
    if (ok) setToast({ message: "Hábito borrado.", tone: "info" });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href="/semana" className="icon-btn" data-plain="true" aria-label="Volver a la semana">
          <ArrowLeft className="icon" aria-hidden="true" />
        </Link>
        <h2 className="font-display text-xl text-default">Hábitos</h2>
        {habits.length > 0 && <span className="badge-count">{habits.length}</span>}
        <button
          type="button"
          className="btn-primary ml-auto flex min-h-11 items-center gap-1.5 px-4 py-2"
          onClick={() => setEditing("nuevo")}
        >
          <Plus size={18} strokeWidth={1.75} aria-hidden="true" /> Nuevo hábito
        </button>
      </div>

      {error && (
        <p role="alert" className="alert-error px-4 py-3 text-sm">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex flex-col gap-2" aria-hidden="true">
          <div className="skeleton h-14 flex-none" />
          <div className="skeleton h-14 flex-none" style={{ animationDelay: "150ms" }} />
        </div>
      ) : habits.length === 0 ? (
        <div className="empty-state">
          <p className="font-display text-default">Sin hábitos todavía</p>
          <p className="text-sm text-muted">
            Crea el primero: pequeño, concreto y que puedas hacer hoy mismo.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {habits.map((h) => {
            const Icon = habitIcon(h.icon);
            return (
              <li key={h.id} className="list-row flex-none">
                <span style={{ color: habitColorVar(h.color) }}>
                  <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <button
                  type="button"
                  className="list-row-main min-h-11 cursor-pointer justify-center border-none bg-transparent p-0 text-left"
                  onClick={() => setEditing(h)}
                  aria-label={`Editar "${h.title}"`}
                >
                  <span className="list-row-title">{h.title}</span>
                  <span className="list-row-meta">{PERIODICITY_LABEL[h.periodicity]}</span>
                </button>
                <span className="badge" data-tone={COMPLEXITY_TONE[h.complexity]}>
                  {COMPLEXITY_LABEL[h.complexity]}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <HabitSheet
          habit={editing === "nuevo" ? null : editing}
          onSave={async (draft) => {
            const ok =
              editing === "nuevo"
                ? await addHabit(draft)
                : await updateHabit(editing.id, draft);
            if (ok) setEditing(null);
            return ok;
          }}
          onDelete={editing === "nuevo" ? undefined : () => setConfirming(editing as Habit)}
          onClose={() => setEditing(null)}
          escapeDisabled={confirming !== null}
        />
      )}

      {confirming && (
        <ConfirmDialog
          title={`Borrar "${confirming.title}"`}
          body="Se pierde el hábito Y todo su historial de rachas — esto no se puede deshacer."
          confirmLabel="Sí, borrar"
          onConfirm={() => void handleDeleteConfirmed()}
          onCancel={() => setConfirming(null)}
        />
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

function HabitSheet({
  habit,
  onSave,
  onDelete,
  onClose,
  escapeDisabled = false,
}: {
  habit: Habit | null;
  onSave: (draft: Draft) => Promise<boolean>;
  onDelete?: () => void;
  onClose: () => void;
  escapeDisabled?: boolean;
}) {
  const [draft, setDraft] = useState<Draft>(
    habit
      ? {
          title: habit.title,
          complexity: habit.complexity,
          periodicity: habit.periodicity,
          icon: habit.icon,
          color: habit.color,
        }
      : EMPTY_DRAFT
  );
  const [saving, setSaving] = useState(false);
  const valid = draft.title.trim().length > 0;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !escapeDisabled) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, escapeDisabled]);

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    const ok = await onSave({ ...draft, title: draft.title.trim() });
    setSaving(false);
    if (!ok) return;
  }

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={habit ? "Editar hábito" : "Nuevo hábito"}
        className="modal"
      >
        <div className="sheet-handle" aria-hidden="true" />
        <h2 className="font-display text-lg text-default">
          {habit ? "Editar hábito" : "Nuevo hábito"}
        </h2>

        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <div className="flex flex-col gap-1">
            <label className="label-default" htmlFor="h-title">
              Título
            </label>
            <input
              id="h-title"
              className="input-default"
              value={draft.title}
              autoFocus
              required
              maxLength={100}
              placeholder="Ej. Meditar 10 minutos"
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="label-default" id="lbl-complejidad">Complejidad</span>
            <div className="segmented" role="radiogroup" aria-labelledby="lbl-complejidad">
              {COMPLEXITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  className="segment"
                  aria-checked={draft.complexity === c}
                  onClick={() => set("complexity", c)}
                >
                  {COMPLEXITY_LABEL[c]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="label-default" id="lbl-periodicidad">Periodicidad</span>
            <div className="segmented" role="radiogroup" aria-labelledby="lbl-periodicidad">
              {PERIODICITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  className="segment"
                  aria-checked={draft.periodicity === p}
                  onClick={() => set("periodicity", p)}
                >
                  {PERIODICITY_LABEL[p]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="label-default">Ícono</span>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(HABIT_ICONS).map(([key, Icon]) => (
                <button
                  key={key}
                  type="button"
                  aria-label={`Ícono ${key}`}
                  aria-pressed={draft.icon === key}
                  onClick={() => set("icon", key)}
                  className={`grid h-11 place-items-center rounded-[var(--radius-md)] border bg-surface ${
                    draft.icon === key
                      ? "border-[var(--c-accent)] text-default"
                      : "border-default text-muted"
                  }`}
                >
                  <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="label-default">Color</span>
            <div className="flex gap-2">
              {HABIT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  aria-pressed={draft.color === c}
                  onClick={() => set("color", c)}
                  className={`grid h-11 w-11 place-items-center rounded-[var(--radius-md)] border-2 ${
                    draft.color === c ? "border-[var(--c-accent)]" : "border-transparent"
                  }`}
                >
                  <span
                    className="h-6 w-6 rounded-full"
                    style={{ background: habitColorVar(c) }}
                  ></span>
                </button>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={!valid || saving}
              data-loading={saving}
              aria-busy={saving}
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>

        {onDelete && (
          <>
            <hr className="border-default" />
            <button type="button" className="btn-danger" onClick={onDelete}>
              Borrar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
