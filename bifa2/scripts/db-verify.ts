/**
 * pnpm db:verify — proves the import is faithful.
 * 1. Row counts per table, with every intentional difference listed and explained.
 * 2. For every (gestiune, loc, categorie, material, tip_material, stare_material): stock quantity
 *    and value at today's date, computed with the legacy SQL on bifa_legacy and with the app's
 *    stock service on bifa2, must be identical (to 0.01).
 */
import type { RowDataPacket } from 'mysql2/promise'
import { stocPeGrupe } from '../server/services/stoc'
import { Dec } from '../shared/utils/decimal'
import { openAppDb } from './lib/app-db'
import { connect, env } from './lib/env'
import { PLACEHOLDER_CATEGORIE, PLACEHOLDER_GESTIUNE } from './lib/migrate-data'

const today = new Date().toLocaleDateString('sv-SE') // YYYY-MM-DD, local time
let failures = 0
const fail = (msg: string) => {
  failures++
  console.log(`  ✗ ${msg}`)
}

const legacy = await connect(env.legacy)
const { db, pool } = openAppDb(env.app)
const app = await connect(env.app)
const count = async (c: typeof legacy, table: string, where = '') =>
  Number(((await c.query<RowDataPacket[]>(`SELECT COUNT(*) n FROM \`${table}\` ${where}`))[0][0]!).n)

// 1. Row counts
console.log('1. Număr de rânduri pe tabel (legacy → bifa2)')
const placeholderGest = await count(app, 'gestiuni', `WHERE denumire LIKE '${PLACEHOLDER_GESTIUNE}%'`)
const placeholderCateg = await count(app, 'categorii', 'WHERE lipsa_import = true')
const tables: { name: string, expectedDiff: number, why?: string }[] = [
  { name: 'utilizatori', expectedDiff: 0 },
  { name: 'gestiuni', expectedDiff: placeholderGest, why: `${placeholderGest} gestiuni șterse în legacy dar încă referite, recreate inactive („${PLACEHOLDER_GESTIUNE}”)` },
  { name: 'conturi', expectedDiff: 0 },
  { name: 'categorii', expectedDiff: placeholderCateg, why: `${placeholderCateg} categorii „${PLACEHOLDER_CATEGORIE}” (una per gestiune) pentru liniile cu id_categ inexistent` },
  { name: 'locuri', expectedDiff: 0 },
  { name: 'materiale', expectedDiff: 0 },
  { name: 'tipuridocumente', expectedDiff: 0 },
  { name: 'operatiuni', expectedDiff: 0 },
  { name: 'tranzactii', expectedDiff: 0 },
]
for (const t of tables) {
  const [l, a] = [await count(legacy, t.name), await count(app, t.name)]
  const ok = a - l === t.expectedDiff
  const line = `${t.name.padEnd(16)} ${String(l).padStart(6)} → ${String(a).padStart(6)}${t.why ? `  (+${t.expectedDiff}: ${t.why})` : ''}`
  if (ok) console.log(`  ✓ ${line}`)
  else fail(`${line} — diferență neașteptată`)
}
for (const t of ['user', 'knex_migrations', 'knex_migrations_lock', 'analitice']) {
  const why = {
    user: 'tabel nefolosit (hash-uri vechi Flask); autentificarea folosește utilizatori',
    knex_migrations: 'metadate Knex, înlocuite de jurnalul drizzle-kit',
    knex_migrations_lock: 'metadate Knex, înlocuite de jurnalul drizzle-kit',
    analitice: 'doar rânduri de test; conturile analitice sunt în conturi (tip N), ca în legacy',
  }[t]
  console.log(`  ✓ ${t.padEnd(16)} ${String(await count(legacy, t)).padStart(6)} → eliminat (${why})`)
}
console.log(`  ✓ ${'setari'.padEnd(16)}      – → ${String(await count(app, 'setari')).padStart(6)}  (tabel nou, din reports/config.json)`)

// Same active/inactive split for documents and lines (legacy compares stare='ACTIV' case-insensitively)
for (const t of ['operatiuni', 'tranzactii']) {
  const l = await count(legacy, t, `WHERE stare = 'ACTIV'`)
  const a = await count(app, t, `WHERE stare = 'activ'`)
  if (l === a) console.log(`  ✓ ${t} active: ${l} = ${a}`)
  else fail(`${t} active: legacy ${l} ≠ bifa2 ${a}`)
}

