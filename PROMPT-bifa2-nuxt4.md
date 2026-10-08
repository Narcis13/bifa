# Task

Goal: Rewrite the BIFA stock-management app (legacy Quasar 1 / Vue 2 + Express + Knex in `nbifa-master/`) as a new Nuxt 4 + PrimeVue application in `bifa2/`, keeping every existing stock-management feature, polishing the UI, making the API professional, replacing the Puppeteer PDFs with good-looking print-ready HTML reports, and providing a repeatable import of the production data into the new (optimized) MySQL schema.
Done when: all of the following pass from `bifa2/`, run on the final commit:
  1. `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` all exit 0.
  2. `pnpm db:import` rebuilds `bifa_legacy` from the two dump files and migrates it into `bifa2`, from scratch, with no manual steps, and can be re-run safely.
  3. `pnpm db:verify` exits 0. It proves that for every (gestiune, loc, categorie, material, tip_material, stare_material) the stock quantity and stock value at today's date are identical in `bifa_legacy` (computed with the legacy SQL) and `bifa2` (to 0.01), and that row counts per table match, with each intentional difference listed and explained in the output.
  4. `pnpm verify:reports` exits 0. It runs the legacy report SQL (copied from `nbifa-master/server/api/controllers/balante.js`, parameterized) against `bifa_legacy` and the new report services against `bifa2`, and gets identical numbers for: balanța analitică, lista de inventariere and fișa de cont, for every gestiune, for the periods 2024-01-01..2024-12-31, 2025-01-01..2025-12-31 and 2026-01-01..today, for tip material M and with all categories, places and states.
  5. Chrome visual check of every page and every report is done (see Visual check), at desktop width and phone width, with no console errors.
  6. Every feature in the parity checklist below works in the new app, and the PR description shows the checklist with each item ticked or explained.
Scope: create and change anything inside `bifa2/` (the new Nuxt project). You may add entries to the repo-root `.gitignore`. Everything else is read-only: `nbifa-master/`, `bifa_structure.sql`, `bifa_data.sql`, `harness-prompt.md`, this file.
Limit: 6 hours of wall-clock time.
Subagents: 5
Branch: new, `feat/bifa2-nuxt4`
PR: yes
Unattended: yes

If a missing detail would change the result, ask me one focused question (when unattended: pick the safest sensible default and record it under Decisions instead). For anything else, choose a sensible default, say what it is, and start.

## Context

### What the legacy app is

`nbifa-master/` is a stock-management app ("gestiune") for a hospital (UM 02497 Pitești). It has been in production since 2020 and is still in use: the data dump runs to 2026. Volumes: about 5.2k documents (`operatiuni`), 33k document lines (`tranzactii`), 5.6k materials, 1.9k chart-of-accounts rows, 60 places, 32 categories and a handful of users and gestiuni.

- Backend: `nbifa-master/server/` (Express, port 3333, Knex, MySQL db `bifa`). Routes are in `server/api/routes/*.js`, logic in `server/api/controllers/*.js`, and report templates (EJS + CSS) in `server/api/controllers/reports/`.
- Frontend: `nbifa-master/src/` (Quasar 1). Routes are in `src/router/routes.js`, the menu in `src/components/Meniu.vue` and the auth and current-gestiune state in `src/store/user/index.js`.
- The legacy code is the functional spec. Read the controller and the page for a feature before rebuilding it. Don't copy its code style.

### Out of scope (do not port)

