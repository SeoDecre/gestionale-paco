-- 03 — Parametri configurabili a runtime (§9).
-- Le soglie NON stanno nel codice: se NEXI le cambia, Paco le aggiorna da solo.

create table public.parametri_target (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references auth.users(id) on delete cascade,
  target           public.target_lettera not null,
  -- null = illimitato: min null su C (<40k), max null su E (>140k).
  soglia_min_annua numeric(14, 2),
  soglia_max_annua numeric(14, 2),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (owner_id, target),
  check (
    soglia_min_annua is null
    or soglia_max_annua is null
    or soglia_min_annua < soglia_max_annua
  )
);

create trigger parametri_target_set_updated_at before update on public.parametri_target
  for each row execute function public.tg_set_updated_at();
create trigger parametri_target_set_owner before insert on public.parametri_target
  for each row execute function public.tg_set_owner();

-- Contenitore chiave/valore per i parametri futuri: §9 dice esplicitamente
-- che la sezione è "pensata per crescere" (durata appuntamento, fasce orarie).
create table public.parametri_app (
  owner_id   uuid not null references auth.users(id) on delete cascade,
  chiave     text not null,
  valore     jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (owner_id, chiave)
);

create trigger parametri_app_set_updated_at before update on public.parametri_app
  for each row execute function public.tg_set_updated_at();

-- Legge un parametro intero con fallback, senza far esplodere le query
-- quando la chiave non è ancora stata scritta.
create or replace function public.param_int(p_chiave text, p_default int)
returns int
language sql
stable
as $$
  select coalesce(
    (select (valore #>> '{}')::int
       from public.parametri_app
      where owner_id = auth.uid() and chiave = p_chiave),
    p_default)
$$;

select public.applica_rls_owner('parametri_target');
select public.applica_rls_owner('parametri_app');

-- §4/§9: il target si SUGGERISCE, non si applica mai in automatico.
-- Il lead memorizza il fatturato MENSILE; le soglie sono ANNUE.
create or replace function public.suggerisci_target(p_fatturato_mensile numeric)
returns public.target_lettera
language sql
stable
as $$
  select pt.target
    from public.parametri_target pt
   where pt.owner_id = auth.uid()
     and p_fatturato_mensile is not null
     and (pt.soglia_min_annua is null or p_fatturato_mensile * 12 >= pt.soglia_min_annua)
     and (pt.soglia_max_annua is null or p_fatturato_mensile * 12 <  pt.soglia_max_annua)
   limit 1
$$;
