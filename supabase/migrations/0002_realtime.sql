-- radar-personal — migración 2: tiempo real
-- Publica los cambios de public.items por el canal de Realtime de Supabase.
-- Con RLS activo, cada cliente SOLO recibe los cambios de sus propias filas
-- (Realtime valida las policies de SELECT antes de entregar cada evento).
alter publication supabase_realtime add table public.items;

-- Sin esto, los eventos DELETE solo traen el id de la fila borrada y el
-- filtro por user_id del cliente no puede evaluarse → el evento se descarta
-- y el panel no se entera de los borrados. FULL publica la fila completa.
alter table public.items replica identity full;
