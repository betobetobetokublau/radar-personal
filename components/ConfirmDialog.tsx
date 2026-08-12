"use client";

import { useEffect } from "react";

export default function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div role="dialog" aria-modal="true" aria-label={title} className="modal">
        <div className="sheet-handle" aria-hidden="true" />
        <h2 className="font-display text-lg text-default">{title}</h2>
        <p className="text-sm text-muted">{body}</p>
        {/* Orden del DOM: el peligroso primero → en móvil queda arriba
            (modal-actions apila en columna). El foco inicial SIEMPRE en
            Cancelar (regla del DS). */}
        <div className="modal-actions">
          <button type="button" className="btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button type="button" className="btn-secondary" autoFocus onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
