"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Habit, HabitCompletion } from "@/lib/habits";
import { todayYmd } from "@/lib/dates";

const GENERIC_ERROR = "No se pudo guardar. Revisa tu conexión e intenta de nuevo.";

export function useHabits() {
  const supabase = useMemo(() => createClient(), []);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const completionsRef = useRef<HabitCompletion[]>(completions);
  completionsRef.current = completions;

  const refresh = useCallback(async () => {
    // Se carga TODO el historial: para un panel personal son pocas filas al
    // año, y así el mes navegado hacia atrás y la "última vez" nunca mienten.
    const [h, c] = await Promise.all([
      supabase.from("habits").select("*").order("created_at", { ascending: true }),
      supabase.from("habit_completions").select("*"),
    ]);
    if (h.error || c.error) {
      setError("No se pudieron cargar tus hábitos. Recarga la página.");
    } else {
      setHabits(h.data ?? []);
      setCompletions(c.data ?? []);
      setError(null);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Tiempo real: hábitos y completados se sincronizan entre dispositivos
  // (lo que marques en el celular aparece en el iPad de la pared).
  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      channel = supabase
        .channel("habits-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "habits", filter: `user_id=eq.${user.id}` },
          (payload) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new as Habit;
              setHabits((prev) => (prev.some((x) => x.id === row.id) ? prev : [...prev, row]));
            } else if (payload.eventType === "UPDATE") {
              const row = payload.new as Habit;
              setHabits((prev) => prev.map((x) => (x.id === row.id ? row : x)));
            } else if (payload.eventType === "DELETE") {
              const old = payload.old as { id?: string };
              if (old.id) setHabits((prev) => prev.filter((x) => x.id !== old.id));
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "habit_completions", filter: `user_id=eq.${user.id}` },
          (payload) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new as HabitCompletion;
              setCompletions((prev) =>
                prev.some((x) => x.id === row.id) ? prev : [...prev, row]
              );
            } else if (payload.eventType === "DELETE") {
              const old = payload.old as { id?: string };
              if (old.id) setCompletions((prev) => prev.filter((x) => x.id !== old.id));
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") void refresh();
        });
    })();

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [supabase, refresh]);

  // Evita el doble-tap: un toggle en vuelo por hábito.
  const inFlight = useRef(new Set<string>());

  /** Marca/desmarca el hábito HOY. Devuelve true si el servidor confirmó. */
  const toggleToday = useCallback(
    async (habitId: string): Promise<boolean> => {
      if (inFlight.current.has(habitId)) return false;
      inFlight.current.add(habitId);
      try {
        return await doToggle(habitId);
      } finally {
        inFlight.current.delete(habitId);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supabase]
  );

  const doToggle = useCallback(
    async (habitId: string): Promise<boolean> => {
      const today = todayYmd();
      const existing = completionsRef.current.find(
        (c) => c.habit_id === habitId && c.done_on === today
      );
      if (existing) {
        setCompletions((prev) => prev.filter((c) => c.id !== existing.id));
        const { error: err } = await supabase
          .from("habit_completions")
          .delete()
          .eq("id", existing.id);
        if (err) {
          setCompletions((prev) => [...prev, existing]);
          setError(GENERIC_ERROR);
          return false;
        }
        return true;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Tu sesión venció. Recarga la página para entrar de nuevo.");
        return false;
      }
      const { data, error: err } = await supabase
        .from("habit_completions")
        .insert({ user_id: user.id, habit_id: habitId, done_on: today })
        .select()
        .single();
      if (err?.code === "23505") {
        // Ya existía (carrera con otro dispositivo): no es un error real.
        void refresh();
        return true;
      }
      if (err || !data) {
        setError(GENERIC_ERROR);
        return false;
      }
      setCompletions((prev) =>
        prev.some((c) => c.id === data.id) ? prev : [...prev, data]
      );
      setError(null);
      return true;
    },
    [supabase]
  );

  const addHabit = useCallback(
    async (draft: Pick<Habit, "title" | "complexity" | "periodicity" | "icon" | "color">): Promise<boolean> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Tu sesión venció. Recarga la página para entrar de nuevo.");
        return false;
      }
      const { data, error: err } = await supabase
        .from("habits")
        .insert({ ...draft, title: draft.title.trim(), user_id: user.id })
        .select()
        .single();
      if (err || !data) {
        setError(GENERIC_ERROR);
        return false;
      }
      setHabits((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]));
      setError(null);
      return true;
    },
    [supabase]
  );

  const updateHabit = useCallback(
    async (
      id: string,
      patch: Partial<Pick<Habit, "title" | "complexity" | "periodicity" | "icon" | "color">>
    ): Promise<boolean> => {
      const { data, error: err } = await supabase
        .from("habits")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (err || !data) {
        setError(GENERIC_ERROR);
        return false;
      }
      setHabits((prev) => prev.map((x) => (x.id === id ? data : x)));
      setError(null);
      return true;
    },
    [supabase]
  );

  /** Borra el hábito Y su historial de completados (cascade). */
  const removeHabit = useCallback(
    async (id: string): Promise<boolean> => {
      const { error: err } = await supabase.from("habits").delete().eq("id", id);
      if (err) {
        setError(GENERIC_ERROR);
        return false;
      }
      setHabits((prev) => prev.filter((x) => x.id !== id));
      setCompletions((prev) => prev.filter((c) => c.habit_id !== id));
      setError(null);
      return true;
    },
    [supabase]
  );

  return {
    habits, completions, loading, error,
    toggleToday, addHabit, updateHabit, removeHabit, refresh,
  };
}
