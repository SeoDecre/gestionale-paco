# AgentPro CRM — Handoff

Last updated: 2026-07-20 (end of milestone 1 scaffold)

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
```

### NOT verified — read this before trusting anything

**No SQL has ever been executed.** There is no local Postgres (no Docker), and no
cloud project exists yet. All 430 lines are proofread only. Expect real errors on
first push — extension availability, `auth.users` trigger permissions, and the
`applica_rls_owner` dynamic SQL are the likely first failures.

**The login page has never been rendered.** The Chrome extension is not connected
in this environment, so no browser could be driven. It typechecks and builds; it
has not been seen.

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

### Immediately once the dev project exists

1. `supabase link --project-ref <ref>` then `supabase db push` — push 00→16
   **incrementally**, not as one batch, since there's no local stack to catch
   errors first.
2. Create Paco's user; confirm the `auth.users` trigger fires and seeds all
   7 vocabularies + the 4 `parametri_target` rows.
3. Prove RLS actually blocks: query with a second user's JWT, expect zero rows.
4. `supabase gen types typescript --linked > src/types/database.ts` — the file
   is currently a hand-written **placeholder** and must be regenerated.
5. Log in through the real UI and confirm the login page renders on iPhone,
   iPad and desktop widths.

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
