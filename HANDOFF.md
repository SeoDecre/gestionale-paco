# AgentPro CRM — Handoff

Last updated: 2026-07-28 — **all 8 milestones built and committed**, plus the four
§4/§5 reconciliation-polish items. Remaining work is §3 dashboard completeness,
§15 iPad layout, and real-device verification.

---

## Read first

1. **`AgentPro_Specifica_Sessionex sergio.md`** (Italian) — the authoritative
   functional spec, **§1–§15**. It is present in the repo. **§0 (stack) and §16
   (build order) are obsolete** — see "Decisions already settled".
2. This document — status, settled decisions, landmines.

An earlier version of this handoff warned the spec was missing and that features
were built to assumptions. **That warning is void** — the spec was recovered on
2026-07-26 and M2/M3 were reconciled against it (see "Spec reconciliation" below).

### Git workflow — non-negotiable

The user wants **all work committed directly to `master`, and no other branches,
ever**. Do not create feature branches. `master` auto-deploys to Vercel. Stated
explicitly by the user on 2026-07-26.

> Note for background/automated sessions: the harness may refuse file edits in the
> shared checkout until you call `EnterWorktree`, which creates a branch and
> contradicts the rule above. The documented per-repo opt-out is
> `{"worktree": {"bgIsolation": "none"}}` in `.claude/settings.json` (or
> `settings.local.json`). Create that file **before** the first edit — the guard
> also blocks writing the opt-out itself, so it has to be done by hand.

---

## Goal

A management/CRM web app for **Paco**, a field sales agent selling for two brands:
**NEXI** (payment terminals) and **Hera Comm** (energy).

He works from an iPhone in the field and an iPad/desktop at base. The app must be
installable to the iOS Home Screen (required for web push).

---

## Where things live

| | |
|---|---|
| Repo | `github.com/SeoDecre/gestionale-paco`, branch `master` |
| Deploy | Vercel — `gestionale-paco.vercel.app` (live, auto-deploys `master`) |
| Supabase dev project | ref `jhiopnnrhokabishwvxh` (West Europe / London) |
| psql pooler | `aws-1-eu-west-2.pooler.supabase.com:6543`, user `postgres.jhiopnnrhokabishwvxh` |
| App user | `pacoatworkdecre@gmail.com` |

**Vercel env vars** (set in *Vercel*, not Supabase): `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`. Without the first two the SPA
white-screens (`src/lib/supabase.ts` throws on missing env). Without the third,
push subscription fails in prod only.

There is **no prod Supabase project yet** — dev is doing double duty. Creating one
means: new project, `supabase db push` the same migrations, re-seed the Vault
secret, new Vercel env vars.

---

## Decisions already settled — do NOT re-litigate

These came out of a long structured interview with the user. Each was chosen
deliberately over stated alternatives.

**Stack** — Vite + React 19 + TypeScript (static SPA), Tailwind v4, TanStack
Query, React Router, supabase-js. Supabase for Postgres/Auth/Storage/Edge
Functions/pg_cron. Deploy to Vercel.

> Spec §0 describes Next.js + Prisma + Vercel Postgres + Vercel Blob + a
> shared-password cookie, and references an old repo `pacosoftdecre/agentpro-web`
> with "Fase 0/1" code. **All of that is discarded.** This build is greenfield.

**No Docker** — explicitly rejected by the user. There is *no* local Supabase
stack. Development runs against the cloud dev project; migrations are the only
sync mechanism.

**Auth** — Supabase Auth email+password. The spec's single shared password is
impossible in a static SPA (no server to sign a cookie) and was dropped.

**Single user, multi-user-ready** — one user (Paco) today, but every table has
`owner_id uuid references auth.users` with RLS (`owner_id = auth.uid()`) from
day one, so adding a second agent is a migration and not a rewrite.

**Naming** — Italian domain terms in DB and feature code (`lavorazioni.esito`,
`sedi.etichetta`, `contatti.principale`); English for infra (`owner_id`,
`created_at`, hooks, utils).

**Lead status is DERIVED from lavorazioni**, never hand-set. Each esito carries
`is_chiusura` + `esito_positivo`, giving
`da_contattare | in_lavorazione | chiuso_vinto | chiuso_perso`. Won/lost are split
because §3's "Chiusi (mese)" tile would otherwise sum signed contracts with
rejections.

**Status is held per (lead, brand)**, not per lead. §1 lets one lead carry both
brands, so a lead can be closed for NEXI and still open for Hera. This was the
single biggest latent conflict in the spec and it is resolved this way.

