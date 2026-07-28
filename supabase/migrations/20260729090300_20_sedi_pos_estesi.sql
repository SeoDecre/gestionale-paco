-- 20 — Sedi e POS: i campi che il CRM 3.0 aveva e qui mancavano.
--
-- Sedi (era `indirizzi`):
--   principale    — quale sede è quella "buona" per mappa e corrispondenza.
--                   Nel 3.0 era un radio esclusivo, qui lo impone un trigger.
--   consegna_pos  — dove va materialmente consegnato il terminale. Non
--                   coincide sempre con la sede legale, ed è l'informazione
--                   che fa sbagliare le consegne quando manca.
--
-- POS di sede (era `pos_richiesti`):
--   quantita, esigenza, differenzia_pagamenti, amex — nel 3.0 una riga POS
--   portava anche quanti pezzi e con che condizioni, non solo tipo + IBAN.

alter table public.sedi
  add column if not exists principale   boolean not null default false,
  add column if not exists consegna_pos boolean not null default false;

-- Una sola sede principale per lead. Indice parziale: le non-principali non
-- collidono fra loro. Stessa forma del vincolo su contatti.principale.
create unique index if not exists sedi_una_sola_principale
  on public.sedi (lead_id) where principale;

-- La prima sede di un lead nasce principale: senza questo un lead con una
-- sola sede non ne avrebbe nessuna marcata, e la mappa non saprebbe che usare.
create or replace function public.tg_sede_prima_principale()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.sedi where lead_id = new.lead_id and principale
  ) then
    new.principale := true;
  end if;
  return new;
end
$$;

create trigger sedi_prima_principale before insert on public.sedi
  for each row execute function public.tg_sede_prima_principale();

alter table public.sedi_pos
  add column if not exists quantita              smallint not null default 1
    check (quantita > 0 and quantita <= 99),
  add column if not exists esigenza_id           uuid references public.esigenze_pos(id) on delete set null,
  add column if not exists differenzia_pagamenti boolean,
  add column if not exists amex                  boolean,
  add column if not exists note                  text;
