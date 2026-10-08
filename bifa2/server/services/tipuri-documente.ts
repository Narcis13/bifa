import { asc } from 'drizzle-orm'
import { tipuridocumente } from '../database/schema'
import type { DbOrTx } from '../utils/db'

/** All document types, in the order they are offered to the user. */
export function listaTipuriDocumente(db: DbOrTx) {
  return db.select({
    id: tipuridocumente.id,
    denumire: tipuridocumente.denumire,
    tip: tipuridocumente.tip,
    denumire_scurta: tipuridocumente.denumire_scurta,
    prioritate: tipuridocumente.prioritate,
  }).from(tipuridocumente).orderBy(asc(tipuridocumente.prioritate), asc(tipuridocumente.id))
}
