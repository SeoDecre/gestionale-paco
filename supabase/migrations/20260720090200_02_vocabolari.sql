-- 02 — Vocabolari gestibili da Paco (§4, §5, §9).
--
-- Sette tabelle separate, non una tabella generica: ognuna ha (o avrà)
-- attributi propri — esiti_lavorazione.is_chiusura, tipi_pos.richiede_iban,
-- zone.colore — e ognuna è puntata da una FK vera, così cancellare una voce
-- ancora in uso viene bloccato dal DB invece di lasciare riferimenti orfani.
--
-- Le tabelle sono scritte per esteso invece di usare LIKE ... INCLUDING ALL:
-- LIKE non copia le foreign key, quindi il risparmio sarebbe apparente.

-- ------------------------------------------------------------ ruoli contatto
create table public.ruoli_contatto (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  nome       text not null check (length(btrim(nome)) between 1 and 80),
  ordine     smallint not null default 0,
  attivo     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, nome)
);

-- ----------------------------------------------------------- etichette sede
create table public.etichette_sede (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  nome       text not null check (length(btrim(nome)) between 1 and 80),
  ordine     smallint not null default 0,
  attivo     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, nome)
);

-- -------------------------------------------------------- azioni successive
create table public.azioni_successive (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  nome       text not null check (length(btrim(nome)) between 1 and 80),
  ordine     smallint not null default 0,
  attivo     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, nome)
);

-- ---------------------------------------------------------- concorrenti POS
-- §4: chip a livello AZIENDA (non per sede). Vocabolario, non testo libero,
-- perché §12 chiede "concorrenti dominanti per zona": serve aggregare.
create table public.concorrenti_pos (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  nome       text not null check (length(btrim(nome)) between 1 and 80),
  ordine     smallint not null default 0,
  attivo     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, nome)
);

-- ------------------------------------------------------------------ tipi POS
create table public.tipi_pos (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  nome          text not null check (length(btrim(nome)) between 1 and 80),
  ordine        smallint not null default 0,
  attivo        boolean not null default true,
  -- Il POS Virtuale non ha IBAN proprio: la UI nasconde il campo.
  richiede_iban boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (owner_id, nome)
);

-- ------------------------------------------------------- esiti lavorazione
-- Le due flag qui sotto guidano lo stato derivato del lead (migrazione 08).
-- Cambiarle DEVE ricalcolare gli stati: ci pensa il trigger in 08.
create table public.esiti_lavorazione (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references auth.users(id) on delete cascade,
  nome           text not null check (length(btrim(nome)) between 1 and 80),
  ordine         smallint not null default 0,
  attivo         boolean not null default true,
  -- true = questo esito CHIUDE il lead per quel brand.
  is_chiusura    boolean not null default false,
  -- true = chiusura positiva (contratto), false = persa, null = neutro.
  esito_positivo boolean,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (owner_id, nome),
  -- Un esito che non chiude non può dichiararsi vinto o perso.
  constraint esiti_positivo_solo_se_chiusura
    check (esito_positivo is null or is_chiusura)
);

-- ---------------------------------------------------------------------- zone
-- §6/§7: zona = gruppo di CAP con un nome. Nessuna geometria, nessun
-- calcolo di percorrenza (§6 lo esclude esplicitamente).
create table public.zone (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  nome       text not null check (length(btrim(nome)) between 1 and 80),
  ordine     smallint not null default 0,
  attivo     boolean not null default true,
  colore     text,
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, nome)
);

create table public.zone_cap (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  zona_id    uuid not null references public.zone(id) on delete cascade,
  cap        text not null check (cap ~ '^[0-9]{5}$'),
  -- Alcuni CAP coprono più comuni: il comune fa da discriminante.
  comune     text,
  created_at timestamptz not null default now()
);

-- Un CAP (eventualmente qualificato dal comune) sta in UNA sola zona,
-- altrimenti la derivazione automatica della zona sarebbe ambigua.
create unique index zone_cap_uk
  on public.zone_cap (owner_id, cap, coalesce(comune, ''));
create index zone_cap_zona_idx on public.zone_cap (zona_id);

-- ------------------------------------------------------------------ trigger
do $$
declare t text;
begin
  foreach t in array array[
    'ruoli_contatto', 'etichette_sede', 'azioni_successive', 'concorrenti_pos',
    'tipi_pos', 'esiti_lavorazione', 'zone'
  ] loop
    execute format(
      'create trigger %I_set_updated_at before update on public.%I
         for each row execute function public.tg_set_updated_at()', t, t);
    execute format(
      'create trigger %I_set_owner before insert on public.%I
         for each row execute function public.tg_set_owner()', t, t);
  end loop;
end
$$;

create trigger zone_cap_set_owner before insert on public.zone_cap
  for each row execute function public.tg_set_owner();

-- ---------------------------------------------------------------------- RLS
do $$
declare t text;
begin
  foreach t in array array[
    'ruoli_contatto', 'etichette_sede', 'azioni_successive', 'concorrenti_pos',
    'tipi_pos', 'esiti_lavorazione', 'zone', 'zone_cap'
  ] loop
    perform public.applica_rls_owner(t);
  end loop;
end
$$;
