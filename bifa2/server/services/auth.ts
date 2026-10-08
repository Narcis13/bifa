import { eq } from 'drizzle-orm'
import { utilizatori } from '../database/schema'
import type { DbOrTx } from '../utils/db'

/** Finds an active user by username; password verification is done by the caller. */
export async function gasesteUtilizatorActiv(db: DbOrTx, username: string) {
  const [u] = await db.select().from(utilizatori).where(eq(utilizatori.username, username)).limit(1)
  return u && u.stare === 'activ' ? u : undefined
}

export async function gasesteUtilizatorDupaId(db: DbOrTx, id: number) {
  const [u] = await db.select({ id: utilizatori.id, username: utilizatori.username, name: utilizatori.name, rol: utilizatori.rol, stare: utilizatori.stare })
    .from(utilizatori).where(eq(utilizatori.id, id)).limit(1)
  return u
}
