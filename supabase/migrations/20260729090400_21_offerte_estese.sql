-- 21 — Offerte: i campi del catalogo del CRM 3.0.
--
-- Nel 3.0 un'offerta non era solo "nome + canone": era il PDF commerciale
-- caricato, da cui il server estraeva il testo e provava a ricavarne i
-- parametri (canone, commissione, fascia di transato). Quei parametri servono
-- al motore di matching che propone l'offerta giusta per il transato del lead.
--
-- `versione` / `sostituisce_id`: le condizioni commerciali cambiano spesso e
-- ricaricare il PDF nuovo archivia il vecchio invece di sovrascriverlo, così
-- resta leggibile quale versione era stata proposta a chi.

alter table public.offerte
  add column if not exists categoria      text,
  -- Fascia di transato ANNUO a cui l'offerta si applica. Sono numeri, non
  -- lettere: le lettere di target (E/A/B/C) restano su target_min/target_max,
  -- che è un asse diverso — il compenso dell'agente, non la fascia di prezzo.
  add column if not exists transato_min   numeric(14, 2) check (transato_min is null or transato_min >= 0),
  add column if not exists transato_max   numeric(14, 2) check (transato_max is null or transato_max >= 0),
  add column if not exists commissione    numeric(6, 3) check (commissione is null or commissione >= 0),
  add column if not exists target_cliente text,
  add column if not exists note           text,
  -- Testo estratto dal PDF: serve alla ricerca e a rileggere le condizioni
  -- senza riaprire il file. Troncato lato client a 20k come nel 3.0.
  add column if not exists testo_estratto text,
  add column if not exists nome_file      text,
  add column if not exists versione       smallint not null default 1 check (versione >= 1),
  add column if not exists sostituisce_id uuid references public.offerte(id) on delete set null;

alter table public.offerte
  drop constraint if exists offerte_transato_coerente;
alter table public.offerte
  add constraint offerte_transato_coerente
    check (transato_min is null or transato_max is null or transato_min <= transato_max);

create index if not exists offerte_categoria_idx on public.offerte (owner_id, categoria);
