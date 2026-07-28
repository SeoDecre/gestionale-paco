-- 19 — Zone anche per COMUNE, non solo per CAP.
--
-- Il CRM 3.0 raggruppava per comune (`aree_custom.comuni` = lista di nomi:
-- LIVORNO, CECINA, PIOMBINO…), il build attuale per CAP (`zone_cap`). Sono
-- entrambi utili e non si escludono: il CAP è preciso ma va censito uno per
-- uno, il comune si scrive una volta e prende tutta la città.
--
-- Precedenza: CAP prima, comune come ripiego. Il CAP è più specifico — un
-- comune grande può stare a cavallo di due zone di lavoro, il contrario no.

create table public.zone_comune (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  zona_id    uuid not null references public.zone(id) on delete cascade,
  comune     text not null check (length(btrim(comune)) between 1 and 120),
  created_at timestamptz not null default now()
);

-- Un comune sta in UNA sola zona, come per i CAP: altrimenti la derivazione
-- sarebbe ambigua. Normalizzato lower+trim perché l'import scrive "LIVORNO",
-- la digitazione a mano "Livorno".
create unique index zone_comune_uk
  on public.zone_comune (owner_id, lower(btrim(comune)));
create index zone_comune_zona_idx on public.zone_comune (zona_id);

create trigger zone_comune_set_owner before insert on public.zone_comune
  for each row execute function public.tg_set_owner();

select public.applica_rls_owner('zone_comune');

-- ------------------------------------------------- derivazione zona aggiornata
-- Rimpiazza tg_lead_deriva_zona (migrazione 04) aggiungendo il ripiego sul
-- comune. Il resto del comportamento è identico: zona_manuale continua a
-- bloccare del tutto la derivazione.
create or replace function public.tg_lead_deriva_zona()
returns trigger
language plpgsql
as $$
declare
  v_owner uuid := coalesce(new.owner_id, auth.uid());
  v_zona  uuid;
begin
  if new.zona_manuale then
    return new;
  end if;

  -- 1) per CAP (eventualmente qualificato dal comune, per i CAP condivisi)
  if new.cap is not null then
    select zc.zona_id into v_zona
      from public.zone_cap zc
     where zc.owner_id = v_owner
       and zc.cap = new.cap
       and (zc.comune is null or new.comune is null
            or lower(btrim(zc.comune)) = lower(btrim(new.comune)))
     order by (zc.comune is not null) desc
     limit 1;
  end if;

  -- 2) ripiego sul comune
  if v_zona is null and new.comune is not null then
    select zk.zona_id into v_zona
      from public.zone_comune zk
     where zk.owner_id = v_owner
       and lower(btrim(zk.comune)) = lower(btrim(new.comune))
     limit 1;
  end if;

  new.zona_id := v_zona;
  return new;
end
$$;

-- Il trigger della 04 ascoltava solo (cap, comune, zona_manuale): va bene anche
-- qui, sono gli stessi campi che influenzano la derivazione.
