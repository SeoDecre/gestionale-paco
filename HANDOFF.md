# AgentPro CRM — Handoff

Last updated: 2026-07-29 — all 8 milestones, the §4/§5 polish, **and the port of
the legacy CRM 3.0 feature set**. Migrations 17–25 are **applied** and types
regenerated. Remaining: run the data migration, real-device verification.

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

> **Superseded 2026-07-29.** The configurator was built after all, because the
> CRM 3.0 had it (`campi_config`) and the user asked for the whole 3.0 feature
> set. It is now the way to add Hera-specific questions without a migration.
> The rest of this decision stands.

**Testing** — Vitest on logic only (target banding, slot suggestion + overlap,
merge modes, mail parser, report aggregations). No component/E2E tests.

---

## Current Progress

**Everything below is committed and pushed to `origin/master`** (last commit
`52ae229`, working tree clean). Migrations 00–25 are all applied to the dev
project. **Whether the Vercel deploy landed is unverified** — see Next Steps §0.

### Verification run at handoff time

```
npm run build   ✓  (tsc -b + vite build clean; 1,125 kB / 338 kB gzip)
npm run test    ✓  141 tests, 14 files, all pass
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

### Port of the legacy CRM 3.0 (2026-07-29)

The user supplied `AgentPro_CRM_3.0 copia/` — the Express + SQLite + single-file
React app Paco used before this build — and asked for **all** of its features to
be carried over. It is a 2,610-line server, a 1,613-line SPA and a 184 KB SQLite
database with **real data** (160 leads).

That folder is **gitignored**: it is a reference, not part of this build.

**Ported:**

| Legacy | Here |
|---|---|
| `agente` + `mandati` | `profilo_agente` + `mandati`, Config → Agente & Mandati |
| ~30-question NEXI interview | `lead_nexi` extended, 6-tab `PannelloNexi` |
| `verify_state` + colours | `stati_verifica` vocabulary, `SelettoreVerifica` |
| `opzioni_custom` colours | `colore_bg/fg/dot` on every vocabulary |
| `aree_custom` (by comune) | `zone_comune`; CAP wins, comune is the fallback |
| `indirizzi` (principale, consegna POS) | `sedi.principale` / `sedi.consegna_pos` |
| `pos_richiesti` | `sedi_pos` + quantita / esigenza / differenzia / amex |
| offer catalogue + matching engine | `offerte` extended, `ordinaPerTransato` |
| `campi_config` / `campi_valori` | same, + editor and per-lead panel |
| weekly planning grid | `SettimanaPage` |
| .ics / Google Cal / mail / WA / TG | `lib/condivisione.ts` (pure, tested) |
| backup / restore | `features/backup` |
| paste-an-address + Photon autocomplete | `lib/indirizzo.ts` + `RiconosciIndirizzo` |
| sortable, filtered lead table | `LeadListPage` + `filtri.ts` (pure, tested) |
| dashboard KPI + clickable tiles | `DashboardPage` |
| Aree panel | `AreePage` |

**Deliberately NOT ported, with the reason:**

- **Field Report** — the offline HTML export, worked on an iPad, then re-imported
  as a JSON of the day's updates. It existed because the 3.0 server was LAN-only
  and the iPad could not reach it. This build is a cloud PWA reachable from any
  device with a connection, so the export/re-import shuttle has no job to do, and
  keeping it would mean maintaining a second divergent copy of every form.
  *If Paco really does work with no signal*, the right answer is offline-first
  caching in the PWA, not the file shuttle. Not built — flagged as a decision,
  not an oversight.
- **Server-side PDF (pdfmake)** — replaced by the browser's print-to-PDF. pdfmake
  is ~1 MB on a bundle already over 1 MB, for a worse result than the OS gives.
- **Auto-extraction from the uploaded PDF (`pdf-parse`)** — the extraction
  *logic* is ported and tested (`offerte/estrazione.ts`); it runs on text pasted
  from the PDF. Reading the PDF in-browser needs `pdfjs-dist` (~300 KB); worth a
  dynamic import later if pasting proves annoying.
- **The 7 hand-set lead states** (Da contattare / Chiamato / Appuntamento /
  Chiuso / Perso / Richiamare / non più attiva). This build **derives** 4 states
  from lavorazioni, and that was a deliberate interviewed decision: hand-set
  states drift out of sync with the work log. The legacy value is preserved in
  the lead's note by the migration script, so nothing is lost.
- **Generic multi-company configurator was previously rejected (§14)** but is
  now built (`campi_config`), because the 3.0 had it and the user asked for
  everything. Noted here so the contradiction is visible rather than silent.

### Migrating the real data — NOT YET RUN

`AgentPro_CRM_3.0 copia/data/crm.db` holds **160 leads**, 11 lavorazioni,
9 appuntamenti, 8 contatti, 9 aree, 2 mandati and 1 agent profile.

**The project already holds 157 of those leads** — a previous session imported
the same Excel. All 157 legacy P.IVAs are already in the DB and none are
DB-only, so a naive migration would mint fresh UUIDs, collide with the
`lead_piva_uk` unique index on `(owner_id, piva)` and fail the whole batch.

The script therefore takes a P.IVA → existing-id map and **reuses the existing
id**, turning the restore into an in-place update. It also omits null keys, so
it merges rather than blanking fields the 3.0 never knew about.

```bash
# 1. current ids, straight from the project
curl -s -X POST "https://api.supabase.com/v1/projects/jhiopnnrhokabishwvxh/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{"query":"select id, piva from public.lead where piva is not null"}' > esistenti.json

