-- 14 — Web push (§7): iscrizioni push per utente/dispositivo + marcatore del
-- promemoria appuntamento già inviato (evita doppioni al cron).

create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null,
  p256dh     text not null,
  auth       text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  -- Stesso endpoint per lo stesso utente = stessa iscrizione (re-subscribe).
  unique (owner_id, endpoint)
);

create index push_subscriptions_owner_idx on public.push_subscriptions (owner_id);

create trigger push_subscriptions_set_owner before insert on public.push_subscriptions
  for each row execute function public.tg_set_owner();

select public.applica_rls_owner('push_subscriptions');

-- Il promemoria "1 ora prima" (§7) si invia una sola volta per appuntamento.
alter table public.appuntamenti
  add column if not exists promemoria_inviato_at timestamptz;
