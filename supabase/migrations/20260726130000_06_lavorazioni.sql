-- 06 — Lavorazioni: ogni "tocco" su un lead per un brand, con il suo esito.
--
-- Lo stato del lead per (lead, brand) è DERIVATO da queste righe (trigger nella
-- migrazione 08), mai impostato a mano. `pos_richiesti` è il terzo concetto POS
-- (§4/§5): quanti POS il cliente ha dichiarato A VOCE in questa chiamata — da
-- confrontare col censimento reale in sedi_pos.

create table public.lavorazioni (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             uuid not null references auth.users(id) on delete cascade,
  lead_id              uuid not null references public.lead(id) on delete cascade,
  brand                public.brand not null,
  -- restrict: non si cancella un esito ancora usato da una lavorazione.
  esito_id             uuid references public.esiti_lavorazione(id) on delete restrict,
  azione_successiva_id uuid references public.azioni_successive(id) on delete set null,
  pos_richiesti        smallint check (pos_richiesti is null or pos_richiesti >= 0),
  -- Con quale contatto si è parlato (§4: chiamata -> lavorazione automatica).
  contatto_id          uuid references public.contatti(id) on delete set null,
  note                 text,
  data_ora             timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index lavorazioni_lead_brand_idx on public.lavorazioni (lead_id, brand);
create index lavorazioni_data_idx on public.lavorazioni (owner_id, data_ora desc);

create trigger lavorazioni_set_updated_at before update on public.lavorazioni
  for each row execute function public.tg_set_updated_at();
create trigger lavorazioni_set_owner before insert on public.lavorazioni
  for each row execute function public.tg_set_owner();

select public.applica_rls_owner('lavorazioni');
