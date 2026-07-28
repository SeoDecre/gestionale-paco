-- 25 — Aggancia i nuovi seed alla creazione dell'utente.
--
-- La 16 chiamava solo seed_vocabolari(). Le 17 e 18 hanno aggiunto profilo
-- agente, mandati, stati di verifica ed esigenze POS: senza questo un utente
-- nuovo nascerebbe senza, e la UI dovrebbe gestire ovunque il caso "riga
-- assente" invece che il caso "riga vuota".

create or replace function public.tg_seed_nuovo_utente()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_vocabolari(new.id);
  perform public.seed_agente_mandati(new.id);
  perform public.seed_verifica_esigenze(new.id);
  return new;
end
$$;