- The procurement module: PAAP, referate de necesitate, angajamente, furnizori, contracte and lichidări. This covers the `/aky` routes and `AkyLayout`, `Dashboard.vue`, `Paap.vue`, `Referate.vue`, `Contracte.vue`, `src/components/paap/*`, `PozitiePAAPAdd.vue`, `ReferatNecesitateAdd.vue`, `ContracteNoi.vue`, the whole `bifalop/` folder, the controllers `paap.js`, `rn.js`, `ang.js` and `furn.js`, the reports `un_referat`, `un_angajament` and `toate_angajamentele`, `server/dbaky.js`, `user_loginaky` and the `adata` database.
- Puppeteer/PDF generation. Reports become HTML pages that print well from the browser (A4, `@media print`).
- Electron/PWA/Cordova, `backend/index.php`, `hop.py`, the `lab` route (a debug endpoint hard-coded to document 21) and `Temporar.vue` (an unused table component).

### Data sources

- `C:\newme\bifa\bifa_structure.sql`: legacy schema (MySQL 5.5 dump, `latin1`). It contains no `CREATE DATABASE` or `USE` statement.
- `C:\newme\bifa\bifa_data.sql`: legacy data, data only (no `CREATE TABLE`, no `USE`). Load it after the structure file into a database you choose.
- Local MySQL Server 8.4.11 (Windows service `MySQL84`) is running on `127.0.0.1:3306` (TCP only, no socket). Connect as `root` with `caching_sha2_password` (the 8.4 default; `mysql_native_password` is disabled). The clients are in `C:\Program Files\MySQL\MySQL Server 8.4\bin\` (`mysql.exe`, `mysqldump.exe`) and are **not on PATH**; in Git Bash use `"/c/Program Files/MySQL/MySQL Server 8.4/bin/mysql.exe"`. The credentials are already in `C:\newme\bifa\.env` (`MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `DB_LEGACY`, `DB_APP`, `DB_TEST`, `MYSQL_BIN`). Do not use the password from `nbifa-master/server/knexfile.js`. Copy the values to `bifa2/.env` (gitignored; the repo-root `.gitignore` already ignores `.env`) and commit a `bifa2/.env.example` without secrets. Never print the password in logs or output; pass it to the client through the `MYSQL_PWD` environment variable, not on the command line.
- Windows notes: the shell is PowerShell (Git Bash is also available). Use `pnpm`/`node` scripts for the import and verification, not `/usr/bin` tools, and load SQL files with Node (`mysql2`) or `mysql.exe` with `--default-character-set`. The dump files are `latin1`/MySQL 5.5 style, so import them with an explicit charset.
- On this machine the server currently holds only the system schemas (`information_schema`, `mysql`, `performance_schema`, `sys`); the old `bifa`, `adata` and other databases do not exist here, so the "older local copy" numbers below cannot be re-checked locally. **Never read from, write to or drop any database other than your own**, and never touch the system schemas. The databases you own are `bifa_legacy` (the dump, loaded as-is), `bifa2` (the new app) and `bifa2_test` (tests). The dump files are the source of truth.
- PostgreSQL is not running on this machine. Don't use it.

### Legacy features: the parity checklist

Authentication and session
- [ ] Login with username and password against `utilizatori`. The response includes the user's role and the gestiuni assigned to the user (`gestiuni.userid`).
- [ ] "Gestiune curentă" (current stock unit) selector. Every operation and report works on the current gestiune. A user can switch between their gestiuni.
- [ ] Admin-only section (rol `admin`): Utilizatori, Gestiuni, Plan conturi and Categorii. Logged-in users see Locuri and Materiale. Logged-in users can do Operațiuni (documents) and Rapoarte.

Administrare (admin)
- [ ] Utilizatori: list, add (unique username), edit, deactivate or delete. Legacy has only add, list and delete.
- [ ] Gestiuni: CRUD, assigned user, gestionar (storekeeper), reception committee (`r_presedinte`, `r_membru1..3`), inventory committee (`i_presedinte`, `i_membru1..3`) and status.
- [ ] Plan conturi: browse and search the chart of accounts (`conturi`), and add analytic accounts (`analitice`) under a synthetic account, then delete them.
- [ ] Categorii repere: CRUD per gestiune, with tip material, stock account (`idcont`) and expense account (`idcontchelt`).
- [ ] Configurare aplicație. This is a stub in the legacy app (`alert('…neimplementat')`), while report headers read the hard-coded `server/api/controllers/reports/config.json`. Implement it as a small settings page and table: institution name and the signatories (director financiar-contabil and comandant, with rank and name). Seed it from `config.json`. Reports read from it.

