"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Item, Kind } from "@/lib/types";

const GENERIC_ERROR = "No se pudo guardar. Revisa tu conexión e intenta de nuevo.";

export interface NewItem {
  kind: Kind;
  title: string;
  due_date?: string; // requerido si kind === "date"
  note?: string; // solo kind === "project"
}

export function useItems() {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Espejo de `items` para leer el estado ACTUAL desde closures viejos
  // (p. ej. el "Deshacer" del toast, que se crea en un render anterior).
  const itemsRef = useRef<Item[]>(items);
  itemsRef.current = items;

  const refresh = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: false });
    if (err) {
      setError("No se pudieron cargar tus ítems. Recarga la página.");
    } else {
      setItems(data ?? []);
      setError(null);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Agrega un ítem. Devuelve true si se guardó. */
  const add = useCallback(
    async (draft: NewItem): Promise<boolean> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Tu sesión venció. Recarga la página para entrar de nuevo.");
        return false;
      }
      const { data, error: err } = await supabase
        .from("items")
        .insert({
          user_id: user.id,
          kind: draft.kind,
          title: draft.title.trim(),
          due_date: draft.due_date ?? null,
          note: draft.note?.trim() || null,
        })
        .select()
        .single();
      if (err || !data) {
        setError(GENERIC_ERROR);
        return false;
      }
      setItems((prev) => [data, ...prev]);
      setError(null);
      return true;
    },
    [supabase]
  );

  /** Edita título / fecha / nota. Devuelve true si se guardó. */
  const update = useCallback(
    async (
      id: string,
      patch: Partial<Pick<Item, "title" | "due_date" | "note">>
    ): Promise<boolean> => {
      const { data, error: err } = await supabase
        .from("items")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (err || !data) {
        setError(GENERIC_ERROR);
        return false;
      }
      setItems((prev) => prev.map((it) => (it.id === id ? data : it)));
      setError(null);
      return true;
    },
    [supabase]
  );

  /**
   * Tacha / destacha (optimista: la UI cambia ya, y se revierte si falla).
   * Devuelve true si el servidor confirmó.
   */
  const toggleDone = useCallback(
    async (id: string): Promise<boolean> => {
      // Leer del ref (estado actual), NUNCA del closure: si esto viniera del
      // array capturado, el "Deshacer" del toast re-tacharía en vez de revertir.
      const current = itemsRef.current.find((it) => it.id === id);
      if (!current) return false;
      const next = {
        done: !current.done,
        done_at: !current.done ? new Date().toISOString() : null,
      };
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, ...next } : it))
      );
      const { error: err } = await supabase
        .from("items")
        .update(next)
        .eq("id", id);
      if (err) {
        // Revertir
        setItems((prev) =>
          prev.map((it) =>
            it.id === id
              ? { ...it, done: current.done, done_at: current.done_at }
              : it
          )
        );
        setError(GENERIC_ERROR);
        return false;
      }
      setError(null);
      return true;
    },
    [supabase]
  );

  /** Borra definitivamente. Devuelve true si se borró. */
  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      const { error: err } = await supabase.from("items").delete().eq("id", id);
      if (err) {
        setError(GENERIC_ERROR);
        return false;
      }
      setItems((prev) => prev.filter((it) => it.id !== id));
      setError(null);
      return true;
    },
    [supabase]
  );

  return { items, loading, error, add, update, toggleDone, remove, refresh };
}
