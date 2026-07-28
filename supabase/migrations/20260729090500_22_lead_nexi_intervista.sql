-- 22 — Intervista commerciale NEXI completa (dal CRM 3.0).
--
-- La 10 aveva le 12 domande di §10. Il 3.0 ne poneva una trentina, divise per
-- schede: Anagrafica POS, Multi-POS, Amex, Costi, Operatività, Banca&Business.
-- Qui si aggiungono quelle mancanti, con la stessa convenzione della 10:
-- boolean TRI-STATE, NULL = domanda non posta (diverso da "risposto no").
--
-- Riuso dove il concetto esisteva già invece di duplicare la colonna:
--   pagamento_rate  -> rateale_interessato        (già in 10)
--   stranieri       -> extra_ue_valuta_estera     (già in 10)
--   amex_conv/att   -> amex_attivo/amex_attivare  (già in 10)
--   canone_att      -> canone_attuale             (già in 10)
--   transaz30       -> transazioni_sotto_30       (già in 10)
--   fuori_sede      -> transazioni_fuori_sede     (già in 10)
--   online/ordtel   -> vende_online/ordini_telefonici (già in 10)
--   dcc             -> dcc_attivo                 (già in 10)
--   pos_attuale     -> public.lead_concorrenti    (già in 05)
--   esigenze        -> public.lead_esigenze       (18)
--   transato_annuo  -> lead.fatturato_mensile × 12

alter table public.lead_nexi
  -- Anagrafica POS
  add column if not exists sicuro_no_nexi        boolean,
  add column if not exists mai_stato_nexi        boolean,
  add column if not exists piva_stessa_punti     boolean,

  -- Multi-POS
  add column if not exists due_iban              boolean,
  add column if not exists differenzia_pagamenti boolean,
  -- Testo: nel 3.0 si scriveva "5%", "circa 6", "non lo sa". Forzarlo a
  -- numerico perderebbe proprio le risposte vaghe, che sono la maggioranza.
  add column if not exists tasso_interesse       text,

  -- Costi POS. commissioni_attuali (già in 10) resta il campo libero;
  -- qui il dettaglio per tipo carta, come la tabellina del 3.0:
  -- {"Carte di credito":"1,20", "Pagobancomat":"0,80", ...}
  add column if not exists commissioni_dettaglio jsonb not null default '{}'::jsonb,

  -- Operatività
  add column if not exists difficolta_agenzia    boolean,
  add column if not exists storni                boolean,
  add column if not exists interruzioni_servizio boolean,
  -- Array di modalità attuali: ["Pre-autorizzazione","PAN manuale"]
  add column if not exists modalita_attuali      jsonb not null default '[]'::jsonb,
  add column if not exists connettivita          text,

  -- Banca & Business
  add column if not exists soddisfatto_banca     boolean,
  add column if not exists cambio_banca          boolean;

-- I due jsonb devono restare della forma attesa dalla UI, altrimenti un
-- import sbagliato manda in errore il rendering invece del salvataggio.
alter table public.lead_nexi
  drop constraint if exists lead_nexi_commissioni_oggetto;
alter table public.lead_nexi
  add constraint lead_nexi_commissioni_oggetto
    check (jsonb_typeof(commissioni_dettaglio) = 'object');

alter table public.lead_nexi
  drop constraint if exists lead_nexi_modalita_array;
alter table public.lead_nexi
  add constraint lead_nexi_modalita_array
    check (jsonb_typeof(modalita_attuali) = 'array');