**Three distinct POS concepts — never conflate them:**
1. `lead_concorrenti` — competitor chips at **company** level (§4: "non per sede")
2. `sedi_pos` — the real **per-branch terminal census** (tipo + own IBAN)
3. `lavorazioni.pos_richiesti` — what was **declared verbally** on a call

The §4/§5 counters ("dichiarati a voce / censiti", "sedi censite X di Y") are
views comparing 3 against 2.

**Targets** — `parametri_target` holds runtime-editable E/A/B/C **annual** bands.
The lead stores fatturato **mensile**; `mensile × 12` is matched against the bands
to **suggest** a letter. Never auto-applied — always behind an "Applica" button (§4).

**Zones** — `zone` + `zone_cap` (CAP → zone, optional comune for shared CAPs).
Lead zone auto-derived from CAP, overridable via `zona_manuale`. "Zona comoda"
for planning suggestions = **same zone only**; the comfort check is written as a
predicate so adjacency can later be added as data, not a rewrite.

**Media** — in-app MediaRecorder → private Supabase Storage bucket + signed URLs.
Audio rows have `stato` + `integrato_at`. A nightly job deletes the **file** 48h
after `integrato_at` but **keeps the row** as a tombstone (`file_eliminato_at`).

**Imports** — client-side Excel parsing (SheetJS). Dedupe by exact P.IVA, falling
through to `pg_trgm` fuzzy match on nome+CAP. Call-center mail parsed by
deterministic regex. Lavorazioni/appuntamenti/contatti are **never** touched by
an import (§8).

**Hera Comm (§11) needs no brand-specific work.** Anagrafica + Registra lavorazione
+ Planning are shared with NEXI. No energy/fotovoltaico fields until Paco supplies
them. A generic multi-company configurator was explicitly **rejected** (§14).

**Testing** — Vitest on logic only (target banding, slot suggestion + overlap,
merge modes, mail parser, report aggregations). No component/E2E tests.

---

## Current Progress

**Everything below is committed and pushed to `origin/master`** (8 commits, working
tree clean as of this writing).

### Verification run at handoff time

```
npm run build   ✓  (tsc -b + vite build clean; 1,047 kB / 318 kB gzip)
npm run test    ✓  79 tests, 9 files, all pass
npm run lint    ✓  oxlint clean
```

> The legacy `AgentPro_CRM_3.0 copia/` folder (an old Express/SQLite prototype
> someone copied into the repo root) is now gitignored. Before that it was
> dumping dozens of warnings into `npm run lint`, which made the lint signal
> useless. It is **not** part of this build.

**Never visually verified.** No browser has been driven in any session so far
(`claude-in-chrome` is not connected in this environment). Every UI claim below
means "typechecks, builds, and its data path was exercised via psql/PostgREST" —
**not** "was seen rendered". This is the single largest gap.

### Milestone status

| # | Milestone | State |
|---|---|---|
| 1 | Scaffold, design tokens, auth, migrations 00–03/16 | done, verified |
| 2 | Lead / anagrafica / contatti / sedi / POS / allegati | done, verified via psql + PostgREST |
| 3 | Lavorazioni + Planning + Dashboard | done, verified via psql + PostgREST |
| 4 | Configurazione azienda (§9) | done, verified via API |
| 5 | NEXI sections (§10) | done, verified via API |
| 6 | Push + PWA (§7) | server-side done + verified; **real delivery untested** |
| 7 | Imports (§8) | done; Excel verified on the real file, **mail parser untuned** |
| 8 | Report + Export (§12/§13) | done, verified via API |

### Routes shipped (`src/router.tsx`)

`/login` · `/` dashboard · `/agenda` · `/lead` · `/lead/:id` · `/configurazione` ·
`/importa` · `/report`

### Migrations (all pushed clean to the dev project)

