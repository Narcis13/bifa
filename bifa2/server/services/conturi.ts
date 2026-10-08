import { and, asc, count, eq, like, ne, or } from 'drizzle-orm'
import { categorii, conturi } from '../database/schema'
import type { DbOrTx } from '../utils/db'
import type { AnaliticNou, ConturiQuery } from '../../shared/schemas/conturi'
import { ok, refuz } from './utilizatori'

/** Escapes LIKE wildcards so user input matches literally. */
const literal = (s: string) => s.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')

/** Row 'cont = %' is the importer's placeholder for "all accounts" and is never shown. */
const vizibile = ne(conturi.cont, '%')

/** Searches by account code or name, paginated (page is 1-based). */
export async function cautaConturi(db: DbOrTx, query: Partial<ConturiQuery> = {}) {
  const page = query.page ?? 1
  const rows = query.rows ?? 50
  const q = query.q?.trim()
  const where = and(
    vizibile,
    q ? or(like(conturi.cont, `%${literal(q)}%`), like(conturi.denumire, `%${literal(q)}%`)) : undefined,
    query.analitice === '1' ? eq(conturi.tip, 'N') : undefined,
  )
  const [tot] = await db.select({ n: count() }).from(conturi).where(where)
  const lista = await db.select().from(conturi).where(where)
    .orderBy(asc(conturi.cont), asc(conturi.id))
    .limit(rows)
    .offset((page - 1) * rows)
  return { rows: lista, total: Number(tot?.n ?? 0) }
}

export async function gasesteCont(db: DbOrTx, id: number) {
  const [row] = await db.select().from(conturi).where(eq(conturi.id, id))
  return row
}

/**
 * Adds an analytic account under a synthetic one: cont = parent cont + suffix, tip 'N',
 * nivel = parent nivel + 1. The parent must be a lowest-level synthetic account (no synthetic children).
 */
export async function adaugaAnalitic(db: DbOrTx, input: AnaliticNou) {
  const parinte = await gasesteCont(db, input.idsintetic)
  if (!parinte || parinte.cont === '%') return refuz(404, 'Contul sintetic nu există.')
  if (parinte.tip === 'N') return refuz(400, 'Un cont analitic nu poate avea alt cont analitic sub el.')
  if (parinte.nivel >= 3) return refuz(400, 'Nu se pot adăuga conturi analitice la acest nivel.')
  const [copil] = await db.select({ id: conturi.id }).from(conturi)
    .where(and(eq(conturi.sintetic, parinte.cont), ne(conturi.tip, 'N'))).limit(1)
  if (copil) return refuz(400, 'Contul are subconturi sintetice; alegeți contul de la nivelul cel mai de jos.')
  const cont = `${parinte.cont}${input.sufix}`
  if (cont.length > 35) return refuz(400, 'Codul contului rezultat depășește 35 de caractere.')
  const [dublu] = await db.select({ id: conturi.id }).from(conturi).where(eq(conturi.cont, cont)).limit(1)
  if (dublu) return refuz(409, `Contul ${cont} există deja.`)
  const [r] = await db.insert(conturi).values({
    cont,
    tip: 'N',
    denumire: input.denumire,
    sintetic: parinte.cont,
    nivel: parinte.nivel + 1,
  }).$returningId()
  return ok((await gasesteCont(db, r!.id))!)
}

/** Only user-created analytic accounts (tip 'N') can be deleted, and only while no category uses them. */
export async function stergeCont(db: DbOrTx, id: number) {
  const cont = await gasesteCont(db, id)
  if (!cont) return refuz(404, 'Contul nu există.')
  if (cont.tip !== 'N') return refuz(400, 'Doar conturile analitice create de utilizatori pot fi șterse.')
  const [folosit] = await db.select({ id: categorii.id }).from(categorii)
    .where(or(eq(categorii.idcont, id), eq(categorii.idcontchelt, id))).limit(1)
  if (folosit) return refuz(409, 'Contul este folosit de una sau mai multe categorii și nu poate fi șters.')
  await db.delete(conturi).where(eq(conturi.id, id))
  return ok(null)
}
