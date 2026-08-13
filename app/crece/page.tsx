import type { Metadata } from "next";
import { CalendarDays, FolderKanban, ListTodo } from "lucide-react";
import CreceForm from "@/components/CreceForm";

export const metadata: Metadata = {
  title: "Radar Personal — tus tareas, fechas y proyectos en un solo lugar",
  description:
    "Radar Personal es un panel personal y gratuito para que no se te escape nada importante. Deja tu correo y te abrimos tu acceso.",
};

const PILARES = [
  { icon: ListTodo, label: "Tareas", text: "Captura y tacha pendientes en segundos" },
  { icon: CalendarDays, label: "Fechas", text: "Cuenta regresiva para lo que no puede escapársete" },
  { icon: FolderKanban, label: "Proyectos", text: "Lo de mediano plazo, con sus notas" },
];

export default function CrecePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4 md:gap-8">
      <div className="flex w-full max-w-lg flex-col items-center gap-3 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- logo local
            estático, no amerita el pipeline de next/image */}
        <img src="/logo.png" alt="" aria-hidden="true" className="h-12 w-auto" />
        <h1 className="font-display text-2xl text-default">
          Ten tus tareas, fechas y proyectos en un solo lugar — sin
          distracciones
        </h1>
        <p className="text-base text-muted">
          <span className="font-semibold text-default">Radar Personal</span>{" "}
          es un panel personal y gratuito para que no se te escape nada
          importante. Deja tu correo y te abrimos tu acceso.
        </p>
      </div>

      <ul className="flex w-full max-w-lg flex-col gap-2 md:flex-row md:gap-3">
        {PILARES.map(({ icon: Icon, label, text }) => (
          <li
            key={label}
            className="border-default flex flex-1 items-center gap-3 rounded-[var(--radius-md)] border bg-surface p-3 md:flex-col md:items-start md:gap-2"
          >
            <Icon size={20} strokeWidth={1.75} className="text-muted" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-default">{label}</p>
              <p className="text-sm text-muted">{text}</p>
            </div>
          </li>
        ))}
      </ul>

      <CreceForm />

      <p className="help-text max-w-lg text-center">
        Sin spam: tu correo solo se usa para abrirte tu acceso.
      </p>
    </main>
  );
}
