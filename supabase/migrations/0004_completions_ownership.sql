-- radar-personal — migración 4: blindaje de propiedad en completados.
-- La FK simple permitía (en teoría) insertar un completado apuntando al
-- hábito de OTRO usuario con tu propio user_id. La FK compuesta obliga a
-- que (habit_id, user_id) exista en habits: el hábito debe ser tuyo.
alter table public.habits
  add constraint habits_id_user_unique unique (id, user_id);

alter table public.habit_completions
  drop constraint habit_completions_habit_id_fkey;

alter table public.habit_completions
  add constraint habit_completions_habit_fk
  foreign key (habit_id, user_id)
  references public.habits (id, user_id)
  on delete cascade;
