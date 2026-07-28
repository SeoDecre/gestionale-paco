-- 23 — Campi anagrafici del CRM 3.0 che mancavano sul lead.
--
-- Tutti opzionali e tutti sulla tabella `lead` perché si leggono insieme
-- all'anagrafica in lista/scheda: metterli altrove costringerebbe a una join
-- per mostrare la testata.
--
-- Nota su `telefono`/`cellulare`: nel 3.0 stavano sul lead (tel/cell) OLTRE
-- che nella rubrica contatti. Si tengono entrambi: il numero del centralino
-- non è "un contatto", è dell'azienda, e la lista lo mostra senza dover
-- pescare il contatto principale.

alter table public.lead
  add column if not exists telefono         text,
  add column if not exists cellulare        text,
  add column if not exists pec              text,
  add column if not exists forma_giuridica  text,
  -- MCC = Merchant Category Code, la categoria merceologica dei circuiti.
  add column if not exists mcc              text,
  -- PSP attualmente in uso (acquirer): campo libero, arriva dall'Excel NEXI.
  add column if not exists psp_attuale      text,
  add column if not exists orari            text,
  add column if not exists n_punti_vendita  smallint
    check (n_punti_vendita is null or (n_punti_vendita >= 0 and n_punti_vendita <= 999)),
  -- Etichetta dell'offerta suggerita dal transato (GOLD ZERO / POWER+ ZERO /
  -- ELITE+). Nel 3.0 era calcolata al salvataggio e mostrata come badge in
  -- testata. Resta un suggerimento memorizzato, non un impegno commerciale.
  add column if not exists proposta_offerta text,
  -- Sessione di import che ha creato il lead: nel 3.0 coloravano di lilla le
  -- righe appena importate, per ritrovarle subito dopo un import.
  add column if not exists import_sessione  text;

create index if not exists lead_import_sessione_idx
  on public.lead (owner_id, import_sessione)
  where import_sessione is not null;