```
20260720090000_00_extensions_and_helpers.sql  btree_gist, pg_trgm, pg_cron, pg_net;
                                              tg_set_updated_at, tg_set_owner,
                                              applica_rls_owner()
20260720090100_01_enums.sql                   10 enums
20260720090200_02_vocabolari.sql              7 vocabulary tables + zone_cap
20260720090300_03_parametri.sql               parametri_target, parametri_app,
                                              param_int(), suggerisci_target()
20260720091600_16_seed_vocabolari.sql         per-user seed on auth.users insert
20260726120000_04_lead.sql                    lead (+ zona-derivation trigger,
                                              piva/cap checks), lead_brand
20260726120100_05_contatti_sedi_pos.sql       contatti (1-principale index), sedi
                                              (slot 1-4 trigger), sedi_pos,
                                              lead_concorrenti
20260726120200_09_allegati.sql                allegati + private Storage bucket
                                              'allegati' + 4 owner-folder policies
20260726130000_06_lavorazioni.sql             lavorazioni (esito, pos_richiesti,
                                              contatto, azione successiva)
20260726130100_07_appuntamenti.sql            appuntamenti; fine set by trigger;
                                              EXCLUDE gist no-overlap (23P01)
20260726130200_08_stato_derivato.sql          ricalcola_stato_lead() + triggers
20260726140000_10_lead_nexi.sql               lead_nexi 1:1 (§10, 12 tri-state fields)
20260726140100_04b_anagrafica_extra.sql       lead.email, lead.sito_web, sedi.nome
20260726150000_12_offerte.sql                 offerte (per brand) + lead.offerta_consigliata_id
20260726160000_11_import_dedup.sql            lead_simili() pg_trgm fuzzy dedup RPC
20260726170000_13_liste_salvate.sql           liste_salvate (filtri + colonne export)
20260726180000_14_push.sql                    push_subscriptions + appuntamenti.promemoria_inviato_at
20260726190000_15_cron_notifiche.sql          invia_notifiche() + 3 pg_cron jobs
```

Note the filenames are **not** in numeric order (04b and 11 land after 12) — the
timestamp prefix is what governs. Don't "fix" this; the dev project has already
applied them in timestamp order.

### Spec reconciliation done on M2/M3

- **Planning bug FIXED (§6):** the excluded time bands (before 10:00 / 13:00–14:30
  / after 20:00) were *inverted* — they are now correctly excluded, and slot
  suggestions use the real "before & after an appointment in a **zona comoda**"
  algorithm (`slot.ts` `suggerisciSlot`, `suggerimenti.ts` `calcolaSuggerimenti`,
  wired into Registra lavorazione).
- **§4 gaps filled:** `lead.email`, `lead.sito_web`, `sedi.nome` added (mig 04b)
  and surfaced in the forms.

### Milestone detail worth knowing

**M6 (push/PWA).** `public/manifest.webmanifest`, icons in `public/icons/`
(**placeholder blue — replace with a real logo**), apple-touch meta in
`index.html`, push-only service worker `public/sw.js` (no offline cache),
registered in `main.tsx`. VAPID keys generated; public key in
`VITE_VAPID_PUBLIC_KEY`. `features/notifiche` handles subscribe/unsubscribe +
"Invia prova" (Config → Notifiche). Edge Function `supabase/functions/notifiche`
deployed with `--use-api` (no Docker); secrets set on Supabase. `invia_notifiche()`
reads the service_role key from **Supabase Vault** (seeded manually, deliberately
not in git) → pg_net → the function. 3 pg_cron jobs: 05:00 / 18:00 UTC
(= Rome 07:00 / 20:00 CEST) plus promemoria every 15 min.
*Verified:* function boots, test path returns `{inviate:0}`, all 3 batch types
return 200 via service_role, the full cron chain logged 200 in
`net._http_response`, and the cron guard 403s ordinary users.
*Not verified:* an actual push arriving on a phone.

**M7 (imports).** `features/import`: `excel.ts` maps the **real column headers**
of `lista crm_esiti luglio 2026.xlsx` (that file is in the repo), P.IVA exact
dedup with a `lead_simili` fuzzy fallback for rows without one, preview and a
per-duplicate merge choice (integra / sovrascrivi / lascia, §8). `mail.ts` was
built **blind from §8** — label synonyms plus P.IVA/CAP fallbacks.
*Verified:* the real 157-row file parses clean (all valid P.IVA/CAP); the fuzzy
RPC returned a 0.71 match via JWT.

**M8 (report/export).** `features/report`: §12 analytics in `aggregazioni.ts`
(pure + tested — funnel per brand, efficacia per fonte, conversione per zona,
concorrenti per zona), §13 combinable client-side filters, SheetJS export with a
column picker, saved lists (`liste_salvate`, upsert by name).

### Reusable patterns — copy these, don't invent new ones

- `src/types/db.ts` — `Riga<'t'>` / `Inserimento<'t'>` / `Aggiornamento<'t'>` / `Enum<'e'>`.
- Feature module shape: `api.ts` (throws; input types omit `owner_id`/`id`/
  timestamps, `owner_id` reattached from the session) + `queries.ts` (TanStack
  hooks + a `chiavi*` key factory + invalidation) + `components/`.
