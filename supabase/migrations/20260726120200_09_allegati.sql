-- 09 — Allegati: foto, documenti, memo vocali (§4/§5).
--
-- I FILE stanno in un bucket Storage PRIVATO; qui vivono solo i metadati e il
-- path. L'app accede ai file con URL firmati a scadenza breve.
--
-- Ciclo di vita del memo vocale (§5): stato da_integrare -> integrato; un job
-- notturno (migrazione 15) cancella il FILE 48h dopo integrato_at ma TIENE la
-- riga come lapide (file_eliminato_at valorizzato). Qui si prepara solo lo schema.

create table public.allegati (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references auth.users(id) on delete cascade,
  lead_id           uuid not null references public.lead(id) on delete cascade,
  tipo              public.tipo_allegato not null,
  -- Chiave dentro il bucket 'allegati'. Convenzione: {owner_id}/{lead_id}/{file}.
  storage_path      text not null,
  nome_file         text,
  durata_sec        integer check (durata_sec is null or durata_sec >= 0),
  -- Solo l'audio ha uno stato del ciclo di vita; foto/documento no.
  stato             public.stato_audio,
  integrato_at      timestamptz,
  file_eliminato_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint allegati_stato_solo_audio
    check ((tipo = 'audio') = (stato is not null))
);

create index allegati_lead_idx on public.allegati (lead_id);
-- Supporto al job di purge (migrazione 15): solo audio integrati non ancora
-- cancellati. Il file si rimuove 48h dopo integrato_at.
create index allegati_audio_da_purgare_idx
  on public.allegati (integrato_at)
  where tipo = 'audio' and file_eliminato_at is null;

create trigger allegati_set_updated_at before update on public.allegati
  for each row execute function public.tg_set_updated_at();
create trigger allegati_set_owner before insert on public.allegati
  for each row execute function public.tg_set_owner();

select public.applica_rls_owner('allegati');

-- --------------------------------------------------------------- storage bucket
-- Bucket privato. L'accesso passa da URL firmati generati lato client.
insert into storage.buckets (id, name, public)
values ('allegati', 'allegati', false)
on conflict (id) do nothing;

-- RLS su storage.objects: ognuno vede/scrive solo la propria cartella, cioè i
-- file il cui primo segmento di path è il proprio uuid utente.
create policy "allegati_own_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'allegati' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "allegati_own_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'allegati' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "allegati_own_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'allegati' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'allegati' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "allegati_own_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'allegati' and (storage.foldername(name))[1] = auth.uid()::text);
