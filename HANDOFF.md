# AgentPro CRM — Handoff

Last updated: 2026-07-26 (dev project live + Milestone 2 in progress)

---

## ⚠️ Missing spec — read first

The functional spec `AgentPro_Specifica_Sessionex sergio.md` (authoritative §1–§15)
is **no longer present in the repo** — only this handoff and `README.md` remain.
Milestone 2+ feature work is therefore built to the **settled decisions in this
handoff** plus sensible defaults, with every non-obvious modelling choice marked
`ASSUNZIONE:` in code comments and listed under "Assumptions" below. If the spec
resurfaces, reconcile those assumptions against it.

---

## Goal

Build a management/CRM web app for **Paco**, a field sales agent selling for two
brands: **NEXI** (payment terminals) and **Hera Comm** (energy).

The functional requirements live in `AgentPro_Specifica_Sessionex sergio.md`
(Italian) in this repo. **Sections §1–§15 of that spec are authoritative.**
**§0 (stack) and §16 (build order) are obsolete** — see below.

He works from an iPhone in the field, an iPad/desktop at base. The app must be
installable to the iOS Home Screen (required for web push).

Full plan document: `~/.claude/plans/lovely-orbiting-river.md` (outside the repo —
read it if available, but this handoff is self-contained).

---

## Decisions already settled — do NOT re-litigate

These came out of a long structured interview with the user. Each was chosen
deliberately over stated alternatives.

**Stack** — Vite + React 19 + TypeScript (static SPA), Tailwind v4, TanStack
Query, React Router, supabase-js. Supabase for Postgres/Auth/Storage/Edge
Functions/pg_cron. Deploy to Vercel.

> The spec §0 describes Next.js + Prisma + Vercel Postgres + Vercel Blob + a
> shared-password cookie, and references an old repo `pacosoftdecre/agentpro-web`
> with "Fase 0/1" code. **All of that is discarded.** This build is greenfield.

**No Docker** — the user explicitly rejected it. There is *no* local Supabase
stack. Development runs against a **cloud Supabase "dev" project**; a separate
**"prod"** project is created before milestone 6. The two stay in sync only via
the committed migration files.

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
`da_contattare | in_lavorazione | chiuso_vinto | chiuso_perso`.
Won/lost are split because §3's "Chiusi (mese)" tile would otherwise sum signed
contracts with rejections.

**Status is held per (lead, brand)**, not per lead. §1 lets one lead carry both
brands, so a lead can be closed for NEXI and still open for Hera. This is the
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
for planning suggestions = **same zone only**; write the comfort check as a
predicate so adjacency can later be added as data, not a rewrite.

**Media** — in-app MediaRecorder → private Supabase Storage bucket + signed URLs.
Audio rows have `stato` + `integrato_at`. A nightly job deletes the **file** 48h
after `integrato_at` but **keeps the row** as a tombstone (`file_eliminato_at`).

**Imports** — client-side Excel parsing (SheetJS). Dedupe by exact P.IVA, falling
through to `pg_trgm` fuzzy match on nome+CAP. Call-center mail parsed by
deterministic regex. Lavorazioni/appuntamenti/contatti are **never** touched by
an import.

**Push** — in scope, but built at **milestone 6, not first**. It notifies about
appointments that don't exist until milestone 3.

**Testing** — Vitest on logic only (target banding, slot suggestion + overlap,
merge modes, mail parser). No component/E2E tests.

---

## Current Progress

### Done and verified

- Vite + React 19 + TS scaffold, Tailwind v4, TanStack Query, React Router,
  `@/*` path alias
- `src/index.css` — §2 design tokens as semantic CSS variables: the five
  semantic tints, the 15/17/22px type scale, `danger-fill` isolated as the §2
  exception (memo/photo buttons only), 44px touch targets, iOS safe-area padding
- `src/lib/` — supabase client, query client, **Italian error mapping with
  `23P01` → "Slot già occupato" already wired**, it-IT date/currency formatting,
  Apple/Google Maps deep links