- Shared UI in `src/components/ui/`: `Bottone`, `Campo`/`Input`/`Select`/`Textarea`,
  `Scheda`, `Pillola`, `Stato` (Caricamento/Errore/Vuoto), `BannerModifiche`,
  `TriStato`.
- `src/lib/useBozza.ts` — draft-editing hook powering the "Modifiche non salvate"
  banner (dirty tracking + auto-resync on server change). Use it for every inline form.
- `src/lib/validazione.ts` — pure validators mirroring the DB CHECKs (tested).
- `src/lib/ricerche.ts` — §4 external-search URL builders (tested); return `null`
  when there is nothing to search, and the UI hides the button on `null`.
- `src/features/lead/pos.ts` — dichiarati-vs-censiti comparison (tested).
- `src/features/lead/offerta.ts` — target-band matching for offers (tested).
- `src/lib/errors.ts` — Italian error mapping; `23P01` → "Slot già occupato".
- `src/lib/sessione.ts` — `ownerId()`.
- `src/lib/media.ts` + `features/lead/useRegistratore.ts` — Storage upload /
  signed URL + MediaRecorder.
- Presentation maps centralised in `src/features/lead/brand.ts`
  (`BADGE_BRAND` / `BADGE_STATO`).
- `src/index.css` — §2 design tokens as semantic CSS variables: the five semantic
  tints, the 15/17/22px type scale, `danger-fill` isolated as the §2 exception
  (memo/photo buttons only), 44px touch targets, iOS safe-area padding.

---

## Next Steps

Ordered by value. Nothing here is blocked on the user except where marked.

### 1. Get eyes on it — highest value, blocked on the user

Nothing has ever been seen rendered. Before building more features:

- Open `gestionale-paco.vercel.app` on desktop, iPad, and iPhone; log in as
  `pacoatworkdecre@gmail.com`; walk lead → lavorazione → agenda → report.
- Specifically exercise the 2026-07-28 polish: tap a contact's green phone button
  on the **iPhone** and confirm both that it dials and that the automatic
  lavorazione appears; upload a PDF to an offer and reopen it from the lead.
- **Install to the iPhone Home Screen**, grant notifications, hit Config →
  Notifiche → "Invia prova", and confirm a push actually arrives. This is the one
  M6 claim that has never been proven.
- If the user connects `claude-in-chrome`, a future agent can do the desktop half
  of this without them.

### 2. Reconciliation polish — DONE 2026-07-28

All four items shipped. No migrations were needed — every column already existed.

- **Contatto green-phone button** (§4). `PannelloContatti.tsx` now renders a green
  `tel:` link per contact with a phone number; tapping it fires a quick
  lavorazione noted `Chiamato [nome] il [data] alle [ora]` via the previously
  unused `testoChiamataAutomatica`. It does **not** `preventDefault` — the dial
  must happen even if the write is slow or fails, so the failure path shows
  "Chiamata partita, ma la lavorazione non è stata salvata."
  The lavorazione carries `esito_id = NULL`; migration 08 handles that explicitly
  ("lavorazioni ma nessun esito → in_lavorazione"), which is the right outcome —
  he called them, so they are no longer `da_contattare`.
  *Brand:* `lavorazioni.brand` is NOT NULL, so the button needs one. It uses
  `lead_brand[0].brand`, the same arbitrary-but-consistent pick
  `PannelloLavorazioni` already makes for `brandIniziale`. With no brand on the
  lead the link still dials but writes nothing.
- **"POS dichiarati (a voce) / censiti" counter** (§4/§5) — `features/lead/pos.ts`
  (pure, tested) + `components/ContatorePos.tsx`. Shown in `PannelloSedi` and,
  with a live override, inside Registra lavorazione so the comparison tracks the
  number **being typed**.
  *Decision worth keeping:* dichiarati is the **most recent** non-null
  `pos_richiesti`, **not the sum**. Hearing "ho 3 POS" on two calls means 3, not
  6 — each declaration photographs the same estate. Also fixed on the way past:
  the form used to accept a negative or fractional POS count and let the
  `smallint >= 0` CHECK reject it server-side.
- **`lead.offerta_consigliata_id` picker** (§4) — in `AnagraficaScheda`, a select
  grouped "Adatte al target X" / "Fuori target" by `features/lead/offerta.ts`
  (pure, tested). Out-of-band offers are shown, not hidden: the target is a
  suggestion, not a constraint. An already-linked offer stays in the list even
  once archived, or archiving would erase the record of what was proposed (§9).
  *Landmine:* the target letters are revenue bands, not alphabetical —
  `ORDINE_TARGET = ['C','B','A','E']` (C < 40k annual, E > 140k, per migration
  03). Sorting them as strings gives the wrong interval.
