-- 07 — Appuntamenti, con anti-accavallamento a livello di DB (§6).
--
-- `fine` è una colonna FISICA riempita da trigger, non generata: timestamptz +
-- interval è STABLE, non IMMUTABLE, quindi una generated column non compila.
-- L'intervallo è half-open '[)' così 10–11 e 11–12 back-to-back sono leciti
-- (è esattamente il pattern "prima e dopo" del §6). Gli annullati sono esclusi
-- dal vincolo, altrimenti uno slot annullato bloccherebbe per sempre il riuso.

create table public.appuntamenti (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references auth.users(id) on delete cascade,
  lead_id        uuid references public.lead(id) on delete cascade,
  brand          public.brand,
  inizio         timestamptz not null,
  fine           timestamptz not null,
  durata_min     integer not null check (durata_min > 0),
  stato          public.stato_appuntamento not null default 'pianificato',
  luogo          text,
  note           text,
  -- La lavorazione da cui è nato (Registra lavorazione + appuntamento, §6).
  lavorazione_id uuid references public.lavorazioni(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index appuntamenti_owner_inizio_idx on public.appuntamenti (owner_id, inizio);
create index appuntamenti_lead_idx on public.appuntamenti (lead_id);

-- Calcola fine e durata prima di scrivere. Durata di default dai parametri app
-- (§9: 'durata_appuntamento_min', fallback 60).
create or replace function public.tg_appuntamento_calcola_fine()
returns trigger
language plpgsql
as $$
declare
  v_durata int;
begin
  v_durata := coalesce(new.durata_min, public.param_int('durata_appuntamento_min', 60));
  if v_durata <= 0 then v_durata := 60; end if;
  new.durata_min := v_durata;
  new.fine := new.inizio + make_interval(mins => v_durata);
  return new;
end
$$;

create trigger appuntamenti_calcola_fine
  before insert or update of inizio, durata_min on public.appuntamenti
  for each row execute function public.tg_appuntamento_calcola_fine();
create trigger appuntamenti_set_updated_at before update on public.appuntamenti
  for each row execute function public.tg_set_updated_at();
create trigger appuntamenti_set_owner before insert on public.appuntamenti
  for each row execute function public.tg_set_owner();

-- Anti-accavallamento: nessun altro appuntamento non annullato dello stesso
-- utente può intersecare la stessa fascia. Violazione = 23P01 -> lib/errors.ts
-- traduce in "Slot già occupato".
alter table public.appuntamenti
  add constraint appuntamenti_no_overlap
  exclude using gist (
    owner_id with =,
    tstzrange(inizio, fine, '[)') with &&
  ) where (stato <> 'annullato');

select public.applica_rls_owner('appuntamenti');
