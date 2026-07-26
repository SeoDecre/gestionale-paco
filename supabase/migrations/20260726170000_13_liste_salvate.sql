-- 13 — Liste salvate (§13): filtri riusabili sia per l'export sia come vista di
-- lavoro. I filtri sono jsonb (l'insieme cresce nel tempo); le colonne export
-- selezionate si ricordano con la lista.

create table public.liste_salvate (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references auth.users(id) on delete cascade,
  nome           text not null check (length(btrim(nome)) between 1 and 120),
  filtri         jsonb not null default '{}'::jsonb,
  colonne_export jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (owner_id, nome)
);

create trigger liste_salvate_set_updated_at before update on public.liste_salvate
  for each row execute function public.tg_set_updated_at();
create trigger liste_salvate_set_owner before insert on public.liste_salvate
  for each row execute function public.tg_set_owner();

select public.applica_rls_owner('liste_salvate');