- **Offerta PDF upload** (§9) — `EditorOfferte` uploads to `{owner}/offerte/` via
  the new `caricaPdfOfferta` in `lib/media.ts`; `caricaAllegato` was refactored
  onto a shared `carica(cartella, …)`. Only the **first** path segment matters to
  the storage policies (migration 09), so a non-lead folder is legal.
  `features/offerte/BottonePdfOfferta.tsx` does the signed-URL open, reused on
  both the config list and the lead scheda.
- **§4 "Verifica dati online"** — `lib/ricerche.ts` (pure, tested) builds Google
  and Facebook searches from the business name + comune, plus a quoted-P.IVA
  Google search next to the P.IVA field. Built from the **draft** values, not the
  saved ones: you search precisely in order to correct what is on screen.

**Still not verified in a browser** — like everything else here, these typecheck,
build, lint and have their pure logic under test, but no one has seen them
render. The phone button in particular wants a real iPhone: whether `tel:`
navigation lets the mutation complete is a device behaviour, not a code fact.

### 3. Dashboard §3 completeness — unblocked

`DashboardPage.tsx` currently renders 4 tiles (Da contattare, In lavorazione,
Vinti mese, Persi mese) plus today's appointments and a route map link. §3 also
asks for: a **Lead totali** tile, **per-fonte** tiles, a quick search, "accessi
rapidi", and tiles that are **clickable through to a filtered lead list**.

### 4. §15 iPad master-detail layout — unbuilt, never previously tracked

§15 wants: lead list permanently visible on the left with the detail on the right;
2-column field pairs where sensible; the 4 section buttons in a horizontal row
instead of a 2×2 grid; and **text never shrunk** to gain horizontal space —
density comes from more elements side by side, not smaller type.

Only 16 responsive utility classes exist across the whole codebase (a few
2-column field pairs in `AnagraficaScheda`, `PannelloNexi`,
`FormRegistraLavorazione`, `ReportPage`, `DashboardPage`, `EditorOfferte`,
`ImportMail`). `AppShell.tsx` has **no breakpoints at all** — there is no
master-detail split. This is a real unbuilt spec section.

### 5. Loose ends

- **Mail parser needs a real sample.** `features/import/mail.ts` was written blind
  from §8. Ask the user for one anonymised call-center email and tune the regexes
  against it. Until then treat it as unproven. *(Blocked on the user.)*
- **Replace the placeholder PWA icons** in `public/icons/` with a real logo.
- **Credentials are not in the repo.** `.env.local` carries only the URL, anon
  key and VAPID public key — there is no app-user password and no DB password, so
  a session that wants to redo the "verify through PostgREST with a real user
  JWT" check has to ask the user for them first. The 2026-07-28 polish was
  therefore verified against the schema (migrations + generated types) rather
  than by live insert.
- **Prove RLS behaviourally.** Structurally every table has RLS + an
  `owner_id = auth.uid()` policy, but a second user's JWT has never been used to
  confirm the block. Worth one psql/PostgREST session.
- **Create the prod Supabase project** before Paco relies on this for real data —
  dev is currently doubling as prod.
- **DST caveat** on the 07:00/20:00 cron jobs — they are pinned to UTC, so they
  drift an hour in winter. See the comment in migration 15.
- **Bundle is 1,047 kB (318 kB gzip), no code splitting.** It roughly doubled when
  SheetJS landed. The obvious fix is a dynamic `import()` of `xlsx` in the import
  and report features, which are the only consumers.

---

## What Worked

- **Interviewing before building.** The spec had four holes it didn't know about:
  lead status was never defined despite the dashboard counting it; "zona comoda"
  underpins all of Planning but was undefined; "Chiusi (mese)" silently merged won
  and lost; dedupe-by-P.IVA breaks on rows lacking one. All resolved up front.
- **RLS enabled inline per migration** via `applica_rls_owner(text)` rather than a
  single trailing RLS migration. Without a local stack every migration lands
  straight on a cloud project, and a table sitting unprotected even briefly is
  readable by anyone with the anon key — which ships in the JS bundle by design.
- **Writing the vocabulary tables out longhand.** The clever
  `LIKE ... INCLUDING ALL` approach does not copy foreign keys, so the brevity
  would have been an illusion and the FKs silently missing.
