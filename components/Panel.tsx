"use client";

import { useCallback, useState } from "react";
import { CalendarDays, FolderKanban, ListTodo } from "lucide-react";
import type { Item, Kind } from "@/lib/types";
import { KIND_LABELS } from "@/lib/types";
import { useItems } from "@/lib/useItems";
import Column from "@/components/Column";
import EditSheet from "@/components/EditSheet";
import ConfirmDialog from "@/components/ConfirmDialog";
import Toast, { type ToastData } from "@/components/Toast";

const KINDS: Kind[] = ["task", "date", "project"];

const NAV_ICONS: Record<Kind, typeof ListTodo> = {
  task: ListTodo,
  date: CalendarDays,
  project: FolderKanban,
};

export default function Panel() {
  const { items, loading, error, add, update, toggleDone, remove } = useItems();
  const [active, setActive] = useState<Kind>("task");
  const [editing, setEditing] = useState<Item | null>(null);
  const [confirming, setConfirming] = useState<Item | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  // Tachar es reversible → se hace de inmediato y se ofrece "Deshacer" 7s.
  async function handleToggle(item: Item) {
    const wasDone = item.done;
    const ok = await toggleDone(item.id);
    if (ok && !wasDone) {
      setToast({
        message: "Tachado.",
        tone: "success",
        action: { label: "Deshacer", onClick: () => void toggleDone(item.id) },
      });
    }
  }

  // Borrar NO es reversible → confirmación diciendo qué se pierde.
  async function handleDeleteConfirmed() {
    if (!confirming) return;
    const target = confirming;
    setConfirming(null);
    setEditing(null);
    const ok = await remove(target.id);
    if (ok) setToast({ message: "Borrado.", tone: "info" });
  }

  return (
    <>
      {error && (
        <p role="alert" className="alert-error px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <div className="grid items-start gap-4 md:grid-cols-3 md:gap-6">
        {KINDS.map((kind) => (
          <div
            key={kind}
            className={kind === active ? "min-w-0" : "hidden md:block md:min-w-0"}
          >
            <Column
              kind={kind}
              items={items}
              loading={loading}
              onAdd={add}
              onToggle={(item) => void handleToggle(item)}
              onOpen={setEditing}
            />
          </div>
        ))}
      </div>

      <nav className="bottom-nav" aria-label="Secciones">
        {KINDS.map((kind) => {
          const Icon = NAV_ICONS[kind];
          return (
            <button
              key={kind}
              type="button"
              className="nav-item"
              aria-current={active === kind ? "page" : undefined}
              onClick={() => setActive(kind)}
            >
              <Icon strokeWidth={1.75} aria-hidden="true" />
              {KIND_LABELS[kind]}
            </button>
          );
        })}
      </nav>

      {editing && (
        <EditSheet
          item={editing}
          onSave={(patch) => update(editing.id, patch)}
          onDelete={setConfirming}
          onClose={() => setEditing(null)}
          escapeDisabled={confirming !== null}
        />
      )}

      {confirming && (
        <ConfirmDialog
          title={`Borrar "${confirming.title}"`}
          body="Se pierde para siempre — esto no se puede deshacer."
          confirmLabel="Sí, borrar"
          onConfirm={() => void handleDeleteConfirmed()}
          onCancel={() => setConfirming(null)}
        />
      )}

      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}
