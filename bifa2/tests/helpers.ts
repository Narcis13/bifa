import { sql } from 'drizzle-orm'
import * as s from '../server/database/schema'
import { openAppDb } from '../scripts/lib/app-db'
import { env } from '../scripts/lib/env'

/** Drizzle handle on bifa2_test (created and migrated by tests/global-setup.ts). */
export function testDb() {
  return openAppDb(env.test)
}

const TABLES = ['tranzactii', 'operatiuni', 'tipuridocumente', 'materiale', 'categorii', 'locuri', 'gestiuni', 'conturi', 'utilizatori', 'setari']

/** Empties every table. */
export async function reset(db: ReturnType<typeof testDb>['db']) {
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`)
  for (const t of TABLES) await db.execute(sql.raw(`TRUNCATE TABLE \`${t}\``))
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`)
}

/** Minimal synthetic fixture: one operator, one admin, one gestiune, one place, one category, two materials. */
export async function seed(db: ReturnType<typeof testDb>['db']) {
  await reset(db)
  await db.insert(s.utilizatori).values([
    { id: 1, username: 'admin.test', password: 'x', rol: 'admin' },
    { id: 2, username: 'operator.test', password: 'x', rol: 'operator' },
  ])
  await db.insert(s.gestiuni).values([
    { id: 1, denumire: 'Gestiune test', userid: 2, gestionar: 'Gestionar Test' },
    { id: 2, denumire: 'Altă gestiune', userid: 1 },
  ])
  await db.insert(s.conturi).values({ id: 1, cont: '302', tip: 'A', denumire: 'Materiale consumabile', nivel: 0 })
  await db.insert(s.categorii).values([
    { id: 1, denumire: 'Consumabile', idgestiune: 1, tipmaterial: 'M', idcont: 1, idcontchelt: 1 },
    { id: 2, denumire: 'Piese', idgestiune: 1, tipmaterial: 'M', idcont: 1, idcontchelt: 1 },
  ])
  await db.insert(s.locuri).values([{ id: 1, denumire: 'DEPOZIT' }, { id: 2, denumire: 'SECȚIA A' }])
  await db.insert(s.materiale).values([
    { id: 1, denumire: 'Hârtie A4', um: 'top', idgestiune: 1, iduser: 2 },
    { id: 2, denumire: 'Toner', um: 'buc', idgestiune: 1, iduser: 2 },
  ])
  await db.insert(s.tipuridocumente).values([
    { id: 1, denumire: 'NOTA DE RECEPTIE', tip: 'i', denumire_scurta: 'NRCD', prioritate: 1 },
    { id: 2, denumire: 'BON DE CONSUM', tip: 'e', denumire_scurta: 'BC', prioritate: 20 },
    { id: 3, denumire: 'BON DE PREDARE TRANSFER', tip: 't', denumire_scurta: 'BPTR', prioritate: 30 },
  ])
}
