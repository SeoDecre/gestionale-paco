-- 08 — Stato derivato del lead per (lead, brand).
--
-- Regola: lo stato riflette la lavorazione PIÙ RECENTE con esito.
--   nessuna lavorazione            -> da_contattare
--   lavorazioni ma nessun esito    -> in_lavorazione
--   ultimo esito chiusura positiva -> chiuso_vinto
--   ultimo esito chiusura (neg)    -> chiuso_perso
--   ultimo esito non di chiusura   -> in_lavorazione
-- Prendere l'ULTIMO esito (non "esiste una chiusura") fa sì che un lead riaperto
-- dopo un "perso" torni correttamente in_lavorazione.

create or replace function public.ricalcola_stato_lead(p_lead uuid, p_brand public.brand)
returns void
language plpgsql
as $$
declare
  v_owner uuid;
  v_chiusura boolean;
  v_positivo boolean;
  v_ha_lav boolean;
  v_stato public.stato_lead;
begin
  select owner_id into v_owner from public.lead where id = p_lead;
  if v_owner is null then return; end if;

  select e.is_chiusura, e.esito_positivo
    into v_chiusura, v_positivo
    from public.lavorazioni l
    join public.esiti_lavorazione e on e.id = l.esito_id
   where l.lead_id = p_lead and l.brand = p_brand
   order by l.data_ora desc, l.created_at desc
   limit 1;

  if found then
    if v_chiusura and coalesce(v_positivo, false) then
      v_stato := 'chiuso_vinto';
    elsif v_chiusura then
      v_stato := 'chiuso_perso';
    else
      v_stato := 'in_lavorazione';
    end if;
  else
    select exists (
      select 1 from public.lavorazioni
       where lead_id = p_lead and brand = p_brand
    ) into v_ha_lav;
    v_stato := case when v_ha_lav then 'in_lavorazione' else 'da_contattare' end;
  end if;

  -- Registrare una lavorazione su un brand aggiunge anche il badge se manca
  -- (ASSUNZIONE: brand esplicito, ma una lavorazione lo implica).
  insert into public.lead_brand (owner_id, lead_id, brand, stato)
  values (v_owner, p_lead, p_brand, v_stato)
  on conflict (lead_id, brand) do update
    set stato = excluded.stato, updated_at = now();
end
$$;

-- Ricalcolo a ogni cambio di lavorazione (insert/update/delete).
create or replace function public.tg_lavorazione_ricalcola()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.ricalcola_stato_lead(old.lead_id, old.brand);
    return old;
  end if;
  perform public.ricalcola_stato_lead(new.lead_id, new.brand);
  if tg_op = 'UPDATE'
     and (old.lead_id, old.brand) is distinct from (new.lead_id, new.brand) then
    perform public.ricalcola_stato_lead(old.lead_id, old.brand);
  end if;
  return new;
end
$$;

create trigger lavorazioni_ricalcola_stato
  after insert or update or delete on public.lavorazioni
  for each row execute function public.tg_lavorazione_ricalcola();

-- Cambiare le flag di un esito (is_chiusura / esito_positivo) deve ricalcolare
-- tutti i lead che lo usano (§ vocabolari: "cambiarle DEVE ricalcolare").
create or replace function public.tg_esito_ricalcola()
returns trigger
language plpgsql
as $$
begin
  perform public.ricalcola_stato_lead(t.lead_id, t.brand)
    from (
      select distinct lead_id, brand
        from public.lavorazioni
       where esito_id = new.id
    ) t;
  return new;
end
$$;

create trigger esiti_ricalcola_stato
  after update of is_chiusura, esito_positivo on public.esiti_lavorazione
  for each row execute function public.tg_esito_ricalcola();