// 2. Stock per group at today's date
console.log(`\n2. Stoc pe grupe (gestiune, loc, categorie, material, tip, stare) la ${today}`)
// Legacy SQL, same filters and sums as the legacy balance (balante.js), grouped by the full key.
const [legacyRows] = await legacy.query<RowDataPacket[]>(`SELECT
  tranzactii.id_gestiune, tranzactii.id_locdispunere, tranzactii.id_categ, tranzactii.id_reper,
  tranzactii.tip_material, tranzactii.stare_material,
  ifnull(sum(case when op.data <= ? then tranzactii.cantitate_debit-tranzactii.cantitate_credit end),0) as stocfinal,
  ifnull(sum(case when op.data <= ? then tranzactii.debit-tranzactii.credit end),0) as valoarestoc
  FROM tranzactii
  inner join operatiuni op on op.id=tranzactii.idAntet
  where op.stare='ACTIV' and tranzactii.stare='ACTIV'
  group by tranzactii.id_gestiune, tranzactii.id_locdispunere, tranzactii.id_categ, tranzactii.id_reper,
    tranzactii.tip_material, tranzactii.stare_material`, [today, today])

// Legacy lines with a missing category were moved to the gestiune's placeholder category.
const [placeholders] = await app.query<RowDataPacket[]>('SELECT id, idgestiune, info FROM categorii WHERE lipsa_import = true')
const [legacyCategIds] = await legacy.query<RowDataPacket[]>('SELECT id FROM categorii')
const known = new Set(legacyCategIds.map(r => Number(r.id)))
const placeholderOf = new Map(placeholders.map(p => [Number(p.idgestiune), Number(p.id)]))

const norm = (s: unknown) => String(s).toUpperCase()
const key = (r: RowDataPacket | Record<string, unknown>, categ: number) =>
  [r.id_gestiune, r.id_locdispunere, categ, r.id_reper, norm(r.tip_material), norm(r.stare_material)].join('|')

const legacyMap = new Map<string, { q: bigint, v: bigint }>()
let remapped = 0
for (const r of legacyRows) {
  let categ = Number(r.id_categ)
  if (!known.has(categ)) {
    categ = placeholderOf.get(Number(r.id_gestiune)) ?? categ
    remapped++
  }
  const k = key(r, categ)
  const prev = legacyMap.get(k) ?? { q: 0n, v: 0n }
  legacyMap.set(k, { q: prev.q + Dec.from(String(r.stocfinal)), v: prev.v + Dec.from(String(r.valoarestoc)) })
}

const appRows = await stocPeGrupe(db, today)
const appMap = new Map(appRows.map(r => [key(r as unknown as Record<string, unknown>, Number(r.id_categ)), { q: Dec.from(r.cantitate), v: Dec.from(r.valoare) }]))

let compared = 0
let sumQ = { l: 0n, a: 0n }
let sumV = { l: 0n, a: 0n }
for (const k of new Set([...legacyMap.keys(), ...appMap.keys()])) {
  const l = legacyMap.get(k)
  const a = appMap.get(k)
  compared++
  if (!l || !a) {
    fail(`grupa ${k} există doar în ${l ? 'legacy' : 'bifa2'}`)
    continue
  }
  sumQ = { l: sumQ.l + l.q, a: sumQ.a + a.q }
  sumV = { l: sumV.l + l.v, a: sumV.a + a.v }
  if (!Dec.near(l.q, a.q) || !Dec.near(l.v, a.v)) {
    fail(`grupa ${k}: cantitate ${Dec.toFixed(l.q, 2)} vs ${Dec.toFixed(a.q, 2)}, valoare ${Dec.toFixed(l.v, 4)} vs ${Dec.toFixed(a.v, 4)}`)
  }
}
console.log(`  ${failures ? '✗' : '✓'} ${compared} grupe comparate (${legacyRows.length} în legacy, ${appRows.length} în bifa2)`)
console.log(`    total cantitate: ${Dec.toFixed(sumQ.l, 2)} = ${Dec.toFixed(sumQ.a, 2)}; total valoare: ${Dec.toFixed(sumV.l, 4)} = ${Dec.toFixed(sumV.a, 4)}`)
if (remapped) console.log(`    ${remapped} grupe legacy cu categorie inexistentă comparate cu categoria „${PLACEHOLDER_CATEGORIE}” a gestiunii lor`)

await legacy.end()
await app.end()
await pool.end()
if (failures) {
  console.log(`\nVERIFICARE EȘUATĂ: ${failures} diferențe.`)
  process.exit(1)
}
console.log('\nVerificare reușită: importul este fidel.')
