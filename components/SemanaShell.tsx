"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import ViewTabs from "@/components/ViewTabs";
import WeekView, { type WeekMode } from "@/components/WeekView";

const MODE_KEY = "radar-week-mode";

function loadMode(): WeekMode {
  try {
    const v = localStorage.getItem(MODE_KEY);
    if (v === "rodante" || v === "semana") return v;
  } catch {}
  return "semana";
}

/** Página Semana: el toggle de modo vive junto al switch de vistas
 *  (solo aquí) y se recuerda por dispositivo. */
export default function SemanaShell() {
  const [mode, setMode] = useState<WeekMode>("semana");
  useEffect(() => {
    setMode(loadMode());
  }, []);

  function change(next: WeekMode) {
    setMode(next);
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {}
  }

  const toggle = (
    <div className="segmented" role="radiogroup" aria-label="Modo de la semana">
      {([
        ["rodante", "Últimos 7 días"],
        ["semana", "Lun a Dom"],
      ] as const).map(([value, label]) => (
        <button
          key={value}
          type="button"
          role="radio"
          className="segment"
          aria-checked={mode === value}
          onClick={() => change(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="app-shell">
      <Header>
        <div className="flex items-center gap-3">
          <ViewTabs />
          <div className="hidden md:block">{toggle}</div>
        </div>
      </Header>
      <main className="page md:h-[calc(100dvh_-_var(--header-height))] md:overflow-hidden">
        <div className="flex flex-none justify-center md:hidden">{toggle}</div>
        <WeekView mode={mode} />
      </main>
    </div>
  );
}
