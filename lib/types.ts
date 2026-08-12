export type Kind = "task" | "date" | "project";

export interface Item {
  id: string;
  user_id: string;
  kind: Kind;
  title: string;
  note: string | null;
  due_date: string | null; // "YYYY-MM-DD" — solo kind "date"
  done: boolean;
  done_at: string | null;
  created_at: string;
  updated_at: string;
}

export const KIND_LABELS: Record<Kind, string> = {
  task: "Tareas",
  date: "Fechas",
  project: "Proyectos",
};