# 2. convert
python3 scripts/migra-crm3.py "AgentPro_CRM_3.0 copia/data/crm.db" \
  --mappa-esistenti esistenti.json > migrazione.json

# 3. in the app: Configurazione → Backup → Scegli file .json → Ripristina
```

Verified on the real data: 160 leads out, 157 updating existing rows, 3 new,
zero duplicate ids, zero duplicate P.IVAs. **Not yet run** — the restore is the
user's call.

Without the map it emits the same backup format, so the restore goes through RLS with the
real user's JWT — no service key in a script — and the JSON can be inspected
before it touches anything. Ids are `uuid5` of the legacy id, so re-running
updates instead of duplicating. Verified to convert cleanly: 160/160 leads.

Stated losses (all in the script header): `lavorazioni.esito_id` and contact
roles stay NULL, because those are per-user vocabularies with generated ids and
guessing the mapping would invent data — the legacy text is preserved in the
notes instead. Attachments are files on disk, not rows, so they do not migrate.

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
| — | **Porting CRM 3.0** (2026-07-29) | code done; migrations applied; **data migration not run**, **never seen rendered** |

### Routes shipped (`src/router.tsx`)

`/login` · `/` dashboard · `/agenda` · `/agenda/settimana` · `/lead` · `/lead/:id` ·
`/aree` · `/configurazione` · `/importa` · `/report`

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

--- porting CRM 3.0, applicate il 2026-07-29 ---
20260729090000_17_agente_mandati.sql          profilo_agente (PK = owner_id) + mandati
                                              per brand + seed_agente_mandati()
20260729090100_18_verifica_e_colori.sql       stati_verifica, esigenze_pos,
                                              lead_esigenze, lead.verifica_id,
                                              colore_bg/fg/dot sui vocabolari
20260729090200_19_zone_comune.sql             zone_comune + tg_lead_deriva_zona
                                              riscritto (CAP vince, comune ripiego)
20260729090300_20_sedi_pos_estesi.sql         sedi.principale/consegna_pos (+ trigger
                                              prima-sede-principale), sedi_pos.quantita/
                                              esigenza_id/differenzia_pagamenti/amex
20260729090400_21_offerte_estese.sql          categoria, transato_min/max, commissione,
                                              target_cliente, testo_estratto, versione
20260729090500_22_lead_nexi_intervista.sql    ~14 colonne nuove + 2 jsonb
                                              (commissioni_dettaglio, modalita_attuali)
20260729090600_23_lead_campi_legacy.sql       telefono, cellulare, pec, mcc, psp_attuale,
                                              orari, forma_giuridica, n_punti_vendita,
                                              proposta_offerta, import_sessione
20260729090700_24_campi_personalizzati.sql    tipo_campo enum + campi_config/campi_valori
20260729090800_25_seed_nuovo_utente.sql       aggancia i nuovi seed a auth.users
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
- `src/features/lead/filtri.ts` — lead-list filtering + sorting (tested). Note the
  rule: a stato matches if **any** brand is in it; stato+brand together must look
  at the *same* brand.
- `src/lib/condivisione.ts` — .ics / Google Calendar / mailto / WhatsApp /
  Telegram / signature block (tested).
- `src/lib/indirizzo.ts` — paste-an-address parser + Photon/OSM lookup (tested).
- `src/features/offerte/estrazione.ts` — pull canone/commissione/transato out of
  offer text, and `ordinaPerTransato` (the matching engine) (tested).
- `src/features/report/testoReport.ts` — report as shareable text (tested).
- `src/lib/scarica.ts` — blob download with object-URL revoke; `apriEsterno`.
- New shared UI: `BarraSchede`/`Gruppo` (scrollable tabs), `PilloleMultiple`,
  `PillolaColorata` (vocabulary colours with semantic fallback),
  `RiconosciIndirizzo`.
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

Ordered by value. The first two are the only things standing between this build
and being usable with real data.

### 0. Verify the Vercel deploy — status genuinely unknown

What is certain: `master` is on GitHub (`fca5561`), and for several minutes
after the push the site was still serving the **pre-session** bundle.

```
atteso (build locale) : index-B9VPjwG_.js
servito allora        : index-Dj_X6QVd.js   <- pre-sessione
```

What is **not** certain: whether it has landed since. Repeated `curl` polling of
`gestionale-paco.vercel.app` tripped Vercel's bot protection, and the site now
answers **HTTP 403 "Vercel Security Checkpoint"** to scripted requests. That is
an artefact of the polling, not a fault of the app — a real browser is very
likely fine.

**Do not poll the deployed URL in a loop from an agent.** It triggers the
checkpoint and then nobody can read the served bundle at all. Check once, or
check `vercel.com → gestionale-paco → Deployments`.

If the deploy really did fail, the first suspects are the env vars
(`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` / `VITE_VAPID_PUBLIC_KEY` — the
SPA throws at module load without the first two) or a disconnected Git
integration. `npm run build` is clean locally, so it is not the code.

### 1. Import the legacy data — file is already generated

`migrazione.json` sits in the project root (116 KB, **gitignored**, contains
customer PII). It was produced with the P.IVA map already applied.

In the app: **Configurazione → Backup → Scegli file .json → Ripristina**.

Expect: 157 leads *updated in place*, 3 new, plus 9 zone / 26 comuni / 2 mandati
/ 1 profilo agente / 2 contatti / 11 lavorazioni / 9 appuntamenti.

This needs a browser session — no agent has an app-user JWT (see Credentials
below). To regenerate the file, see "Migrating the real data" above.

### 2. Get eyes on it — still the largest gap, and it grew

Nothing in this app has **ever** been seen rendered, and this session rewrote
every main screen (shell, lead list, dashboard, NEXI panel, sedi, planning).
The risk is now higher than it was, not lower.

Walk on a real iPhone: lead list → open a lead → Registra lavorazione → Agenda →
Settimana → Report. Specifically worth looking at, because they are new and
unproven:

- the bottom tab bar — thumb reach and 44px targets;
- the six NEXI tabs (they scroll horizontally);
- the green phone button on a contact: does it dial **and** log the lavorazione?
  Whether `tel:` navigation lets the mutation finish is a device behaviour, not
  a code fact;
- `RiconosciIndirizzo`: paste `VIA ROMA 31 - 57016 - ROSIGNANO (LI)`;
- the week grid on a phone (7 columns become stacked sections).

If the user connects `claude-in-chrome`, an agent can do the desktop half alone.

### 3. Prove a push actually arrives

The one M6 claim never demonstrated. iPhone → Share → Add to Home Screen → open
from the icon → allow notifications → Config → Notifiche → "Invia prova".
Everything server-side is verified (function boots, cron chain logged 200); only
delivery to a handset is unproven.

### 4. Rotate the Supabase access token

`sbp_2471904a…` was pasted into a chat transcript on 2026-07-29. Dashboard →
Account → Access Tokens → revoke + regenerate. The Keychain copy the CLI uses
keeps working independently, so nothing breaks locally.

### 5. Spec sections: where they now stand

- **§3 dashboard — DONE.** 3 KPI (tasso di chiusura calcolato sui *contattati*,
  lavorazioni 7gg/mese, media per lead) + 8 tiles that link through to the lead
  list already filtered via querystring.
- **§15 iPad — PARTLY done.** The app is now genuinely responsive (bottom tabs on
  phone, fixed sidebar from `lg`, table→cards, 7-col week grid→stacked). What is
  still **not** built is the true master-detail split: lead list permanently on
  the left with the detail on the right. `AppShell` has breakpoints now, but the
  lead list and lead detail are still separate routes. Doing it properly means
  making `/lead` render an optional detail pane instead of navigating away.
- **Bundle is 1,125 kB (338 kB gzip), no code splitting.** SheetJS is the bulk.
  The fix is a dynamic `import()` of `xlsx` in the import and report features,
  which are its only consumers. Deferred deliberately — worth doing before
  adding anything else heavy (e.g. `pdfjs-dist`).

### 6. Loose ends

- **Mail parser needs a real sample.** `features/import/mail.ts` was written blind
  from §8. Ask the user for one anonymised call-center email and tune the regexes
  against it. Until then treat it as unproven. *(Blocked on the user.)*
- **Replace the placeholder PWA icons** in `public/icons/` with a real logo.
- **Credentials.** `.env.local` carries only the URL, anon key and VAPID public
  key. There is still no app-user password, so "verify through PostgREST with a
  real user JWT" needs asking the user.
  The **Supabase access token** belongs to the `pacosoftdecre` account (org
  `qqtdxpclixznwithghnm`), NOT to `SeoDecre` — logging in as the wrong one makes
  `db push` and `gen types` fail with a management-API 403 that looks like a
  broken project but isn't. It is now stored in the macOS Keychain via
  `supabase login --token`, so the CLI works out of the box.
  For read-only schema checks the Management API works well:
  `POST https://api.supabase.com/v1/projects/<ref>/database/query` with
  `{"query": "..."}` and the token as Bearer.
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

