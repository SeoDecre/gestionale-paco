-- 12 — Offerte per brand (§9) + collegamento "offerta consigliata" sul lead (§4).
--
-- Le offerte NON si cancellano a cuor leggero: una volta proposte a un lead
-- (lead.offerta_consigliata_id) vanno ARCHIVIATE (stato='archiviata'), non
-- eliminate, così "quale offerta è stata proposta" sopravvive. La UI archivia;
-- la FK sotto è on delete set null solo come rete di sicurezza.

create table public.offerte (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  brand       public.brand not null,
  nome        text not null check (length(btrim(nome)) between 1 and 120),
  descrizione text,
  -- Intervallo di target a cui l'offerta si applica (lettere E/A/B/C).
  target_min  public.target_lettera,
  target_max  public.target_lettera,
  canone      numeric(12, 2) check (canone is null or canone >= 0),
  -- PDF originale dell'offerta, nel bucket privato 'allegati' sotto {owner}/offerte/.
  pdf_path    text,
  stato       public.stato_offerta not null default 'attiva',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index offerte_brand_idx on public.offerte (owner_id, brand, stato);

create trigger offerte_set_updated_at before update on public.offerte
  for each row execute function public.tg_set_updated_at();
create trigger offerte_set_owner before insert on public.offerte
  for each row execute function public.tg_set_owner();

select public.applica_rls_owner('offerte');

alter table public.lead
  add column if not exists offerta_consigliata_id uuid
    references public.offerte(id) on delete set null;
