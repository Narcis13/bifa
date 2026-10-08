import { eq } from 'drizzle-orm'
import { setari } from '../database/schema'
import type { DbOrTx } from '../utils/db'
import type { SetariInput } from '../../shared/schemas/setari'

const ID = 1

/** Settings row; an empty set of values when it was never saved (reports still need strings). */
export async function citesteSetari(db: DbOrTx) {
  const [row] = await db.select().from(setari).where(eq(setari.id, ID))
  return row ?? { id: ID, institutie: '', grad_dir_fin_con: '', nume_dir_fin_con: '', grad_comandant: '', nume_comandant: '', created_at: '', updated_at: '' }
}

export async function salveazaSetari(db: DbOrTx, input: SetariInput) {
  await db.insert(setari).values({ id: ID, ...input }).onDuplicateKeyUpdate({ set: input })
  return citesteSetari(db)
}
