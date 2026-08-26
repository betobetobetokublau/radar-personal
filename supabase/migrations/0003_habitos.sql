-- radar-personal — migración 3: hábitos
-- Catálogo de hábitos (título, complejidad, periodicidad, ícono, color)
-- + registro de completados por día (para rachas y "última vez").

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  complexity text not null check (complexity in ('baja', 'media', 'alta')),
  periodicity text not null check (periodicity in ('diaria', 'semanal', 'mensual')),
  icon text not null check (char_length(icon) between 1 and 30),
  color text not null check (color in ('ambar', 'vino', 'azul', 'violeta', 'verde')),
  created_at timestamptz not null default now()
);

create index habits_user_idx on public.habits (user_id);

alter table public.habits enable row level security;
create policy "own habits — select" on public.habits
  for select using (auth.uid() = user_id);
create policy "own habits — insert" on public.habits
  for insert with check (auth.uid() = user_id);
create policy "own habits — update" on public.habits
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own habits — delete" on public.habits
  for delete using (auth.uid() = user_id);

create table public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  done_on date not null,
  created_at timestamptz not null default now(),
  -- un hábito solo se completa una vez por día
  constraint habit_once_per_day unique (habit_id, done_on)
);

create index habit_completions_user_day_idx
  on public.habit_completions (user_id, done_on);

alter table public.habit_completions enable row level security;
create policy "own completions — select" on public.habit_completions
  for select using (auth.uid() = user_id);
create policy "own completions — insert" on public.habit_completions
  for insert with check (auth.uid() = user_id);
create policy "own completions — update" on public.habit_completions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own completions — delete" on public.habit_completions
  for delete using (auth.uid() = user_id);

-- Tiempo real (mismas reglas que items: publicar + replica identity full
-- para que los DELETE lleguen con el filtro por usuario).
alter publication supabase_realtime add table public.habits, public.habit_completions;
alter table public.habits replica identity full;
alter table public.habit_completions replica identity full;
