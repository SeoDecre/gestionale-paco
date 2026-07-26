-- 04 — Lead: l'anagrafica aziendale e i brand su cui è in lavorazione.
--
-- Nota numerazione: l'etichetta "_04_" è quella logica del piano; il timestamp
-- è successivo alle migrazioni 00–16 perché quelle sono già applicate sul
-- progetto cloud e non si possono inserire migrazioni con timestamp anteriore.

create table public.lead (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references auth.users(id) on delete cascade,
  ragione_sociale   text not null check (length(btrim(ragione_sociale)) between 1 and 200),
  -- P.IVA italiana = 11 cifre. Nullable: §8 prevede lead SENZA P.IVA (in quel
  -- caso il dedupe cade sul fuzzy nome+CAP). Vincolo NAMED perché lib/errors.ts
  -- traduce esattamente 'lead_piva_check' -> "La P.IVA deve essere di 11 cifre".
  piva              text,
  codice_fiscale    text,
  -- Indirizzo della sede principale, per il link mappa (§3/§4). Le altre sedi
  -- stanno in public.sedi (migrazione 05).
  indirizzo         text,
  civico            text,
  cap               text check (cap is null or cap ~ '^[0-9]{5}$'),
  comune            text,
  provincia         text check (provincia is null or provincia ~ '^[A-Za-z]{2}$'),
  -- Zona derivata dal CAP via public.zone_cap (§7). zona_manuale = l'utente
  -- l'ha forzata a mano e la derivazione automatica non deve sovrascriverla.
  zona_id           uuid references public.zone(id) on delete set null,
  zona_manuale      boolean not null default false,
  -- §4: il fatturato è MENSILE; suggerisci_target() lo confronta con le soglie
  -- ANNUE moltiplicandolo × 12.
  fatturato_mensile numeric(14, 2) check (fatturato_mensile is null or fatturato_mensile >= 0),
  -- Lettera target APPLICATA. Mai scritta in automatico: la si applica con un
  -- bottone "Applica" a partire dal suggerimento (§4).
  target            public.target_lettera,
  fonte             public.fonte_lead not null default 'import_excel',
  note              text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint lead_piva_check check (piva is null or piva ~ '^[0-9]{11}$')
);

create index lead_zona_idx on public.lead (zona_id);
create index lead_cap_idx on public.lead (cap);
-- Ricerca per ragione sociale nella lista (§4): trigram su testo minuscolo.
create index lead_ragsoc_trgm_idx
  on public.lead using gin (lower(ragione_sociale) extensions.gin_trgm_ops);
-- Un lead con P.IVA è unico per P.IVA (§8 dedupe esatto). Parziale: i lead
-- senza P.IVA non collidono tra loro.
create unique index lead_piva_uk on public.lead (owner_id, piva) where piva is not null;

-- --------------------------------------------------------------- derivazione zona
-- ASSUNZIONE: la zona si deriva dal CAP quando l'utente non l'ha forzata (§7).
-- Il match preferisce la riga con comune specifico (CAP condivisi tra comuni).
-- Usa coalesce(owner_id, auth.uid()): all'INSERT owner_id non è ancora valorizzato
-- se questo trigger gira prima di lead_set_owner (ordine alfabetico dei trigger).
create or replace function public.tg_lead_deriva_zona()
returns trigger
language plpgsql
as $$
begin
  if not new.zona_manuale then
    if new.cap is null then
      new.zona_id := null;
    else
      select zc.zona_id into new.zona_id
        from public.zone_cap zc
       where zc.owner_id = coalesce(new.owner_id, auth.uid())
         and zc.cap = new.cap
         and (zc.comune is null or new.comune is null
              or lower(btrim(zc.comune)) = lower(btrim(new.comune)))
       order by (zc.comune is not null) desc
       limit 1;
    end if;
  end if;
  return new;
end
$$;

create trigger lead_deriva_zona
  before insert or update of cap, comune, zona_manuale on public.lead
  for each row execute function public.tg_lead_deriva_zona();
create trigger lead_set_updated_at before update on public.lead
  for each row execute function public.tg_set_updated_at();
create trigger lead_set_owner before insert on public.lead
  for each row execute function public.tg_set_owner();

-- ------------------------------------------------------------------- lead_brand
-- §1: un lead può portare entrambi i brand. Lo stato è tenuto PER (lead, brand)
-- — non per lead — perché un lead può essere chiuso per NEXI e ancora aperto per
-- Hera (il conflitto latente più grosso della specifica, risolto così).
--
-- ASSUNZIONE: l'insieme dei brand è ESPLICITO (badge testata gestiti dall'utente),
-- non derivato dall'esistenza di una lavorazione per quel brand.
--
-- 'stato' è DERIVATO dalle lavorazioni e verrà ricalcolato dal trigger della
-- migrazione 08. Default finché non esistono lavorazioni: da_contattare.
create table public.lead_brand (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  lead_id    uuid not null references public.lead(id) on delete cascade,
  brand      public.brand not null,
  stato      public.stato_lead not null default 'da_contattare',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lead_id, brand)
);

create index lead_brand_lead_idx on public.lead_brand (lead_id);
-- La dashboard (§3) conta i lead per (brand, stato): indice di supporto.
create index lead_brand_stato_idx on public.lead_brand (owner_id, brand, stato);

create trigger lead_brand_set_updated_at before update on public.lead_brand
  for each row execute function public.tg_set_updated_at();
create trigger lead_brand_set_owner before insert on public.lead_brand
  for each row execute function public.tg_set_owner();

select public.applica_rls_owner('lead');
select public.applica_rls_owner('lead_brand');
