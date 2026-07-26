-- 16 — Seed dei vocabolari alla creazione dell'utente.
--
-- Con la RLS attiva e FORCE, delle INSERT nude in migrazione fallirebbero
-- (nessun auth.uid() in contesto migrazione) e comunque non saprebbero a
-- quale utente attribuire le righe. Quindi: funzione SECURITY DEFINER
-- agganciata alla creazione dell'utente.
--
-- Sono i valori di partenza, non una gabbia: ogni voce è modificabile o
-- eliminabile da Configurazione azienda (§9).

create or replace function public.seed_vocabolari(p_owner uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.ruoli_contatto (owner_id, nome, ordine) values
    (p_owner, 'Titolare', 10),
    (p_owner, 'Socio', 20),
    (p_owner, 'Responsabile', 30),
    (p_owner, 'Dipendente', 40)
  on conflict (owner_id, nome) do nothing;

  insert into public.etichette_sede (owner_id, nome, ordine) values
    (p_owner, 'Sede legale', 10),
    (p_owner, 'Punto vendita', 20),
    (p_owner, 'Magazzino', 30)
  on conflict (owner_id, nome) do nothing;

  insert into public.azioni_successive (owner_id, nome, ordine) values
    (p_owner, 'Richiamare', 10),
    (p_owner, 'Fissare appuntamento', 20),
    (p_owner, 'Inviare offerta', 30),
    (p_owner, 'Attendere risposta', 40),
    (p_owner, 'Nessuna', 50)
  on conflict (owner_id, nome) do nothing;

  insert into public.concorrenti_pos (owner_id, nome, ordine) values
    (p_owner, 'SumUp', 10),
    (p_owner, 'Satispay', 20),
    (p_owner, 'Axerve', 30),
    (p_owner, 'Worldline', 40),
    (p_owner, 'Nexi (già cliente)', 50),
    (p_owner, 'POS bancario', 60),
    (p_owner, 'Altro', 70)
  on conflict (owner_id, nome) do nothing;

  -- §4: il POS Virtuale non ha IBAN proprio.
  insert into public.tipi_pos (owner_id, nome, ordine, richiede_iban) values
    (p_owner, 'Smart', 10, true),
    (p_owner, 'Fisso', 20, true),
    (p_owner, 'Mobile', 30, true),
    (p_owner, 'Virtuale', 40, false)
  on conflict (owner_id, nome) do nothing;

  -- is_chiusura + esito_positivo guidano lo stato derivato del lead (08).
  insert into public.esiti_lavorazione
    (owner_id, nome, ordine, is_chiusura, esito_positivo) values
    (p_owner, 'Non risponde',         10, false, null),
    (p_owner, 'Da richiamare',        20, false, null),
    (p_owner, 'Interessato',          30, false, null),
    (p_owner, 'Appuntamento fissato', 40, false, null),
    (p_owner, 'In valutazione',       50, false, null),
    (p_owner, 'Contratto firmato',    60, true,  true),
    (p_owner, 'Non interessato',      70, true,  false),
    (p_owner, 'Non idoneo',           80, true,  false)
  on conflict (owner_id, nome) do nothing;

  -- §9: soglie ufficiali di partenza, editabili da Parametri target.
  -- min null = nessun minimo (C), max null = nessun massimo (E).
  insert into public.parametri_target
    (owner_id, target, soglia_min_annua, soglia_max_annua) values
    (p_owner, 'E', 140000, null),
    (p_owner, 'A',  60000, 140000),
    (p_owner, 'B',  40000, 60000),
    (p_owner, 'C',   null, 40000)
  on conflict (owner_id, target) do nothing;

  insert into public.parametri_app (owner_id, chiave, valore) values
    (p_owner, 'durata_appuntamento_min', '60'::jsonb)
  on conflict (owner_id, chiave) do nothing;

  -- Le ZONE non si seminano: sono il territorio di Paco, le definisce lui (§7).
end
$$;

create or replace function public.tg_seed_nuovo_utente()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_vocabolari(new.id);
  return new;
end
$$;

create trigger seed_vocabolari_su_nuovo_utente
  after insert on auth.users
  for each row execute function public.tg_seed_nuovo_utente();
