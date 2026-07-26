-- 15 — Pianificazione notifiche (§7): pg_cron → funzione helper → pg_net →
-- Edge Function 'notifiche'.
--
-- NOTA PROD: l'URL della funzione è quello del progetto DEV. Su un nuovo
-- progetto va aggiornato, e prima va creato il secret vault 'service_role_key'
-- (vedi HANDOFF), altrimenti l'helper non trova la chiave.
--
-- NOTA FUSO: pg_cron gira in UTC. Gli orari sotto (05:00/18:00 UTC) sono le
-- 07:00/20:00 di Roma in ORA LEGALE (CEST). In ora solare (CET) scattano un'ora
-- prima. Il promemoria (ogni 15') è indipendente dal fuso.

create or replace function public.invia_notifiche(p_tipo text)
returns void
language plpgsql
security definer
set search_path = public, net, vault
as $$
declare
  v_key text;
begin
  select decrypted_secret into v_key
    from vault.decrypted_secrets
   where name = 'service_role_key';
  if v_key is null then
    raise warning 'invia_notifiche: secret service_role_key mancante';
    return;
  end if;

  perform net.http_post(
    url     := 'https://jhiopnnrhokabishwvxh.supabase.co/functions/v1/notifiche',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body    := jsonb_build_object('tipo', p_tipo)
  );
end
$$;

-- Ripulisce eventuali job omonimi (idempotenza), poi (ri)pianifica.
do $$
declare j text;
begin
  foreach j in array array['notifiche_mattina', 'notifiche_sera', 'notifiche_promemoria'] loop
    perform cron.unschedule(j) where exists (select 1 from cron.job where jobname = j);
  end loop;
end
$$;

select cron.schedule('notifiche_mattina',    '0 5 * * *',   $$ select public.invia_notifiche('mattina') $$);
select cron.schedule('notifiche_sera',       '0 18 * * *',  $$ select public.invia_notifiche('sera') $$);
select cron.schedule('notifiche_promemoria', '*/15 * * * *', $$ select public.invia_notifiche('promemoria') $$);
