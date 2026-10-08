/**
 * pnpm db:import — rebuilds bifa_legacy from the two dump files, then recreates bifa2 from
 * scratch (migrations + data). Safe to re-run: both databases are dropped and rebuilt.
 * Writes the anomaly report to .import/import-report.md (gitignored: it contains real data).
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { ensureDatabase, migrateDatabase } from './lib/app-db'
import { env } from './lib/env'
import { loadLegacy } from './lib/load-legacy'
import { migrateData } from './lib/migrate-data'

const t0 = Date.now()
console.log(`1/3 Încarc dump-urile în ${env.legacy}…`)
await loadLegacy()

console.log(`2/3 Recreez ${env.app} și aplic migrațiile…`)
await ensureDatabase(env.app, true)
const { db, pool } = await migrateDatabase(env.app)

console.log(`3/3 Migrez datele în ${env.app}…`)
const report = await migrateData(db)
await pool.end()

const out = resolve(import.meta.dirname, '../.import')
await mkdir(out, { recursive: true })
const md = ['# Raport import', '', `Generat: ${new Date().toISOString()}`, '', '## Anomalii', '', ...report.anomalies.map(a => `- ${a}`), '']
await writeFile(resolve(out, 'import-report.md'), md.join('\n'))
console.log('\nAnomalii:')
for (const a of report.anomalies) console.log(`  - ${a}`)
console.log(`\nImport terminat în ${((Date.now() - t0) / 1000).toFixed(1)} s. Raport: .import/import-report.md`)
