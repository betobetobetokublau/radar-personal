-- radar-personal — migración inicial
-- Una tabla para los 3 tipos de ítems (tareas, fechas, proyectos),
-- RLS para que cada quien vea solo lo suyo, y allowlist de signup
-- a nivel servidor (solo el correo de Beto puede crear cuenta).

-- ============================================================
-- 1. Tabla de ítems
-- ============================================================
create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('task', 'date', 'project')),
  title text not null check (char_length(title) between 1 and 500),
  note text check (char_length(note) <= 5000),
  due_date date,
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Las fechas importantes SIEMPRE llevan fecha; los demás tipos no.
  constraint date_requires_due_date
    check (kind <> 'date' or due_date is not null),
  constraint only_date_has_due_date
    check (kind = 'date' or due_date is null),

  -- Solo los proyectos llevan nota.
  constraint only_project_has_note
    check (kind = 'project' or note is null),

  -- Las fechas no se tachan (decisión de diseño: se atenúan al pasar).
  constraint dates_are_never_done
    check (kind <> 'date' or done = false)
);

create index items_user_kind_idx on public.items (user_id, kind);

-- ============================================================
-- 2. Row Level Security: cada quien ve SOLO sus ítems
-- ============================================================
alter table public.items enable row level security;

create policy "own items — select" on public.items
  for select using (auth.uid() = user_id);
create policy "own items — insert" on public.items
  for insert with check (auth.uid() = user_id);
create policy "own items — update" on public.items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own items — delete" on public.items
  for delete using (auth.uid() = user_id);

-- ============================================================
-- 3. updated_at automático
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger items_set_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

-- ============================================================
-- 4. Allowlist de signup — el candado a nivel SERVIDOR.
-- Bloquea la creación de cualquier usuario cuyo correo no sea el
-- de Beto, sin importar por qué ruta llegue (OTP, signup, API).
-- ============================================================
create or replace function public.enforce_signup_allowlist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- OJO: comparar NULL da NULL (no falso) en SQL — sin el chequeo explícito
  -- de NULL, un signup sin correo (teléfono, anónimo) pasaría el candado.
  if new.email is null or lower(new.email) not in ('alberto@kublau.com') then
    raise exception 'Registro no permitido para este correo';
  end if;
  return new;
end;
$$;

create trigger enforce_signup_allowlist
  before insert on auth.users
  for each row execute function public.enforce_signup_allowlist();
