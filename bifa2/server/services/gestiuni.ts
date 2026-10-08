import { asc, eq, getTableColumns } from 'drizzle-orm'
import { categorii, gestiuni, materiale, operatiuni, tranzactii, utilizatori } from '../database/schema'
import type { DbOrTx } from '../utils/db'
import type { GestiuneModificata, GestiuneNoua } from '../../shared/schemas/gestiuni'
import { ok, refuz } from './utilizatori'

interface SessionUser { id: number, rol: 'admin' | 'operator' }

/** Gestiuni a user may work in: all active ones for admins, the assigned active ones otherwise. */
export async function gestiuniAccesibile(db: DbOrTx, user: SessionUser) {
  const cols = { id: gestiuni.id, denumire: gestiuni.denumire, stare: gestiuni.stare, userid: gestiuni.userid }
  const all = await db.select(cols).from(gestiuni).where(eq(gestiuni.stare, 'activ')).orderBy(asc(gestiuni.denumire))
  return user.rol === 'admin' ? all : all.filter(g => g.userid === user.id)
}

/** Admin list: every gestiune with the username of the assigned user. */
export function listaGestiuni(db: DbOrTx, opts: { stare?: 'activ' | 'inactiv' } = {}) {
  return db.select({ ...getTableColumns(gestiuni), utilizator: utilizatori.username })
    .from(gestiuni)
    .leftJoin(utilizatori, eq(utilizatori.id, gestiuni.userid))
    .where(opts.stare ? eq(gestiuni.stare, opts.stare) : undefined)
    .orderBy(asc(gestiuni.denumire))
}

/** Full row: reports need the gestionar and both committees. */
export async function gasesteGestiune(db: DbOrTx, id: number) {
  const [row] = await db.select().from(gestiuni).where(eq(gestiuni.id, id))
  return row
}

async function userExista(db: DbOrTx, userid: number | null | undefined) {
  if (userid === null || userid === undefined) return true
  const [u] = await db.select({ id: utilizatori.id }).from(utilizatori).where(eq(utilizatori.id, userid))
  return !!u
}

export async function adaugaGestiune(db: DbOrTx, input: GestiuneNoua) {
  if (!await userExista(db, input.userid)) return refuz(400, 'Utilizatorul ales nu există.')
  const [r] = await db.insert(gestiuni).values(input).$returningId()
  return ok((await gasesteGestiune(db, r!.id))!)
}

export async function modificaGestiune(db: DbOrTx, id: number, input: GestiuneModificata) {
  if (!await gasesteGestiune(db, id)) return refuz(404, 'Gestiunea nu există.')
  if (!await userExista(db, input.userid)) return refuz(400, 'Utilizatorul ales nu există.')
  if (Object.values(input).some(v => v !== undefined))
    await db.update(gestiuni).set(input).where(eq(gestiuni.id, id))
  return ok((await gasesteGestiune(db, id))!)
}

/** Hard delete only for a gestiune nothing refers to; otherwise it must be deactivated. */
export async function stergeGestiune(db: DbOrTx, id: number) {
  if (!await gasesteGestiune(db, id)) return refuz(404, 'Gestiunea nu există.')
  const folosit = await Promise.all([
    db.select({ id: operatiuni.id }).from(operatiuni).where(eq(operatiuni.idgestiune, id)).limit(1),
    db.select({ id: tranzactii.id }).from(tranzactii).where(eq(tranzactii.id_gestiune, id)).limit(1),
    db.select({ id: materiale.id }).from(materiale).where(eq(materiale.idgestiune, id)).limit(1),
    db.select({ id: categorii.id }).from(categorii).where(eq(categorii.idgestiune, id)).limit(1),
  ])
  if (folosit.some(r => r.length)) return refuz(409, 'Gestiunea are documente, materiale sau categorii și nu poate fi ștearsă; dezactivați-o.')
  await db.delete(gestiuni).where(eq(gestiuni.id, id))
  return ok(null)
}
