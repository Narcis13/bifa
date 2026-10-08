# BIFA 2 – gestiune materiale

Rescrierea aplicației BIFA (Quasar 1 + Express + Knex, în `../nbifa-master`) ca aplicație
Nuxt 4 + PrimeVue 4, cu API validat (zod), sesiuni sigilate, parole scrypt, documente salvate
atomic și rapoarte HTML gata de tipărit (A4).

## Cerințe

- Node 24, pnpm 12
- MySQL 8.4 pe `127.0.0.1:3306` (TCP). Proiectul folosește doar bazele `bifa_legacy`,
  `bifa2` și `bifa2_test`.
- Fișierele `../bifa_structure.sql` și `../bifa_data.sql` (dump-ul de producție).

## Configurare

```bash
cp .env.example .env   # completați MYSQL_PASSWORD, NUXT_MYSQL_PASSWORD, NUXT_SESSION_PASSWORD (min. 32 caractere)
pnpm install
pnpm db:import         # dump -> bifa_legacy -> migrații + date în bifa2 (de la zero)
pnpm db:verify         # număr de rânduri și stocuri pe grupe identice legacy vs bifa2
pnpm dev               # http://localhost:3000
```

Utilizatorii existenți se autentifică în continuare cu aceleași credențiale (parolele sunt
convertite la scrypt la import). Pentru un cont local de test: setați `DEV_USER_PASSWORD` în
`.env` și rulați `pnpm db:dev-user` (cont `demo.admin`, rol admin).

## Scripturi

| Comandă | Ce face |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm preview` | server de dezvoltare / build de producție / previzualizare |
| `pnpm lint` | ESLint (`@nuxt/eslint`, stil inclus) |
| `pnpm typecheck` | `nuxt typecheck` + scripturile și testele (`tsconfig.scripts.json`) |
| `pnpm test` | Vitest; recreează și migrează `bifa2_test`, doar date sintetice |
| `pnpm db:generate` | `drizzle-kit generate` (migrații noi din `server/database/schema.ts`) |
| `pnpm db:migrate` | creează baza (utf8mb4, colație română) și rulează `drizzle-kit migrate` |
| `pnpm db:import` | reconstruiește `bifa_legacy` din dump și `bifa2` de la zero; se poate rula din nou (șterge datele din `bifa2`). Raportul de anomalii: `.import/import-report.md` (necomis: conține date reale) |
| `pnpm db:verify` | compară `bifa_legacy` (SQL legacy) cu `bifa2` (serviciul de stoc): rânduri pe tabel, stoc cantitativ și valoric la zi pe (gestiune, loc, categorie, material, tip, stare) |
| `pnpm verify:reports` | rulează SQL-ul rapoartelor legacy (din `balante.js`, parametrizat) pe `bifa_legacy` și serviciile noi pe `bifa2`: balanța, lista de inventariere și fișa de cont, pe fiecare gestiune, 2024, 2025 și 2026 până azi |

## Structură

```
app/                 interfața (Nuxt 4, PrimeVue 4, preset propriu peste Aura, temă luminoasă/întunecată)
  pages/documente    lista și editorul de documente (intrări, ieșiri la preț mediu, transferuri)
  pages/rapoarte     filtre + rapoarte tipăribile (balanța, inventar, fișa de cont, registru, document)
  pages/admin        utilizatori, gestiuni, plan de conturi, categorii, configurare
server/
  database/          schema Drizzle și migrațiile drizzle-kit
  services/          toată logica și toate interogările (primesc `db` sau o tranzacție)
  api/               rute Nitro subțiri: validare zod, autorizare, apel de serviciu
  utils/             conexiunea (singurul loc care se conectează), erori, autorizare
shared/              scheme zod și utilitare comune client/server (aritmetică zecimală exactă)
scripts/             import, verificări (singurul loc unde se folosește mysql2 direct)
tests/               teste de servicii pe `bifa2_test`
```

## Reguli de bază

- **Stocul** se calculează într-un singur loc (`server/services/stoc.ts`), folosit de documente și
  de rapoarte: doar documente și linii active, într-o gestiune, până la o dată.
- **Documentele** (antet + linii) se salvează într-o singură tranzacție. Ieșirile și transferurile
  iau prețul mediu din stoc, verifică stocul disponibil la data documentului sub blocare
  (`SELECT … FOR UPDATE`), iar o ieșire care golește stocul preia toată valoarea rămasă.
  Modificarea păstrează id-ul documentului; liniile vechi sunt dezactivate, nu șterse.
- **Sume și cantități**: `DECIMAL` în MySQL, șiruri în TypeScript, aritmetică în SQL sau cu
  `Dec` (BigInt scalat). Niciun `number` JS pentru bani sau cantități pe server.
- **API**: fiecare rută `/api` (în afară de login) cere sesiune; secțiunea Administrare cere rol
  `admin`; un operator lucrează doar în gestiunile atribuite lui. Erorile au aceeași formă
  (`statusCode`, `message` în română, `data.issues` la validare).
