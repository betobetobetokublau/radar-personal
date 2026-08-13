import { CalendarDays, FolderKanban, ListTodo } from "lucide-react";
import type { Kind } from "@/lib/types";

// Ícono de identidad de cada lista. Se usa igual en el título de las zonas
// y en la barra de navegación del celular — SIEMPRE el mismo por lista,
// para que se reconozcan de un vistazo aunque cambien de zona.
export const KIND_ICONS: Record<Kind, typeof ListTodo> = {
  task: ListTodo,
  date: CalendarDays,
  project: FolderKanban,
};