- **Hand-writing the generated types, then proving it by regeneration.** With no
  DB access, `src/types/database.ts` was patched by script to match the new
  migrations so the app could keep compiling. When access finally arrived and
  `supabase gen types` overwrote the file, `tsc -b` passed **unchanged** — the
  hand-written types had matched the real schema. Worth repeating when blocked:
  write the types you believe in, then verify rather than assume.
- **Measuring the overlap BEFORE running a data migration.** The script was ready
  and looked fine. Checking the target first showed all 157 legacy P.IVAs were
  already in the project, so the naive uuid5 ids would have collided with
  `lead_piva_uk` and failed the whole batch. Ten seconds of counting prevented a
  broken import of live data.
- **Reusing the app's own backup format as the migration vehicle.** The restore
  path already existed, runs under the real user's JWT and RLS, and the JSON can
  be read before it touches anything. No service key in a script, no second
  code path to maintain.
- **Idempotent migrations** (`add column if not exists`, `drop constraint if
  exists`). `db push` ran nine migrations clean against a database that had
  drifted slightly (`sedi_pos.note` already existed) and only emitted NOTICEs.
- **The Management API for read-only schema checks** when the CLI came up short:
  `POST /v1/projects/<ref>/database/query` with `{"query": "..."}`. That is how
  the seed backfill and the 157-lead overlap were confirmed.
