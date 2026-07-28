-- 18 — Stato di verifica del lead + colori sui vocabolari.
--
-- Portato dal CRM 3.0. Due cose che il build attuale non aveva:
--
-- 1. `verify_state` — un ciclo di vita PARALLELO allo stato commerciale:
--    "l'anagrafica è confermata?" (non verificato / verificato / in attesa
--    Nexi / inesistente). È un asse diverso da da_contattare→chiuso: un lead
--    può essere chiuso vinto e ancora non verificato, e nel vecchio CRM
--    colorava la riga in lista. Vocabolario, non enum: nel 3.0 l'agente si
--    aggiungeva stati da solo dalla tendina.
--
-- 2. I colori. Nel 3.0 ogni voce di `opzioni_custom` portava colore_bg /
--    colore_fg / colore_dot e la UI li usava per le pillole. Le tinte §2 del
--    build attuale sono semantiche e restano il default; questi campi sono un
--    OVERRIDE opzionale per voce, null = usa la tinta semantica.

-- ---------------------------------------------------- colori sui vocabolari
do $$
declare t text;
begin
  foreach t in array array[
    'ruoli_contatto', 'etichette_sede', 'azioni_successive', 'concorrenti_pos',
    'tipi_pos', 'esiti_lavorazione'
  ] loop
    execute format('alter table public.%I
      add column if not exists colore_bg  text,
      add column if not exists colore_fg  text,
      add column if not exists colore_dot text', t);
  end loop;
end
$$;

-- ------------------------------------------------------------ stati verifica
create table public.stati_verifica (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  nome       text not null check (length(btrim(nome)) between 1 and 80),
  ordine     smallint not null default 0,
  attivo     boolean not null default true,
  colore_bg  text,
  colore_fg  text,
  colore_dot text,
  -- true = l'anagrafica è confermata. La lista evidenzia queste righe, come
  -- faceva il 3.0 con row-verificato.
  confermato boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, nome)
);

create trigger stati_verifica_set_updated_at before update on public.stati_verifica
  for each row execute function public.tg_set_updated_at();
create trigger stati_verifica_set_owner before insert on public.stati_verifica
  for each row execute function public.tg_set_owner();

select public.applica_rls_owner('stati_verifica');

-- on delete set null: cancellare uno stato di verifica non deve cancellare i
-- lead che lo portano — tornano semplicemente "non verificato".
alter table public.lead
  add column if not exists verifica_id uuid references public.stati_verifica(id) on delete set null;

create index if not exists lead_verifica_idx on public.lead (owner_id, verifica_id);

-- ------------------------------------------------------------------ esigenze POS
-- Nel 3.0 era opzioni_custom['esigenze'] + ['esigenza_pos']: il tipo di bisogno
-- del cliente ("POS senza fili", "POS per asporto", "POS+cassa integrato").
create table public.esigenze_pos (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  nome       text not null check (length(btrim(nome)) between 1 and 80),
  ordine     smallint not null default 0,
  attivo     boolean not null default true,
  colore_bg  text,
  colore_fg  text,
  colore_dot text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, nome)
);

create trigger esigenze_pos_set_updated_at before update on public.esigenze_pos
  for each row execute function public.tg_set_updated_at();
create trigger esigenze_pos_set_owner before insert on public.esigenze_pos
  for each row execute function public.tg_set_owner();

select public.applica_rls_owner('esigenze_pos');

-- Esigenze scelte a livello AZIENDA (come i concorrenti: §4 "non per sede").
create table public.lead_esigenze (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  lead_id     uuid not null references public.lead(id) on delete cascade,
  esigenza_id uuid not null references public.esigenze_pos(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (lead_id, esigenza_id)
);

create index lead_esigenze_lead_idx on public.lead_esigenze (lead_id);

create trigger lead_esigenze_set_owner before insert on public.lead_esigenze
  for each row execute function public.tg_set_owner();

select public.applica_rls_owner('lead_esigenze');

-- ------------------------------------------------------------------- seed
create or replace function public.seed_verifica_esigenze(p_owner uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Colori ripresi 1:1 dal CRM 3.0 così le pillole restano riconoscibili.
  insert into public.stati_verifica
    (owner_id, nome, ordine, confermato, colore_bg, colore_fg, colore_dot) values
    (p_owner, 'Non verificato', 10, false, '#F1EFE8', '#5F5E5A', '#B4B2A9'),
    (p_owner, 'Verificato',     20, true,  '#EAF3DE', '#27500A', '#639922'),
    (p_owner, 'In attesa Nexi', 30, false, '#FAEEDA', '#633806', '#EF9F27'),
    (p_owner, 'Inesistente',    40, false, '#FCEBEB', '#791F1F', '#E24B4A')
  on conflict (owner_id, nome) do nothing;

  insert into public.esigenze_pos (owner_id, nome, ordine) values
    (p_owner, 'POS senza fili',      10),
    (p_owner, 'POS per asporto',     20),
    (p_owner, 'POS+cassa integrato', 30),
    (p_owner, 'Standard',            40)
  on conflict (owner_id, nome) do nothing;
end
$$;

do $$
declare u uuid;
begin
  for u in select id from auth.users loop
    perform public.seed_verifica_esigenze(u);
  end loop;
end
$$;