Nomenclatoare
- [ ] Locuri de dispunere: list, add, edit, status and priority.
- [ ] Materiale per gestiune: list and search, add, edit, deactivate, default price, unit of measure and `cod_import`. Legacy has an "ultimul cod" (last code) helper; keep whatever it is used for in `MaterialAdd.vue`.

Operațiuni (documents)
- [ ] Document types come from `tipuridocumente`, with `tip` = `i` (entry), `e` (exit) or `t` (transfer between places and categories). There are 13 types: NIR (NRCD), bon de consum, bon predare transfer, listă inventariere, centralizator consum, transfer intrări and ieșiri, act primire, note contabile, PV casare, and CAJ intrări and ieșiri.
- [ ] Create a document: tip material (M / OB / MF), document type, date, number, and lines. An entry line takes place, category, material, stare material (NOU / FOLOSIT / CASARE), quantity and price. An exit line takes its source place, category and state, and picks from current stock at **average price** (`stocPretMediu`). Exit prices are read-only. A transfer line writes one credit line (source) and one debit line (destination) under the same document.
- [ ] Document list for a date interval in the current gestiune, with totals per document. Open, edit, invalidate (soft delete: `operatiuni.stare = 'inactiv'`) and print a document.
- [ ] Edit an existing document.

Rapoarte (filters: tip material; category or all; place or all; stare material or all; period)
- [ ] Balanța analitică de gestiune (opening stock, entries, exits, closing stock; quantities and values).
- [ ] Lista de inventariere (closing stock with the inventory committee from the gestiune).
- [ ] Fișa de cont per material (opening balance plus movements).
- [ ] Single-document printout (`un_document.ejs`).
- [ ] Registru: documents in an interval (`documente_interval.ejs`). This was the only real PDF in the legacy app.

### Problems found in the legacy app (fix them in the new app)

These come from a quick surface review, not a full audit. Confirm each one while you work, and fix any others you find. Record them in the PR description under "Legacy bugs fixed".

1. **SQL injection.** All report SQL in `balante.js` is built by interpolating `req.body` into strings. Use only parameterized queries or the query builder.
2. **No real auth.** `checkaut` is commented out on every route. The JWT secret is hard-coded (`'ROSES'`), the token payload contains the plaintext password, and passwords are stored in plaintext. Decision (mine): keep the same simple login model, but hash passwords with scrypt (`nuxt-auth-utils` `hashPassword` / `verifyPassword`). The importer hashes the existing passwords so current users keep logging in with the same credentials. Use a sealed cookie session. Every `/api` route except login requires a session. Admin routes require `rol = 'admin'`. A user can only touch gestiuni assigned to them; admins can touch all.
3. **Swallowed errors.** `.catch(err => {})` everywhere leaves requests hanging, and there is no input validation. Validate every input with zod, and return consistent error responses with proper status codes and Romanian messages.
4. **Non-atomic documents.** The header (`documentnou`) and the lines (`tranzactienoua`) are saved in two separate HTTP requests. Edit inserts a *new* document and then fire-and-forget hard-deletes the old one. In the older local copy, 198 documents have no lines. Save header and lines in one DB transaction. Edit in place in one transaction, keeping the document id. Never hard-delete.
5. **Edit rounds prices.** `Documente.vue` around line 581 rounds `pret` to 2 decimals when it loads a document for editing, so re-saving changes the values. Keep full precision.
6. **Inconsistent filters.** `stocPretMediu` doesn't filter `tranzactii.stare = 'ACTIV'` while the reports do. SQL hard-codes the `bifa.` schema prefix. Use one shared stock query or service for documents and reports.
7. **No stock check on exits.** In the older local copy there are about 240 (gestiune, loc, categ, material, stare) groups with negative stock. Validate exit quantities server-side against available stock as of the document date, inside the transaction.
8. **Rounding residue on full exit.** Some groups have zero quantity but a non-zero value. When an exit takes the whole remaining quantity, its value must be the whole remaining value.
9. **No duplicate warnings.** There are about 41 duplicate active document numbers (same gestiune, type and year) and about 228 duplicate material names per gestiune. Warn in the UI. Don't hard-block, because the historical data already has duplicates.
10. **Hidden documents.** `documenteinterval` inner-joins `tranzactii`, so documents without lines are invisible. The new list shows them.

