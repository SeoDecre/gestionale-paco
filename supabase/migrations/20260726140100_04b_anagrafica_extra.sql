-- 04b — Campi anagrafica emersi dalla rilettura della specifica (§4).
--
-- §4 "Campi sempre visibili": Email e Sito web sono a livello LEAD (l'email del
-- contatto è un'altra cosa). §4 Sedi: la sede ha un NOME libero ("come su
-- scontrino POS") oltre all'etichetta da tendina.

alter table public.lead
  add column if not exists email    text,
  add column if not exists sito_web text;

alter table public.sedi
  add column if not exists nome text;
