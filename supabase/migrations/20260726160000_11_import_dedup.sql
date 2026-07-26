-- 11 — Supporto import (§8): ricerca fuzzy per il dedupe quando manca la P.IVA.
--
-- Il dedupe primario è per P.IVA esatta (query lato client). Le righe senza
-- P.IVA cadono su questo match fuzzy nome+CAP (pg_trgm), come da specifica §8.
-- Nessuna tabella di staging: l'import è interamente lato client, questa è solo
-- la funzione di somiglianza.

create or replace function public.lead_simili(
  p_nome   text,
  p_cap    text default null,
  p_soglia real default 0.4
)
returns table (id uuid, ragione_sociale text, cap text, similarita real)
language sql
stable
set search_path = public, extensions
as $$
  select l.id,
         l.ragione_sociale,
         l.cap,
         similarity(lower(l.ragione_sociale), lower(p_nome)) as similarita
    from public.lead l
   where l.owner_id = auth.uid()
     and p_nome is not null
     and (p_cap is null or l.cap = p_cap)
     and similarity(lower(l.ragione_sociale), lower(p_nome)) >= p_soglia
   order by similarita desc
   limit 5
$$;