- `src/features/auth/` — SessionProvider, `RequireAuth` (with a loading gate so
  a page reload doesn't bounce to login), LoginPage, `api.ts`
- Migrations 00–03 + 16 (430 lines of SQL, see below)

Verification actually run: `tsc -b` clean, `npm run build` succeeds,
`oxlint` clean, dev server boots and serves transformed modules.

### Migrations written

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
20260726130100_07_appuntamenti.sql             appuntamenti; fine set by trigger;
                                              EXCLUDE gist no-overlap (23P01)
20260726130200_08_stato_derivato.sql           ricalcola_stato_lead() + triggers
                                              on lavorazioni & esiti flag changes
20260726140000_10_lead_nexi.sql               lead_nexi 1:1 (§10, 12 tri-state fields)
20260726140100_04b_anagrafica_extra.sql        lead.email, lead.sito_web, sedi.nome
20260726150000_12_offerte.sql                 offerte (per brand) + lead.offerta_consigliata_id
20260726160000_11_import_dedup.sql            lead_simili() pg_trgm fuzzy dedup RPC
20260726170000_13_liste_salvate.sql           liste_salvate (filtri + colonne export)
20260726180000_14_push.sql                    push_subscriptions + appuntamenti.promemoria_inviato_at
20260726190000_15_cron_notifiche.sql          invia_notifiche() + 3 pg_cron jobs
```

### Milestone 6 — DONE server-side; needs on-device test (2026-07-26)

PWA: `public/manifest.webmanifest`, icons (`public/icons/`, placeholder blue —
replace with real logo), apple-touch meta in `index.html`, push-only SW
(`public/sw.js`, no offline cache), registered in `main.tsx`.

Push: VAPID keys generated; **public key in `VITE_VAPID_PUBLIC_KEY`** (in
`.env.local` — **must also be added to Vercel** or subscribe fails on prod).
`features/notifiche` (subscribe/unsubscribe + "Invia prova", in Config →
Notifiche). Edge Function `supabase/functions/notifiche` (deployed, `--use-api`,
no Docker) sends via web-push crypto + fetch; secrets set on Supabase (VAPID_*).
`invia_notifiche()` helper reads service_role key from **Vault** (seeded manually,
not in git) → pg_net → function; 3 cron jobs (05:00/18:00 UTC = Rome 07/20 CEST;
promemoria */15).

Verified: function boots + test path `{inviate:0}`; all 3 batch types 200 via
service_role; full cron chain logged 200 in `net._http_response`; cron-guard 403s
users. **NOT verified:** real push delivery — needs the app installed to an iPhone
Home Screen + notifications granted. DST caveat on the 07:00/20:00 jobs (see mig 15).

### Milestone 8 — DONE (2026-07-26)

`features/report`: `/report` page. §12 analytics (`aggregazioni.ts` pure + tested:
funnel per brand, efficacia per fonte, conversione per zona, concorrenti per
zona). §13 combinable filters (zona/target/brand/stato/fonte/concorrente, client-
side), Excel export (SheetJS `export.ts`) with a column picker, and saved lists
(migration 13, `liste_salvate`, upsert by name — filtri+colonne reusable).
52 tests. Verified via API (saved-list upsert, report embed).

### Milestone 7 — DONE (2026-07-26)

SheetJS (`xlsx` 0.18.5) added. `features/import`: Excel importer (`excel.ts` pure
mapping to the REAL column headers of `lista crm_esiti`, tested; `leggiXlsx` via
SheetJS) with P.IVA exact dedup + `lead_simili` fuzzy fallback for rows without
P.IVA, preview + per-duplicate merge choice (integra/sovrascrivi/lascia, §8).
Call-center mail parser (`mail.ts`, built BLIND from §8 — label synonyms + P.IVA/
CAP fallbacks, tested; **needs tuning against a real email**). `/importa` route,
"Importa" nav. Verified: real 157-row file parses clean (all valid P.IVA/CAP);
fuzzy RPC returns 0.71 match via JWT. Imports never touch existing
lavorazioni/appuntamenti/contatti (§8). 48 tests.

### Milestone 4 — DONE (2026-07-26)

Migration 12 pushed. `features/configurazione` (`/configurazione` route, "Config"
nav): Offerte CRUD (archive-not-delete when proposed), Parametri target editor,
Zone + CAP mapping, vocab editors (generic `EditorVocabolario` + specialized
`EditorEsiti` for the is_chiusura/esito_positivo constraint). Vocab write API is
in `features/vocabolari` (dynamic-table CRUD via casts); offerte in
`features/offerte`. Verified via API (offerta+archive, vocab voce, target bands).
Deploy is LIVE on Vercel (env vars set; app on master).

**Reconciliation still pending:** contatto green-phone→auto-lavorazione;
POS dichiarati/censiti counter; dashboard §3 completeness (Lead totali/per-fonte/
search/quick-actions); lead "offerta consigliata" picker (offerte read path ready);
offerte PDF upload (field exists, no UI yet).

### Milestone 2 — DONE and verified (2026-07-26)

Schema pushed clean; triggers/constraints functionally tested via `psql`
(zona-derivation, slot 1-4 + max-4 raise, single-principale, piva check) and the
whole path tested via **PostgREST with a real user JWT** (insert without owner_id
→ trigger fills it, CAP → zona auto-derived, embedded reads, RLS scoping).
`npm run build` + `oxlint` clean, 18 Vitest logic tests pass. **Not** visually
rendered (no browser here).

**Reusable patterns established (copy these for Milestones 3+):**
- `src/types/db.ts` — `Riga<'t'>` / `Inserimento<'t'>` / `Aggiornamento<'t'>` / `Enum<'e'>`.
- Feature module shape: `api.ts` (throws; input types omit owner_id/id/timestamps,
  owner_id reattached from session) + `queries.ts` (TanStack hooks + a `chiavi*`
  key factory + invalidation) + `components/`.
- Shared UI in `src/components/ui/`: `Bottone`, `Campo`/`Input`/`Select`/`Textarea`,
  `Scheda`, `Pillola`, `Stato` (Caricamento/Errore/Vuoto), `BannerModifiche`.
- `src/lib/useBozza.ts` — draft-editing hook powering the "Modifiche non salvate"
  banner (dirty tracking + auto-resync on server change), reuse for all inline forms.
- `src/lib/validazione.ts` — pure validators mirroring DB CHECKs (tested).
- `src/lib/media.ts` + `useRegistratore.ts` — Storage upload/signed-URL + MediaRecorder.
- Presentation maps centralised: `src/features/lead/brand.ts` (BADGE_BRAND/STATO).

### Milestone 3 — DONE and verified (2026-07-26)

Migrations 06/07/08 pushed clean. Verified via `psql` (per-brand independent
status: NEXI=chiuso_vinto while HERA=chiuso_perso; latest-esito-wins; back-to-back
appts legal; overlap → 23P01; cancel frees slot) and via PostgREST with a real
JWT (register lavorazione → derived status + auto-badge; appt `fine` from trigger;
overlap rejected 23P01). `build`/`lint` clean, 28 Vitest tests pass. Not visually
rendered.

Shipped: `features/lavorazioni` (registra lavorazione + optional appt in one
action, with slot-conflict rollback; history panel on lead detail),
`features/planning` (agenda day view, `slot.ts` pure slot-suggestion/overlap/zona-
comoda logic — tested, `giorni.ts` day-range helpers), real `features/dashboard`
(§3 tiles + today's appts + route map link). New routes `/agenda`; nav updated.
Shared `src/lib/sessione.ts` (`ownerId()`) extracted and reused.

### Spec recovered + Milestone 5 — DONE (2026-07-26)

The authoritative spec `AgentPro_Specifica_Sessionex sergio.md` is back in the
repo. Reconciled M2/M3 against it:
- **Planning bug FIXED (§6):** the excluded bands (before 10:00 / 13:00–14:30 /
  after 20:00) were inverted — they're now correctly excluded, and slot
  suggestions use the real "before & after an appointment in a **zona comoda**"
  algorithm (`slot.ts` `suggerisciSlot`, `suggerimenti.ts` `calcolaSuggerimenti`,
  wired into Registra lavorazione). 33 tests.
- **§4 gaps filled:** `lead.email`, `lead.sito_web`, `sedi.nome` added (04b) and
  surfaced in the forms.
- **M5 (NEXI §10) built:** `lead_nexi` 1:1 table, `features/nexi` (tri-state
  `TriStato` toggles, conditional Amex/DCC fields, unsaved banner), shown on the
  lead only when brands include NEXI. Verified via API (tri-state true/false/null
  round-trips).

### Still TODO (reconciliation polish, not yet built)
- Contatto **green phone button** → tel: + auto-lavorazione "Chiamato X il … alle …"
  (`testoChiamataAutomatica` helper already exists in lib/format.ts).
- **"POS dichiarati (a voce) / censiti"** counter (§4/§5): compare
  `lavorazioni.pos_richiesti` vs `sedi_pos` count.
- Dashboard completeness (§3): **Lead totali** tile, **per-fonte** tiles, quick
  search, "accessi rapidi"; tiles clickable → filtered lead list.
- §4 "Verifica dati online" Google/Facebook buttons; P.IVA Google-search button.

### Next milestones
- **M4 (Configurazione)** — vocab editors (write side; read paths exist in
  `features/vocabolari`), parametri_target editor, zone + zone_cap UI, offerte CRUD
  (+ add `lead.offerta_consigliata_id` then). Fully unblocked.
- **M7 (Imports)** — Excel `lista crm_esiti luglio 2026.xlsx` is now in the repo.
  Still needs a sample call-center email for the second parser.
- **M8 (Report/Export)**; **M6 (Push/PWA)** still blocked on a live HTTPS domain.

### Dev project — LIVE and verified (2026-07-26)

- Supabase dev project **`jhiopnnrhokabishwvxh`** (West Europe / London), created
  and linked. Pooler host for `psql`: `aws-1-eu-west-2.pooler.supabase.com:6543`,
  user `postgres.jhiopnnrhokabishwvxh`.
- Migrations 00–03 + 16 **pushed clean on first try** — no extension/trigger/RLS
  errors. Confirmed via `psql`: 4 extensions, 10 enums, 10 tables all with RLS +
  a policy, 7 functions.
- First user created: **`pacoatworkdecre@gmail.com`** (email pre-confirmed). The
  `auth.users` seed trigger fired correctly — 7 vocabularies + `parametri_app` +
  4 `parametri_target` bands, all under one `owner_id`.
- `.env.local` filled with real URL + anon key. `src/types/database.ts`
  regenerated from the live schema (503 lines). `npm run build` passes.

**Still NOT visually verified:** no browser was driven (Chrome extension not
connected here). UI typechecks and builds; it has not been seen rendered.

---

## What Worked

- **Interviewing before building.** The spec had four holes it didn't know about:
  lead status was never defined despite the dashboard counting it; "zona comoda"
  underpins all of Planning but was undefined; "Chiusi (mese)" silently merged
  won and lost; dedupe-by-P.IVA breaks on rows lacking one. All resolved up front.
- **Scaffolding into a temp dir, then copying in.** `npm create vite` refuses to
  run in a non-empty directory (the spec file was already there) and just prints
  "Operation cancelled".
- **RLS enabled inline per migration** via the `applica_rls_owner(text)` helper,
  rather than a single trailing `13_rls.sql` as originally planned. Without a
  local stack every migration lands straight on a cloud project, and a table
  sitting unprotected even briefly is readable by anyone with the anon key —
  which ships in the JS bundle by design.
- **Writing the vocabulary tables out longhand.** The clever
  `LIKE ... INCLUDING ALL` approach does not copy foreign keys, so the brevity
  would have been an illusion and the FKs would have been silently missing.

## What Didn't Work

- **`npm create vite@latest .`** in the project root — silently cancels because
  the directory isn't empty. Scaffold elsewhere and `cp -R`.
- **First `npm run build` failed** with `MODULE_NOT_FOUND` on the rolldown native
  binding, because deps were installed over a copied-in `package.json`. Fixed by
  `rm -rf node_modules package-lock.json && npm install`. If you copy a scaffold
  again, reinstall cleanly.
- **`baseUrl` in tsconfig** — deprecated in TypeScript 6, errors the build.
  `paths` alone works and resolves relative to the tsconfig.
- **Exporting `accedi`/`esci` from `useSession.tsx`** — oxlint's
  `only-export-components` rule flags it and it breaks Fast Refresh. Non-component
  exports belong in the feature's `api.ts`.
- **Docker / local Supabase** — was in the original plan, then explicitly
  rejected by the user mid-build. Do not reintroduce it.
- **`claude-in-chrome`** — extension not set up in this environment. There is no
  way to visually verify UI here unless the user connects it.

---

## Next Steps

### Blocked on the user — nothing DB-side can proceed without this

1. **Create a Supabase dev project** at supabase.com. Need: project ref, URL,
   anon key, DB password. `.env.local` exists but holds *placeholders* so the
   dev server can boot — it must be filled with real values.
2. **Excel + call-center mail samples** (anonymised) must be dropped in the repo
   before milestone 7. Both parsers are pure guesswork without them.
3. **Vercel project with HTTPS** before milestone 6 — PWA install and web push
   both refuse to work without it. Paco must install the app to his Home Screen.

### Immediately once the dev project exists — DONE 2026-07-26

1. ~~Link + push migrations~~ ✅ 00→16 pushed clean.
2. ~~Create Paco's user + confirm seed~~ ✅ seed fired, all rows present.
3. Prove RLS blocks with a second user's JWT — **still TODO** (structurally
   verified: every table has RLS enabled + an `owner_id = auth.uid()` policy;
   behavioural test with a signed anon JWT not yet run).
4. ~~Regenerate types~~ ✅ `src/types/database.ts` regenerated.
5. Log in through the real UI on iPhone/iPad/desktop — **still TODO** (no browser
   here). `npm run dev` connects to the live project.

### Assumptions made without the spec (reconcile if it resurfaces)

- **`lead_brand` is an explicit per-lead set of brand rows** the user manages via
  the testata badges; `stato` defaults `da_contattare` and is later recomputed by
  the migration-08 trigger. (The spec may instead derive the brand set from the
  existence of a lavorazione per brand.)
- Field lists for `lead`, `contatti`, `sedi`, `sedi_pos` are the handoff's named
  columns plus the obvious anagrafica fields; exact labels/optionality are guesses.
- `lead.offerta_consigliata_id` is deferred to Milestone 4 (offerte table) to
  avoid a forward FK dependency; added by a later migration.

### Then — milestone order

2. **Lead** — migrations 04–05, 09, 12; list + detail, inline-editable anagrafica
   with the §2 "Modifiche non salvate" banner, testata badges, Maps link,
   Contatti (provenienza + Principale + call→auto-lavorazione), Sedi + POS
   census, red memo/photo shortcuts with MediaRecorder → Storage
3. **Lavorazioni + Planning + Dashboard** — migrations 06–08; Registra
   lavorazione saving lavorazione + appointment in one tap; planning with
   overlap 409 + same-zone slot suggestions; dashboard §3 incl. daily map
4. **Configurazione azienda** — offerte CRUD, parametri target, 7 vocabulary
   editors, zone + CAP mapping
5. **NEXI sections** — migration 10, §10 forms shown only when brand includes NEXI
6. **Push + PWA** — manifest, `sw.ts` (push only, no offline cache), VAPID,
   Edge Functions + cron. Needs the live HTTPS domain.
7. **Imports** — migration 11. Needs the user's samples.
8. **Report + Export** — §12 macro areas, §13 saved filter lists

### Schema landmines for later migrations

- **Appointment overlap**: `EXCLUDE USING gist (owner_id WITH =, tstzrange(inizio, fine, '[)') WITH &&) WHERE (stato <> 'annullato')`.
  `fine` must be a **physical column set by trigger** — a generated column will
  not compile, because `timestamptz + interval` is STABLE, not IMMUTABLE.
  Use half-open `[)` so back-to-back 10–11 / 11–12 is legal (that is exactly §6's
  before-and-after pattern). Cancelled must be excluded or a cancelled slot blocks
  rebooking forever.
- **§10 NEXI fields** go in a separate 1:1 `lead_nexi` table — not jsonb (12 known
  typed fields needing CHECKs) and not columns on `lead` (the hot list/dashboard
  table, mostly NULL for Hera-only leads). Tri-state = `boolean NULL`.
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

### Known minor debt

- Bundle is 520 kB (152 kB gzip) with no code splitting. Fine for now; revisit
  if it grows.
- `src/features/dashboard/DashboardPage.tsx` is a placeholder showing sample
  pillole. Replaced wholesale in milestone 3.
- Nothing is committed to git yet — `git init` has been run, but there are no
  commits. The user has not asked for one.

---

## Commands

```bash
npm run dev          # dev server
npm run build        # tsc -b && vite build
npm run lint         # oxlint

supabase link --project-ref <ref>
supabase db push                    # apply migrations to linked project
supabase db reset --linked          # from-zero rebuild — DEV PROJECT ONLY, never prod
supabase gen types typescript --linked > src/types/database.ts
```