- **Verifying through PostgREST with a real user JWT**, not just psql as superuser.
  It exercises RLS, the `owner_id` trigger, and the embed syntax the app actually
  uses. This caught more than psql alone would have.
- **Pure logic in its own module, tested; React kept dumb.** `slot.ts`,
  `target.ts`, `excel.ts`, `mail.ts`, `aggregazioni.ts`, `validazione.ts`,
  `pos.ts`, `offerta.ts`, `ricerche.ts` are all pure and covered — which is why
  79 tests run in 230 ms and why the inverted §6 time-band bug was fixable in one
  place. Keep doing this: every §2 polish item above landed as a tested pure
  module plus a dumb component.
- **Deploying Edge Functions with `--use-api`** — works without Docker, which the
  user has rejected.

## What Didn't Work

- **`npm create vite@latest .`** in the project root — silently cancels because
  the directory isn't empty (the spec file was already there) and just prints
  "Operation cancelled". Scaffold elsewhere and `cp -R`.
- **First `npm run build` failed** with `MODULE_NOT_FOUND` on the rolldown native
  binding, because deps were installed over a copied-in `package.json`. Fixed with
  `rm -rf node_modules package-lock.json && npm install`.
- **`baseUrl` in tsconfig** — deprecated in TypeScript 6, errors the build.
  `paths` alone works and resolves relative to the tsconfig.
- **Exporting `accedi`/`esci` from `useSession.tsx`** — oxlint's
  `only-export-components` rule flags it and it breaks Fast Refresh. Non-component
  exports belong in the feature's `api.ts`.
- **Docker / local Supabase** — was in the original plan, then explicitly rejected
  by the user mid-build. Do not reintroduce it.
- **`claude-in-chrome`** — not set up in this environment. There is no way to
  visually verify UI unless the user connects it.
- **Deploying without the Vercel env vars** — the SPA white-screens with no useful
  error, because `src/lib/supabase.ts` throws at module load on missing env.
- **Building push first.** It was deliberately deferred to M6 because it notifies
  about appointments that didn't exist until M3. That ordering was correct.

---

## Schema landmines for future migrations

- **Appointment overlap**:
  `EXCLUDE USING gist (owner_id WITH =, tstzrange(inizio, fine, '[)') WITH &&) WHERE (stato <> 'annullato')`.
  `fine` must be a **physical column set by trigger** — a generated column will not
  compile, because `timestamptz + interval` is STABLE, not IMMUTABLE. Use half-open
  `[)` so back-to-back 10–11 / 11–12 is legal (that is exactly §6's
  before-and-after pattern). Cancelled must be excluded or a cancelled slot blocks
  rebooking forever.
- **§10 NEXI fields** live in a separate 1:1 `lead_nexi` table — not jsonb (12
  known typed fields needing CHECKs) and not columns on `lead` (the hot
  list/dashboard table, mostly NULL for Hera-only leads). Tri-state = `boolean NULL`.
- **Sedi max 4**: `slot smallint CHECK (1..4)` + `UNIQUE (lead_id, slot)`, assigned
  by a BEFORE INSERT trigger. A counting trigger is racy.
- **Time bands** (§6: before 10:00, 13:00–14:30, after 20:00) are wall-clock
  Europe/Rome. Store as `time`, always compare `inizio AT TIME ZONE 'Europe/Rome'`,
  never UTC.
- **Audio purge** must go pg_cron → pg_net → Edge Function → `storage.remove()`.
  Deleting `storage.objects` via SQL orphans the S3 object. Stamp
  `file_eliminato_at` even on a 404, or the row retries nightly forever.
- **Offerte** are soft-deleted (`stato='archiviata'`) once referenced by
  `lead.offerta_consigliata_id`, so "which offer was proposed" survives.
- **The service_role key lives in Supabase Vault**, seeded by hand and never
  committed. A fresh project needs it re-seeded or `invia_notifiche()` silently
  fails to authenticate against the Edge Function.

---

## Commands

```bash
npm run dev          # dev server (connects to the live dev project)
npm run build        # tsc -b && vite build
npm run lint         # oxlint
npm run test         # vitest run

supabase link --project-ref jhiopnnrhokabishwvxh
supabase db push                    # apply migrations to the linked project
supabase db reset --linked          # from-zero rebuild — DEV PROJECT ONLY, never prod
supabase gen types typescript --linked > src/types/database.ts
supabase functions deploy notifiche --use-api    # no Docker
```