### Known data quirks (the importer must handle them, not hide them)

Recompute these on the dump; the numbers above and below come from an older local copy.
- `tranzactii` rows that reference `categorii` ids which no longer exist (about 109 in the old copy).
- Mixed-case status values: `ACTIV` / `activ` / `inactiv` / `INACTIV`.
- Junk values in `utilizatori.rol` (anything other than `admin` means a normal user) and test rows in `analitice`.
- An unused `user` table (old Flask-style hashes) and `knex_migrations*`.
- Text accounts duplicated next to ids in `categorii` (`cont` / `contcheltuiala` vs `idcont` / `idcontchelt`).
- Redundant `tranzactii.id_gestiune` (equals `operatiuni.idgestiune`) and `operatiuni.tipoperatiune` (equals `tipuridocumente.denumire_scurta`).
- Real negative stocks and duplicates (see above). Import them faithfully. `db:verify` must still pass, because the goal is identical balances, not "clean" balances. List the anomalies in the import report.

### Target stack

**Use the Context7 MCP for current documentation.** Your training data may be out of date for these libraries, especially Nuxt 4 and PrimeVue.
- Before scaffolding, and before the first use of any library API, call `resolve-library-id`, then `query-docs` with a specific question (for example "Nuxt 4 server routes and readValidatedBody with zod", "PrimeVue DataTable lazy loading with server-side filters" or "PrimeVue Nuxt module custom preset from Aura"). Use the version-specific id when one exists.
- Do this at minimum for Nuxt 4 (directory structure, `nuxt.config`, Nitro server routes, `useFetch` / `$fetch`, middleware), PrimeVue and `@primevue/nuxt-module` (install, theming and presets, the `ro` locale, DataTable, Form / validation, Dialog, Toast, ConfirmDialog), `nuxt-auth-utils`, Drizzle ORM / drizzle-kit for MySQL, and `@nuxt/eslint`.
- Query again whenever a build, type or runtime error points at a library API, instead of guessing.
- If Context7 is unavailable, say so in `PROGRESS.md` and fall back to the official docs sites.
- Record the library versions you settled on under Decisions.

- Nuxt 4.x (`app/` directory layout; not Nuxt 5), TypeScript strict, pnpm, Node 24 (installed).
- PrimeVue (latest stable) through `@primevue/nuxt-module`, styled mode, with a custom preset built on Aura. Add Tailwind CSS v4 and `tailwindcss-primeui` only if layout needs it. UI language: Romanian, with correct diacritics, `ro-RO` number and date formatting and the PrimeVue `ro` locale.
- MySQL 8 with **Drizzle ORM** (`drizzle-orm/mysql2`) and `drizzle-kit` migrations as the only data-access layer of the app (see "Data access: Drizzle ORM" below; Prisma and other ORMs are not allowed), zod for validation, `nuxt-auth-utils` for sessions and password hashing, Vitest (with `@nuxt/test-utils` where useful) and `@nuxt/eslint`.
- Decimal math: never use JS floats for money or quantities in the server. Do arithmetic in SQL or with integer-scaled or decimal values, and keep at least the legacy precision (`pret` 4 dp, values 4 dp, quantities 2 dp; widening is fine).

