"use client";

import { useEffect } from "react";
import { Check, CircleAlert, Info } from "lucide-react";

export interface ToastData {
  message: string;
  tone?: "success" | "info" | "error";
  action?: { label: string; onClick: () => void };
}

const TONE_ICONS = {
  success: Check,
  info: Info,
  error: CircleAlert,
} as const;

export default function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastData | null;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!toast) return;
    // 7s cuando trae acción ("Deshacer"), 4s cuando solo confirma (regla DS).
    const ms = toast.action ? 7000 : 4000;
    const t = setTimeout(onDismiss, ms);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  const tone = toast?.tone ?? "success";
  const Icon = TONE_ICONS[tone];

  // La región aria-live vive SIEMPRE en el DOM (aunque esté vacía): si se
  // monta junto con el mensaje, los lectores de pantalla no lo anuncian.
  return (
    <div className="toast-region" aria-live="polite">
      {toast && (
        <div className="toast" data-tone={tone}>
          <Icon aria-hidden="true" strokeWidth={1.75} />
          <span className="flex-1">{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              className="btn-tertiary min-h-11 px-3 py-1"
              onClick={() => {
                toast.action!.onClick();
                onDismiss();
              }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
