"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { flushSync } from "react-dom";
import type { Item, Kind } from "@/lib/types";
import { KIND_LABELS } from "@/lib/types";
import { useItems } from "@/lib/useItems";
import {
  DEFAULT_ASSIGNMENTS,
  LAYOUT_LABELS,
  loadLayoutPrefs,
  saveAssignment,
  saveLayoutMode,
  type LayoutMode,
} from "@/lib/layout";
import Header from "@/components/Header";
import InstallHint from "@/components/InstallHint";
import ViewTabs from "@/components/ViewTabs";
import Column from "@/components/Column";
import { KIND_ICONS } from "@/components/kindIcons";
import ListPicker from "@/components/ListPicker";
import EditSheet from "@/components/EditSheet";
import ConfirmDialog from "@/components/ConfirmDialog";
import Toast, { type ToastData } from "@/components/Toast";

const KINDS: Kind[] = ["task", "date", "project"];

// Borde sutil que delinea cada zona del layout (solo ≥768px; el celular
// conserva su vista de pestañas sin contenedores). La zona NO lleva fondo:
// las tarjetas de adentro ya son surface y perderían contraste tono-sobre-tono.
// min-h-0 + flex-col permiten que la lista interna scrollee sin estirar la zona.
const ZONE_CLASS =
  "border-default min-w-0 rounded-[var(--radius-lg)] md:flex md:min-h-0 md:flex-col md:border md:p-4";

// Anima el intercambio de zonas con la View Transitions API: el navegador
// "vuela" cada zona a su nueva posición (tokens de motion en globals.css).
// Sin soporte del navegador, o con "reducir movimiento" activo, el cambio
// es instantáneo — mismo resultado, sin animación.
function withViewTransition(update: () => void) {
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => unknown;
  };
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (!doc.startViewTransition || reduceMotion) {
    update();
    return;
  }
  doc.startViewTransition(() => {
    // La actualización debe aplicarse al DOM de forma síncrona para que el
    // navegador capture el "después" dentro de la transición.
    flushSync(update);
  });
}

// useLayoutEffect corre ANTES del primer pintado (evita el brinco visual al
// restaurar el acomodo guardado), pero en el servidor no existe — ahí cae a
// useEffect para no generar warnings de SSR.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function Panel() {
  const { items, loading, error, add, update, toggleDone, remove } = useItems();
  const [active, setActive] = useState<Kind>("task");
  const [editing, setEditing] = useState<Item | null>(null);
  const [confirming, setConfirming] = useState<Item | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  // Acomodo del panel. Se lee del dispositivo tras montar (localStorage no
  // existe en el servidor); mientras, se pinta el default sin selector activo.
  const [mode, setMode] = useState<LayoutMode>("3v");
  const [assignments, setAssignments] = useState(DEFAULT_ASSIGNMENTS);

  useIsomorphicLayoutEffect(() => {
    const prefs = loadLayoutPrefs();
    setMode(prefs.mode);
    setAssignments(prefs.assignments);
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  function changeMode(next: LayoutMode) {
    if (next === mode) return;
    saveLayoutMode(next);
    // Las zonas de `next` ya traen su última asignación (o el default) —
    // viven en `assignments`, que persiste por layout.
    withViewTransition(() => setMode(next));
  }

  // Asigna la lista `kind` a la zona `zoneIndex` del layout actual.
  // Si otra zona ya mostraba esa lista, se intercambian (animado).
  function assignList(zoneIndex: number, kind: Kind) {
    const zones = [...assignments[mode]];
    const from = zones.indexOf(kind);
    const displaced = zones[zoneIndex];
    zones[zoneIndex] = kind;
    if (from >= 0 && from !== zoneIndex) zones[from] = displaced;
    saveAssignment(mode, zones);
    const next = { ...assignments, [mode]: zones };
    withViewTransition(() => setAssignments(next));
  }

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

  function zoneColumn(zoneIndex: number, horizontal: boolean) {
    const kind = assignments[mode][zoneIndex];
    return (
      <Column
        // key por lista: al intercambiar zonas, el formulario de captura se
        // remonta — sin esto, un texto a medio escribir "migraría" de lista.
        key={kind}
        kind={kind}
        items={items}
        loading={loading}
        onAdd={add}
        onToggle={(item) => void handleToggle(item)}
        onOpen={setEditing}
        horizontal={horizontal}
        titleAction={
          <ListPicker current={kind} onSelect={(k) => assignList(zoneIndex, k)} />
        }
      />
    );
  }

  return (
    <div className="app-shell">
      <Header>
        <ViewTabs />
      </Header>

      {/* En md+ el panel llena exactamente la pantalla (alto fijo, sin scroll
          de página): las zonas mantienen siempre la misma altura y el scroll
          vive DENTRO de cada una. */}
      <main className="page has-bottom-nav md:h-[calc(100dvh_-_var(--header-height))] md:overflow-hidden">
        <InstallHint />

        {/* Acomodo de las zonas (solo pantalla grande) */}
        <div className="hidden flex-none items-center justify-end gap-2 md:flex">
          <span className="text-sm font-semibold text-muted">Acomodo:</span>
          <div className="segmented" role="tablist" aria-label="Acomodo del panel">
            {(["3v", "2v1h"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                className="segment"
                aria-selected={mode === m}
                onClick={() => changeMode(m)}
              >
                {LAYOUT_LABELS[m]}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p role="alert" className="alert-error px-4 py-3 text-sm">
            {error}
          </p>
        )}

        {/* Celular: una lista a la vez, pestañas abajo — sin cambios. */}
        <div className="md:hidden">
          <Column
            kind={active}
            items={items}
            loading={loading}
            onAdd={add}
            onToggle={(item) => void handleToggle(item)}
            onOpen={setEditing}
          />
        </div>

        {/* Pantalla grande (iPad de pared / escritorio): zonas con borde. */}
        {mode === "3v" ? (
          <div className="hidden md:grid md:min-h-0 md:flex-1 md:grid-cols-3 md:gap-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={ZONE_CLASS}
                style={{ viewTransitionName: `zona-${assignments[mode][i]}` }}
              >
                {zoneColumn(i, false)}
              </div>
            ))}
          </div>
        ) : (
          <div className="hidden md:flex md:min-h-0 md:flex-1 md:flex-col md:gap-5">
            <div className="md:grid md:min-h-0 md:flex-1 md:grid-cols-2 md:gap-5">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className={ZONE_CLASS}
                  style={{ viewTransitionName: `zona-${assignments[mode][i]}` }}
                >
                  {zoneColumn(i, false)}
                </div>
              ))}
            </div>
            <div
              className={`${ZONE_CLASS} md:flex-none`}
              style={{ viewTransitionName: `zona-${assignments[mode][2]}` }}
            >
              {zoneColumn(2, true)}
            </div>
          </div>
        )}
      </main>

      <nav className="bottom-nav" aria-label="Secciones">
        {KINDS.map((kind) => {
          const Icon = KIND_ICONS[kind];
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
    </div>
  );
}
