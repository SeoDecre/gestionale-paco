-- 00 — Estensioni e funzioni di supporto condivise.

create extension if not exists btree_gist with schema extensions;  -- EXCLUDE su (uuid =, tstzrange &&)
create extension if not exists pg_trgm    with schema extensions;  -- dedupe fuzzy nome+CAP (§8)

-- pg_cron e pg_net vivono nello schema dedicato su Supabase e servono
-- solo dalla migrazione 15 in poi (purge audio + push).
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- ---------------------------------------------------------------- updated_at
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

-- ---------------------------------------------------------------- owner_id
-- owner_id non viene mai preso dal client: lo impone il server dal JWT.
-- Con RLS attiva un client non potrebbe comunque scrivere per altri, ma
-- così il campo si compila da solo e le insert restano pulite.
create or replace function public.tg_set_owner()
returns trigger
language plpgsql
as $$
begin
  new.owner_id := coalesce(auth.uid(), new.owner_id);
  return new;
end
$$;

-- ---------------------------------------------------------------- RLS
-- Applica a una tabella la politica standard "sono i miei dati".
--
-- La RLS si attiva nella STESSA migrazione che crea la tabella, non in una
-- migrazione finale: senza stack locale ogni migrazione va dritta su un
-- progetto cloud, e una tabella che esiste anche solo per qualche minuto
-- senza RLS è leggibile da chiunque abbia la anon key (che sta nel bundle JS).
--
-- Oggi l'utente è uno solo, quindi la politica è di fatto un no-op; serve
-- perché il giorno in cui esiste un secondo agente non ci sia nulla da
-- ricordarsi di fare.
create or replace function public.applica_rls_owner(p_tabella text)
returns void
language plpgsql
as $$
begin
  execute format('alter table public.%I enable row level security', p_tabella);
  -- FORCE: la policy vale anche per il proprietario della tabella.
  execute format('alter table public.%I force row level security', p_tabella);
  execute format(
    'create policy %I_owner_all on public.%I
       for all to authenticated
       using (owner_id = auth.uid())
       with check (owner_id = auth.uid())', p_tabella, p_tabella);
end
$$;