- **Pure module + tests, dumb React** — again. Every ported feature landed as a
  tested pure module (`condivisione`, `indirizzo`, `filtri`, `estrazione`,
  `testoReport`, `pos`, `offerta`, `ricerche`) plus a thin component. 52 → 141
  tests, still ~250 ms.

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

- **The Supabase CLI was logged into the wrong account.** `db push` and
  `gen types` failed with a management-API **403** that reads like a dead or
  deleted project. It was not: the anon key answered `200 []` the whole time.
  The stored Keychain token belonged to `SeoDecre`; the project lives under
  **`pacosoftdecre`** (org `qqtdxpclixznwithghnm`). Fixed with
  `supabase login --token <sbp_…>`, which replaces the Keychain entry.
  *If a future session sees that 403, check the account before suspecting the
  project.*
- **`supabase db execute`** does not exist in CLI v2.105 (it just prints the `db`
  help). `supabase inspect db table-stats` produced no output either. Use the
  Management API query endpoint instead.
- **Reading the CLI token out of the macOS Keychain** (`security
  find-generic-password -w`) is blocked by the sandbox classifier. Don't route
  around it — ask the user for the token.
- **A uuid5-keyed data migration into a non-empty project.** See "What Worked" —
  it would have collided with the P.IVA unique index. The script now takes
  `--mappa-esistenti` and reuses existing ids, and omits null keys so it merges
  instead of blanking fields the 3.0 never had.
