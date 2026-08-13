"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { Kind } from "@/lib/types";
import { KIND_LABELS } from "@/lib/types";

const KINDS: Kind[] = ["task", "date", "project"];

/**
 * Menú para elegir qué lista vive en una zona del layout. Si se elige una
 * que ya está en otra zona, el Panel las intercambia. Patrón documentado del
 * proyecto: popover menu-button (APG) armado 100% con tokens del DS —
 * teclado completo: flechas ciclan, Home/End, Esc regresa el foco al botón.
 */
export default function ListPicker({
  current,
  onSelect,
}: {
  current: Kind;
  onSelect: (kind: Kind) => void;
}) {
  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function openMenu() {
    const idx = KINDS.indexOf(current);
    setFocusIdx(idx >= 0 ? idx : 0);
    setOpen(true);
  }

  function closeMenu(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  // Foco itinerante: al abrir cae en la lista actual; las flechas lo mueven.
  useEffect(() => {
    if (open) itemRefs.current[focusIdx]?.focus();
  }, [open, focusIdx]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  function onMenuKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "Escape":
        // Solo cierra este menú — no las ventanas que estén debajo.
        e.stopPropagation();
        closeMenu(true);
        break;
      case "ArrowDown":
        e.preventDefault();
        setFocusIdx((i) => (i + 1) % KINDS.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusIdx((i) => (i - 1 + KINDS.length) % KINDS.length);
        break;
      case "Home":
        e.preventDefault();
        setFocusIdx(0);
        break;
      case "End":
        e.preventDefault();
        setFocusIdx(KINDS.length - 1);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="icon-btn"
        aria-label={`Cambiar la lista de esta zona (ahora: ${KIND_LABELS[current]})`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? closeMenu(false) : openMenu())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            openMenu();
          }
        }}
      >
        <ChevronDown className="icon" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Elegir lista"
          className="border-default absolute right-0 top-full z-[var(--z-popover)] mt-1 w-44 rounded-[var(--radius-md)] border bg-surface p-1 shadow-[var(--shadow-2)]"
          onKeyDown={onMenuKeyDown}
        >
          {KINDS.map((kind, i) => (
            <button
              key={kind}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              type="button"
              role="menuitemradio"
              aria-checked={kind === current}
              tabIndex={-1}
              className="text-default flex min-h-11 w-full items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm font-semibold hover:bg-app focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
              onClick={() => {
                closeMenu(true);
                if (kind !== current) onSelect(kind);
              }}
            >
              {KIND_LABELS[kind]}
              {kind === current && (
                <Check size={16} strokeWidth={1.75} aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
