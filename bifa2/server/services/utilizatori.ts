import { asc, eq } from 'drizzle-orm'
import { gestiuni, materiale, utilizatori } from '../database/schema'
import type { DbOrTx } from '../utils/db'
import type { UtilizatorModificat, UtilizatorNou } from '../../shared/schemas/utilizatori'

/** Business-rule outcome: services cannot throw HTTP errors, route handlers map `eroare` with apiError. */
export type Rezultat<T> = { ok: true, valoare: T } | { ok: false, status: 400 | 404 | 409, eroare: string }

export const ok = <T>(valoare: T): Rezultat<T> => ({ ok: true, valoare })
export const refuz = (status: 400 | 404 | 409, eroare: string): Rezultat<never> => ({ ok: false, status, eroare })

/** Every column except the password hash, which never leaves the server. */
const publice = {
  id: utilizatori.id,
  username: utilizatori.username,
  name: utilizatori.name,
  email: utilizatori.email,
  rol: utilizatori.rol,
  stare: utilizatori.stare,
  created_at: utilizatori.created_at,
  updated_at: utilizatori.updated_at,
}

export function listaUtilizatori(db: DbOrTx) {
  return db.select(publice).from(utilizatori).orderBy(asc(utilizatori.username))
}

export async function gasesteUtilizator(db: DbOrTx, id: number) {
  const [row] = await db.select(publice).from(utilizatori).where(eq(utilizatori.id, id))
  return row
}

/** `input.passwordHash` is already hashed by the route handler. */
export async function adaugaUtilizator(
  db: DbOrTx,
  input: Omit<UtilizatorNou, 'password'> & { passwordHash: string },
) {
  const [exista] = await db.select({ id: utilizatori.id }).from(utilizatori).where(eq(utilizatori.username, input.username))
  if (exista) return refuz(409, 'Acest nume de utilizator există deja.')
  const { passwordHash, ...rest } = input
  const [r] = await db.insert(utilizatori).values({ ...rest, password: passwordHash }).$returningId()
  return ok((await gasesteUtilizator(db, r!.id))!)
}

/** An admin may not deactivate or demote their own account (they would lock themselves out). */
export async function modificaUtilizator(
  db: DbOrTx,
  id: number,
  input: Omit<UtilizatorModificat, 'password'> & { passwordHash?: string },
  actorId: number,
) {
  const curent = await gasesteUtilizator(db, id)
  if (!curent) return refuz(404, 'Utilizatorul nu există.')
  if (id === actorId && ((input.rol && input.rol !== 'admin') || input.stare === 'inactiv'))
    return refuz(400, 'Nu vă puteți dezactiva sau retrograda propriul cont.')
  const { passwordHash, ...rest } = input
  const set = { ...rest, ...(passwordHash ? { password: passwordHash } : {}) }
  if (Object.values(set).some(v => v !== undefined))
    await db.update(utilizatori).set(set).where(eq(utilizatori.id, id))
  return ok((await gasesteUtilizator(db, id))!)
}

/** Hard delete only when nothing references the user; otherwise deactivate instead. */
export async function stergeUtilizator(db: DbOrTx, id: number, actorId: number) {
  if (id === actorId) return refuz(400, 'Nu vă puteți șterge propriul cont.')
  if (!await gasesteUtilizator(db, id)) return refuz(404, 'Utilizatorul nu există.')
  const [g] = await db.select({ id: gestiuni.id }).from(gestiuni).where(eq(gestiuni.userid, id)).limit(1)
  const [m] = g ? [] : await db.select({ id: materiale.id }).from(materiale).where(eq(materiale.iduser, id)).limit(1)
  if (g || m) return refuz(409, 'Utilizatorul este folosit (gestiuni sau materiale) și nu poate fi șters; dezactivați-l.')
  await db.delete(utilizatori).where(eq(utilizatori.id, id))
  return ok(null)
}
