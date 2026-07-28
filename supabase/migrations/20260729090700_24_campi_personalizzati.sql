-- 24 — Campi personalizzati per brand (configuratore multi-azienda del 3.0).
--
-- NOTA DI CONTESTO: un configuratore generico multi-azienda era stato
-- ESCLUSO in fase di intervista (§14). Rientra qui perché richiesto
-- esplicitamente come parte del porting del CRM 3.0, dove esisteva ed era
-- usato (`campi_config` + `campi_valori`). Serve a porre domande specifiche di
-- un brand — tipicamente Hera Comm, che §11 lascia senza campi propri — senza
-- una migrazione per ogni domanda nuova.
--
-- I campi standard NON passano di qui: restano colonne tipizzate. Questo è per
-- le domande che cambiano con la campagna commerciale.

create type public.tipo_campo as enum ('testo', 'numero', 'si_no', 'tendina', 'data');

create table public.campi_config (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  brand      public.brand not null,
  etichetta  text not null check (length(btrim(etichetta)) between 1 and 200),
  tipo       public.tipo_campo not null default 'testo',
  -- Voci della tendina. Vuoto per gli altri tipi.
  opzioni    jsonb not null default '[]'::jsonb check (jsonb_typeof(opzioni) = 'array'),
  sezione    text not null default 'Domande aggiuntive',
  ordine     smallint not null default 0,
  -- Soft delete: spegnere un campo non deve cancellare le risposte già date,
  -- che restano parte dello storico del lead (stessa scelta del 3.0).
  attivo     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index campi_config_brand_idx on public.campi_config (owner_id, brand, attivo, sezione, ordine);

create trigger campi_config_set_updated_at before update on public.campi_config
  for each row execute function public.tg_set_updated_at();
create trigger campi_config_set_owner before insert on public.campi_config
  for each row execute function public.tg_set_owner();

select public.applica_rls_owner('campi_config');

create table public.campi_valori (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  lead_id    uuid not null references public.lead(id) on delete cascade,
  campo_id   uuid not null references public.campi_config(id) on delete cascade,
  -- Sempre testo: il tipo vive su campi_config e la UI converte. Una colonna
  -- per tipo sarebbe sei colonne quasi sempre nulle.
  valore     text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lead_id, campo_id)
);

create index campi_valori_lead_idx on public.campi_valori (lead_id);

create trigger campi_valori_set_updated_at before update on public.campi_valori
  for each row execute function public.tg_set_updated_at();
create trigger campi_valori_set_owner before insert on public.campi_valori
  for each row execute function public.tg_set_owner();

select public.applica_rls_owner('campi_valori');
