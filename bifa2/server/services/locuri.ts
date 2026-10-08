import { asc, desc, eq } from 'drizzle-orm'
import { locuri } from '../database/schema'
import type { DbOrTx } from '../utils/db'
import type { LocInput } from '../../shared/schemas/locuri'

export function listaLocuri(db: DbOrTx, opts: { stare?: 'activ' | 'inactiv' } = {}) {
  return db.select().from(locuri)
    .where(opts.stare ? eq(locuri.stare, opts.stare) : undefined)
    .orderBy(desc(locuri.prioritate), asc(locuri.denumire))
}

export async function gasesteLoc(db: DbOrTx, id: number) {
  const [row] = await db.select().from(locuri).where(eq(locuri.id, id))
  return row
}

export async function adaugaLoc(db: DbOrTx, input: LocInput) {
  const [r] = await db.insert(locuri).values(input).$returningId()
  return gasesteLoc(db, r!.id)
}

export async function modificaLoc(db: DbOrTx, id: number, input: Partial<LocInput>) {
  await db.update(locuri).set(input).where(eq(locuri.id, id))
  return gasesteLoc(db, id)
}
