-- 10 — Sezioni tecniche NEXI (§10): tabella 1:1 col lead, mostrata nella scheda
-- solo se i brand includono NEXI.
--
-- Tabella separata (non jsonb, non colonne sul lead): sono 12 campi tipizzati con
-- CHECK, e restano NULL per i lead solo-Hera — tenerli fuori dalla tabella calda
-- `lead`. I booleani sono TRI-STATE: NULL = domanda non posta.

create table public.lead_nexi (
  lead_id                uuid primary key references public.lead(id) on delete cascade,
  owner_id               uuid not null references auth.users(id) on delete cascade,

  -- Multi-POS & pagamenti
  rateale_interessato    boolean,
  extra_ue_valuta_estera boolean,
  dcc_attivo             boolean, -- rilevante solo se extra_ue_valuta_estera = true

  -- American Express
  amex_attivo            boolean,
  amex_continuare        boolean, -- se amex_attivo = true ("vuole continuare?")
  amex_attivare          boolean, -- se amex_attivo = false ("vuole attivare?")

  -- Costi POS attuali (la verifica target vs transato è un avviso UI, mai auto)
  canone_attuale         numeric(12, 2) check (canone_attuale is null or canone_attuale >= 0),
  commissioni_attuali    text,

  -- Operatività & tecnologia (ridotta: solo 2 domande, §10)
  transazioni_sotto_30   boolean,
  transazioni_fuori_sede boolean,

  -- Banca & Business (ridotta)
  vende_online           boolean,
  ordini_telefonici      boolean,

  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create trigger lead_nexi_set_updated_at before update on public.lead_nexi
  for each row execute function public.tg_set_updated_at();
create trigger lead_nexi_set_owner before insert on public.lead_nexi
  for each row execute function public.tg_set_owner();

select public.applica_rls_owner('lead_nexi');