### Data access: Drizzle ORM

Chosen over Prisma because the hard parts (stock, balance and account-card reports) are SQL aggregates that must stay readable next to the legacy SQL, `decimal` comes back as a string (no float drift), table and column names stay hand-controlled, and there is no generate step or engine binary to break on Windows.

- **Schema as code.** Define every table in `bifa2/server/database/schema.ts` (split into a `schema/` folder if it gets large) with `drizzle-orm/mysql-core`, using the legacy table and column names. Infer row and insert types from the schema (`$inferSelect` / `$inferInsert`). Use the `decimal` column type with explicit precision and scale, never `float`/`double`, and keep it as a string in TypeScript.
- **Migrations.** `drizzle-kit generate` creates the SQL migrations into `bifa2/server/database/migrations/` and they are committed. `drizzle-kit migrate` (wrapped in `pnpm db:migrate`) applies them. Never edit an applied migration, and never use `drizzle-kit push` on `bifa2`. `drizzle.config.ts` reads the connection from `.env`.
- **One connection module.** A single `server/utils/db.ts` creates the `mysql2` pool and the Drizzle instance (`mode: 'default'`), reads `MYSQL_*` / `DB_APP` through `runtimeConfig`, and is the only place that connects. Tests use the same module pointed at `bifa2_test`.
- **Where queries live.** Only in `server/services/`. Route handlers never build queries. Services take the database or a transaction handle as a parameter (`db | tx`), so the same function runs inside and outside a transaction.
- **Query style.** Use the query builder (`select`, `insert`, `update`) for CRUD. For stock and reports, write the aggregates with the `sql` template tag so the structure matches the legacy SQL, and bind every value as a parameter (never `sql.raw` with user input, never string concatenation). Keep the shared stock query in one service used by documents and reports (see legacy bug 6).
- **Transactions.** Every multi-statement write uses `db.transaction()`. A document save (header plus lines, create or edit) and its exit-stock check run in one transaction, with `SELECT … FOR UPDATE` on the rows that decide the check.
- **Decimals.** Do arithmetic in SQL (`SUM`, `ROUND`, etc.) or on decimal strings. Do not convert `decimal` strings to JS `number` for any calculation; convert only at the very edge for display, with the `ro-RO` formatter.
- **Validation types.** Request and response shapes live in `shared/` as zod schemas. They may be derived from the Drizzle schema with `drizzle-zod` (or the built-in zod helpers of the installed Drizzle version; check the docs with Context7), but the public API shape is defined by the zod schema, not by the table.
- **Where raw `mysql2` is allowed.** Only in the scripts under `bifa2/scripts/`: loading the two dump files into `bifa_legacy`, and running the legacy report SQL in `verify:reports` and the legacy stock SQL in `db:verify` against `bifa_legacy`. That SQL must stay verbatim (parameterized), so it is not rewritten in Drizzle. The import into `bifa2` writes through the Drizzle schema, so column types and constraints are enforced.
- **Tests.** Service tests run against `bifa2_test`, created and migrated by the test setup, and use synthetic data only.
- **Record in Decisions** the installed versions of `drizzle-orm`, `drizzle-kit` and `mysql2`, and any Drizzle limitation you worked around with `sql`.

### Schema direction (optimize, but stay close to the legacy one)

- Keep the legacy table and column names where they make sense, so the legacy SQL stays readable against the new schema. Rename only when it clearly helps, and document every rename in the import script.
- Use `utf8mb4` with a Romanian collation. Add real foreign keys, NOT NULL where the data allows it, and indexes for the hot paths: `tranzactii(idAntet)`, `tranzactii(id_gestiune, id_locdispunere, id_categ, id_reper, stare_material)`, `operatiuni(idgestiune, data)`, `materiale(idgestiune, denumire)`.
- Normalize statuses (enum or boolean), roles (`admin` / `operator`) and the duplicated account columns. Drop `user` and `knex_migrations*`. Add `setari`. Use `created_at` / `updated_at` everywhere.
- Preserve every primary key value from legacy, so document and material ids stay the same for the users.
- For orphan category references, use the safest option that keeps balances identical: for example, one placeholder category per affected gestiune named "Categorie lipsă (import)". Record the choice.

