import { asc, eq } from 'drizzle-orm'
import { gestiuni } from '../database/schema'
import type { DbOrTx } from '../utils/db'

interface SessionUser { id: number, rol: 'admin' | 'operator' }

/** Gestiuni a user may work in: all active ones for admins, the assigned active ones otherwise. */
export async function gestiuniAccesibile(db: DbOrTx, user: SessionUser) {
  const cols = { id: gestiuni.id, denumire: gestiuni.denumire, stare: gestiuni.stare, userid: gestiuni.userid }
  const all = await db.select(cols).from(gestiuni).where(eq(gestiuni.stare, 'activ')).orderBy(asc(gestiuni.denumire))
  return user.rol === 'admin' ? all : all.filter(g => g.userid === user.id)
}