- **Foreground `sleep`** is blocked in this harness. To wait on a deploy, use a
  backgrounded poll (`run_in_background`) that exits on success *or* timeout —
  a poll that only prints on success is indistinguishable from one still running.
- **Assuming a `git push` means a live deploy.** It does not — after the push the
  site was still serving the pre-session bundle. Check the served asset hash, not
  the push exit code.
- **Polling the deployed URL in a loop.** A 40-iteration `curl` poll waiting for
  the new bundle tripped **Vercel's bot protection**: the site went from `200`
  with the old bundle to `403 "Vercel Security Checkpoint"`, after which the
  bundle hash could not be read at all — so the check destroyed its own evidence
  and left the deploy status unknown. Check once and look at the Vercel
  dashboard instead.

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
supabase db push --dry-run          # what WOULD be applied — always run this first
supabase db push                    # apply migrations to the linked project
supabase db reset --linked          # from-zero rebuild — DEV PROJECT ONLY, never prod
supabase gen types typescript --linked > src/types/database.ts
supabase functions deploy notifiche --use-api    # no Docker
```

The CLI must be logged into **`pacosoftdecre`**, not `SeoDecre` — the wrong
account gives a 403 that looks like a missing project:

```bash
supabase login --token sbp_...      # stores in the macOS Keychain
supabase projects list              # must show jhiopnnrhokabishwvxh
```

Read-only SQL when the CLI can't help (schema checks, row counts):

```bash
curl -s -X POST "https://api.supabase.com/v1/projects/jhiopnnrhokabishwvxh/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"select count(*) from public.lead"}'
```

Is the deploy actually live? Compare the served bundle to the local build:

```bash
npm run build && ls dist/assets | grep -o 'index-[A-Za-z0-9_-]*\.js'
curl -s https://gestionale-paco.vercel.app/ | grep -o 'index-[A-Za-z0-9_-]*\.js'
```

Regenerate the legacy data migration:

```bash
python3 scripts/migra-crm3.py "AgentPro_CRM_3.0 copia/data/crm.db" \
  --mappa-esistenti esistenti.json > migrazione.json
```
