-- 05 — Contatti, sedi, censimento POS per sede, concorrenti a livello azienda.
--
-- Tre concetti POS distinti, MAI da confondere (§4/§5):
--   1. lead_concorrenti  — chip concorrenti a livello AZIENDA ("non per sede")
--   2. sedi_pos          — il censimento reale PER SEDE (tipo + IBAN proprio)
--   3. lavorazioni.pos_richiesti (migrazione 06) — dichiarati a voce in chiamata
-- Qui vivono #1 e #2.

-- --------------------------------------------------------------------- contatti
create table public.contatti (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  lead_id     uuid not null references public.lead(id) on delete cascade,
  nome        text not null check (length(btrim(nome)) between 1 and 120),
  ruolo_id    uuid references public.ruoli_contatto(id) on delete set null,
  telefono    text,
  email       text,
  -- §4: un solo contatto "Principale" per lead (vincolo sotto).
  principale  boolean not null default false,
  -- §4: badge di provenienza (mail call center / import / inserito a mano).
  provenienza public.provenienza_contatto not null default 'manuale',
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Nome vincolo = quello atteso da lib/errors.ts ("Esiste già un contatto
-- Principale per questo lead"). Indice parziale: vincola solo i Principale.
create unique index contatti_un_solo_principale
  on public.contatti (lead_id) where principale;
create index contatti_lead_idx on public.contatti (lead_id);

create trigger contatti_set_updated_at before update on public.contatti
  for each row execute function public.tg_set_updated_at();
create trigger contatti_set_owner before insert on public.contatti
  for each row execute function public.tg_set_owner();

-- ------------------------------------------------------------------------- sedi
-- §4: massimo 4 sedi per lead. Lo slot (1..4) è assegnato da un trigger BEFORE
-- INSERT; un trigger che conta sarebbe soggetto a race, ma con utente singolo
-- e il vincolo UNIQUE come rete di sicurezza è adeguato.
create table public.sedi (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  lead_id      uuid not null references public.lead(id) on delete cascade,
  slot         smallint not null check (slot between 1 and 4),
  etichetta_id uuid references public.etichette_sede(id) on delete set null,
  indirizzo    text,
  civico       text,
  cap          text check (cap is null or cap ~ '^[0-9]{5}$'),
  comune       text,
  provincia    text check (provincia is null or provincia ~ '^[A-Za-z]{2}$'),
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- Nome auto-generato = sedi_lead_id_slot_key (atteso da lib/errors.ts).
  unique (lead_id, slot)
);

create index sedi_lead_idx on public.sedi (lead_id);

-- Assegna lo slot libero più basso; se sono già 4, blocca con l'errore che
-- lib/errors.ts traduce in "Massimo 4 sedi per lead (§4)".
create or replace function public.tg_sede_assegna_slot()
returns trigger
language plpgsql
as $$
begin
  if new.slot is null then
    -- coalesce a 5 (non 1) quando non c'è slot libero: così cade nel ramo
    -- "> 4" qui sotto invece di affidarsi alla collisione sullo UNIQUE.
    select coalesce(min(s), 5) into new.slot
      from generate_series(1, 4) g(s)
     where not exists (
       select 1 from public.sedi
        where lead_id = new.lead_id and slot = g.s);
  end if;
  if new.slot is null or new.slot > 4 then
    raise exception 'Massimo 4 sedi per lead'
      using errcode = '23505', constraint = 'sedi_lead_id_slot_key';
  end if;
  return new;
end
$$;

create trigger sedi_assegna_slot before insert on public.sedi
  for each row execute function public.tg_sede_assegna_slot();
create trigger sedi_set_updated_at before update on public.sedi
  for each row execute function public.tg_set_updated_at();
create trigger sedi_set_owner before insert on public.sedi
  for each row execute function public.tg_set_owner();

-- --------------------------------------------------------------------- sedi_pos
-- Il censimento reale dei terminali PER SEDE (§5). Ogni terminale ha un tipo
-- e — se il tipo lo richiede — un IBAN proprio.
create table public.sedi_pos (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  sede_id     uuid not null references public.sedi(id) on delete cascade,
  -- restrict: non si cancella un tipo POS ancora censito da qualche parte.
  tipo_pos_id uuid references public.tipi_pos(id) on delete restrict,
  -- IBAN proprio del terminale (§4/§5). Solo se il tipo lo richiede: la UI
  -- nasconde il campo per il POS Virtuale (tipi_pos.richiede_iban = false).
  iban        text check (iban is null or iban ~ '^[A-Z]{2}[0-9]{2}[A-Za-z0-9]{11,30}$'),
  seriale     text,
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index sedi_pos_sede_idx on public.sedi_pos (sede_id);

create trigger sedi_pos_set_updated_at before update on public.sedi_pos
  for each row execute function public.tg_set_updated_at();
create trigger sedi_pos_set_owner before insert on public.sedi_pos
  for each row execute function public.tg_set_owner();

-- ------------------------------------------------------------- lead_concorrenti
-- §4: i concorrenti sono chip a livello AZIENDA, non per sede. Tabella ponte
-- lead × vocabolario concorrenti_pos.
create table public.lead_concorrenti (
  owner_id       uuid not null references auth.users(id) on delete cascade,
  lead_id        uuid not null references public.lead(id) on delete cascade,
  concorrente_id uuid not null references public.concorrenti_pos(id) on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (lead_id, concorrente_id)
);

create index lead_concorrenti_lead_idx on public.lead_concorrenti (lead_id);

create trigger lead_concorrenti_set_owner before insert on public.lead_concorrenti
  for each row execute function public.tg_set_owner();

select public.applica_rls_owner('contatti');
select public.applica_rls_owner('sedi');
select public.applica_rls_owner('sedi_pos');
select public.applica_rls_owner('lead_concorrenti');
