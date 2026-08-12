"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const DISMISS_KEY = "install-hint-dismissed";

/**
 * Aviso de "Agregar a pantalla de inicio" — la pieza que mata el problema
 * de la libreta. Solo en móvil, solo en navegador (no si ya está instalada),
 * y se puede descartar para siempre.
 */
export default function InstallHint() {
  const [show, setShow] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY) === "true";
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator &&
        (window.navigator as { standalone?: boolean }).standalone === true);
    if (dismissed || standalone) return;
    setIsIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent));
    setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="card flex items-center gap-3 p-4 md:hidden">
      <div className="flex-1">
        <p className="text-sm font-semibold text-default">
          Pon el radar en tu pantalla de inicio
        </p>
        <p className="text-sm text-muted">
          {isIos
            ? "Toca el botón Compartir de Safari y elige “Agregar a pantalla de inicio”."
            : "Abre el menú (⋮) del navegador y elige “Agregar a pantalla principal”."}
        </p>
      </div>
      <button
        type="button"
        className="icon-btn"
        data-plain="true"
        aria-label="Descartar este aviso"
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, "true");
          setShow(false);
        }}
      >
        <X className="icon" aria-hidden="true" />
      </button>
    </div>
  );
}
