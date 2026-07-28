-- 17 — Profilo agente e mandati commerciali.
--
-- Portato dal CRM 3.0 (tabelle `agente` e `mandati`). Serve a firmare le mail,
-- i report e i PDF con i dati veri dell'agente e del mandato del brand: senza
-- questo ogni condivisione esce anonima.
--
-- Il profilo è UNO per utente (owner_id è la chiave primaria, non un id
-- separato): l'app è monoutente per disegno, e una riga per utente rende
-- impossibile ritrovarsi con due profili in conflitto.

create table public.profilo_agente (
  owner_id   uuid primary key references auth.users(id) on delete cascade,
  nome       text,
  cognome    text,
  area       text,
  tel        text,
  cell       text,
  email      text,
  indirizzo  text,
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profilo_agente_set_updated_at before update on public.profilo_agente
  for each row execute function public.tg_set_updated_at();

-- Il mandato è per BRAND: codice agente, admin di riferimento e firma cambiano
-- fra NEXI e Hera Comm, ed è esattamente ciò che finisce in fondo alle mail.
create table public.mandati (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  brand           public.brand not null,
  ragione_sociale text,
  codice_agente   text,
  admin           text,
  area            text,
  tel             text,
  cell            text,
  email           text,
  referente       text,
  indirizzo       text,
  firma           text default 'Cordiali saluti,',
  note            text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (owner_id, brand)
);

create trigger mandati_set_updated_at before update on public.mandati
  for each row execute function public.tg_set_updated_at();
create trigger mandati_set_owner before insert on public.mandati
  for each row execute function public.tg_set_owner();

select public.applica_rls_owner('profilo_agente');
select public.applica_rls_owner('mandati');

-- ------------------------------------------------------------------ seed
-- Si aggancia al seed per-utente già esistente (migrazione 16): un nuovo utente
-- nasce con il profilo vuoto e i due mandati pronti da compilare, così la UI
-- non deve gestire il caso "riga assente".
create or replace function public.seed_agente_mandati(p_owner uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profilo_agente (owner_id) values (p_owner)
    on conflict (owner_id) do nothing;
  insert into public.mandati (owner_id, brand, firma)
    values (p_owner, 'NEXI', 'Cordiali saluti,'),
           (p_owner, 'HERA_COMM', 'Cordiali saluti,')
    on conflict (owner_id, brand) do nothing;
end
$$;

-- Backfill per l'utente già esistente.
do $$
declare u uuid;
begin
  for u in select id from auth.users loop
    perform public.seed_agente_mandati(u);
  end loop;
end
$$;