### API conventions

- Nitro routes under `server/api/`, organized by resource: auth, me, gestiuni, utilizatori, conturi (with analitice), categorii, locuri, materiale, tipuri-documente, documente, stocuri (average-price stock lookup), rapoarte/* and setari. Use the HTTP methods and status codes REST implies (201 on create, 204 on delete, 400/401/403/404/409/422).
- Keep handlers thin. Put business logic in `server/services/` (or `server/utils/`) as typed functions, and test those functions directly.
- List endpoints filter, sort and paginate on the server where data is large (materials, documents, chart of accounts).
- Use one error shape everywhere, and keep shared zod schemas in `shared/`, so client and server validate the same way.

### UI and reports

- Use a clean app shell: sidebar menu that follows the legacy grouping (Administrare / Nomenclatoare / Operațiuni / Rapoarte), a header with the current-gestiune switcher and the user menu, and a light/dark theme.
- Use PrimeVue DataTable with filters for lists and Dialog or Drawer forms. Make document entry keyboard-friendly, because it is the most-used screen. Use confirmation dialogs for destructive actions and toasts for results.
- Reports are routes such as `/rapoarte/balanta?…` that render a print-ready A4 document: institution header, title, filters, tables with totals, and signature blocks (gestionar, committees, signatories from `setari`). Add a "Tipărește" (print) button. Use the legacy EJS templates as the content reference, but the design should be clearly better. Screen and print styles must both look good.

### Suggested order (cut polish first if time runs short; never cut verification)

1. Scaffold `bifa2/` with lint, typecheck, test and build scripts plus a `README.md` with setup and run steps. Record the baseline.
2. Schema and migrations, then `db:import` and `db:verify`. Everything else depends on this being correct.
3. Auth, session, roles, current gestiune and the API error and validation conventions.
4. Documents: stock service, create, edit, invalidate, list and document print.
5. Reports, plus `verify:reports`.
6. Nomenclatoare and administrare CRUD, and settings.
7. UI polish, phone-width pass, then Finish.

## How to work

1. **Orient.** If `PROGRESS.md` exists, read it, confirm it still matches the code, and resume from its next step. Read only what the next decision needs.
2. **Baseline.** Run the checks before changing anything and note the result. Every change is measured against it.
3. **Small steps.** Make one bounded change and run the checks it affects. Keep it if it moves toward done; revert just that change if it doesn't. Don't repeat a failed approach without a new reason.
4. **Simpler wins.** When two solutions work equally well, keep the one with less code. Removing code without losing anything counts as progress. Don't add abstractions, config, or files the task doesn't need.
5. **Don't touch the evaluator.** Never edit, skip, or loosen a check to make it pass. This includes the reconciliation tolerances and the legacy SQL copied into `verify:reports`. If a check looks wrong, stop and tell me.

## Subagents

Use them when they save real time or context. Otherwise, do the work yourself.

- **Good fits:** independent pieces that can run in parallel, wide codebase searches, a fresh-eyes review at the end. **Poor fits:** small tasks and tightly coupled edits.
- **Pick the cheapest model that can do the job well.** Sonnet 5.5 for well-defined work: searching, mechanical edits, writing tests, following a clear plan. Opus 5.5 for ambiguous design, hard debugging, and the final review.
- **Brief them fully.** A subagent doesn't see this conversation. Give it the goal, the files, its scope, and exactly what to return.
- **No overlapping edits.** Two subagents never edit the same files at the same time.
- **Verify before keeping.** A subagent saying "done" is a claim. Run the checks on its work yourself.
- **Only you commit and push.** Subagents edit files; they don't touch git.
- Stay within the subagent limit above, counting every agent you start.

## Visual check

For anything a person will look at (UI, layout, styles, charts, generated pages), open it in Chrome and look at it before calling it done.

- Start the dev server if needed, open the page in a new tab, and take a screenshot.
- Compare it with what was asked. Try the main interaction, check the console for errors, and check a phone-width viewport if layout matters.
- For reports, also check the print preview (A4, nothing cut off, totals and signatures on the page).
- Treat this as one of the checks: fix what looks wrong, then look again.
- Leave my other tabs and logged-in accounts alone.
- If Chrome isn't connected, say so. Never claim something looks right without seeing it.

## Git

Commits, pushes to the work branch, and opening the PR are pre-approved. You don't need to ask.

- **Branch.** If `Branch` is new, fetch and branch off the latest base branch. If it's current, work where you are. Unattended work never lands directly on `main`/`master`: if you're on it, create a branch first.
- **Commit at each milestone**, meaning a step that passes its checks and leaves nothing worse than the baseline. Stage only the files you changed. Never commit secrets, `.env` files, build output, or `PROGRESS.md`. Keep messages short: what changed and why.
- **This repository is public.** Never commit database dumps, generated SQL containing data, import reports, screenshots or test fixtures containing real names or other personal data from the dump. Use synthetic data in tests. Keep personal data out of the PR description too.
- **Push after every commit.** If a push fails, keep committing locally, note it in `PROGRESS.md`, and try again at the next milestone.
- **Open the PR when finished** (if `PR` is yes), using `gh`, against the base branch. In the description, cover what changed, the check results, the parity checklist, the legacy bugs fixed, the schema changes, and what's unresolved. Open it as a draft if any check fails or the work is partial.
- **Never** force-push, rewrite pushed history, push to any other branch, merge the PR, or enable auto-merge.

## When I'm away (`Unattended: yes`)

- Don't wait for me. Where you'd normally ask, pick the safest reasonable option, record it under Decisions, and keep going.
- Anything on the ask-first list below: don't do it. Leave it as a next step for me.
- If one part is blocked, record why and move to another part. When nothing useful is left or the limit is reached, run Finish and stop. Don't spin.
- Keep `PROGRESS.md` current after every milestone. On a long run your context may get compacted, and this file is how you stay on track.

## Guardrails

- Stay inside scope.
- Ask before anything else irreversible or outward-facing: deploy, publish, delete data, send messages, spend money.
- In MySQL, create, drop and write only `bifa_legacy`, `bifa2` and `bifa2_test`. Touch no other database on the server, and change no server-level settings or users.
- Commit before a risky edit so it can be undone.
- Before retrying an external write (push, PR), check whether the first attempt already landed.

## Progress file

You must keep this file when the task is unattended or spans sessions. Skip it for short attended tasks. Keep it out of git (add it to `.git/info/exclude`). Put it at `bifa2/PROGRESS.md`. Keep it short:

- **Done:** finished milestones and their check results
- **Decisions:** choices that shape the result, and why
- **Tried and failed:** what didn't work, and why
- **Git:** branch, last pushed commit, PR link
- **Next:** one concrete step to resume from

## Finish

1. Reread the full diff once with fresh eyes (a review subagent works well for large changes). Look for bugs, leftover debug code, and complexity you can remove.
2. Rerun all checks on the final version, including the Chrome check for visual changes.
3. Commit and push the final state. If `PR` is yes, open the PR.
4. Report briefly:
   - branch and PR link
   - what changed, with file paths
   - each check: pass or fail, with the real output for failures
   - for visual changes, what you looked at in Chrome
   - if you used subagents: how many, which model, and for what
   - decisions made without me, and anything unresolved

If the limit or a blocker stops you, say exactly what's left. Never report a result you didn't observe.
