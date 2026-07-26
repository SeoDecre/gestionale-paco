-- 01 — Enum del dominio.
-- Sono enum (non tabelle) i valori che il CODICE deve conoscere per funzionare.
-- Tutto ciò che Paco deve poter cambiare da solo sta invece nei vocabolari (02).

create type public.brand as enum ('NEXI', 'HERA_COMM');

-- §3/§12: 'chiuso' è sdoppiato in vinto/perso, altrimenti la piastrella
-- "Chiusi (mese)" sommerebbe contratti firmati e rifiuti.
create type public.stato_lead as enum (
  'da_contattare',
  'in_lavorazione',
  'chiuso_vinto',
  'chiuso_perso'
);

-- §3: "Excel aziendale non ha riquadro, è la fonte predefinita".
create type public.fonte_lead as enum ('import_excel', 'self_gen', 'call_center_nexi');

create type public.target_lettera as enum ('E', 'A', 'B', 'C');

create type public.tipo_allegato as enum ('foto', 'documento', 'audio');

create type public.stato_audio as enum ('da_integrare', 'integrato');

create type public.stato_appuntamento as enum ('pianificato', 'fatto', 'annullato');

create type public.stato_offerta as enum ('attiva', 'archiviata');

-- §4: badge di provenienza sul contatto.
create type public.provenienza_contatto as enum (
  'mail_call_center',
  'import_excel',
  'manuale'
);

-- §8: le tre modalità di gestione doppioni.
create type public.merge_mode as enum ('sovrascrivi', 'lascia', 'integra');
