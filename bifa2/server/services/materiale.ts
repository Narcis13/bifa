import { and, asc, count, desc, eq, like, ne, or, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { materiale, utilizatori } from '../database/schema'
import type { DbOrTx } from '../utils/db'
import type { MaterialInput, MaterialPatch, MaterialeQuery } from '../../shared/schemas/materiale'

const creatDe = sql<string | null>`coalesce(${utilizatori.name}, ${utilizatori.username})`

const coloane = {
  id: materiale.id,
  denumire: materiale.denumire,
  um: materiale.um,
  pretpredefinit: materiale.pretpredefinit,
  idgestiune: materiale.idgestiune,
  iduser: materiale.iduser,
  cod_import: materiale.cod_import,
  stare: materiale.stare,
  creat_de: creatDe.as('creat_de'),
  created_at: materiale.created_at,
  updated_at: materiale.updated_at,
}

const sortCols = {
  id: materiale.id,
  denumire: materiale.denumire,
  um: materiale.um,
  pretpredefinit: materiale.pretpredefinit,
  cod_import: materiale.cod_import,
  creat_de: creatDe,
  stare: materiale.stare,
} as const

/** Escapes LIKE wildcards in user input. */
function escapeLike(s: string) {
  return s.replace(/[\\%_]/g, c => `\\${c}`)
}

/** Paged, searchable list of one gestiune's materials. Search: name or import code (LIKE) or exact id. */
export async function listaMateriale(db: DbOrTx, opts: MaterialeQuery) {
  const conds: (SQL | undefined)[] = [eq(materiale.idgestiune, opts.idgestiune)]
  if (opts.stare !== 'toate') conds.push(eq(materiale.stare, opts.stare))
  const q = opts.q?.trim()
  if (q) {
    const pattern = `%${escapeLike(q)}%`
    conds.push(or(
      like(materiale.denumire, pattern),
      like(materiale.cod_import, pattern),
      /^\d{1,10}$/.test(q) ? eq(materiale.id, Number(q)) : undefined,
    ))
  }
  const where = and(...conds)

  const dir = opts.sortOrder === -1 ? desc : asc
  const [rows, [tot]] = await Promise.all([
    db.select(coloane).from(materiale)
      .leftJoin(utilizatori, eq(utilizatori.id, materiale.iduser))
      .where(where)
      .orderBy(dir(sortCols[opts.sortField]), asc(materiale.id))
      .limit(opts.rows)
      .offset((opts.page - 1) * opts.rows),
    db.select({ n: count() }).from(materiale).where(where),
  ])
  return { rows, total: Number(tot?.n ?? 0) }
}

export async function gasesteMaterial(db: DbOrTx, id: number) {
  const [row] = await db.select(coloane).from(materiale)
    .leftJoin(utilizatori, eq(utilizatori.id, materiale.iduser))
    .where(eq(materiale.id, id))
  return row
}

/** Another ACTIVE material of the gestiune with the same name (the DB collation ignores case; ă â î ș ț stay distinct letters in the Romanian collation). */
export async function gasesteDuplicat(db: DbOrTx, idgestiune: number, denumire: string, excludeId?: number) {
  const [row] = await db.select({ id: materiale.id, denumire: materiale.denumire }).from(materiale)
    .where(and(
      eq(materiale.idgestiune, idgestiune),
      eq(materiale.stare, 'activ'),
      eq(materiale.denumire, denumire.trim()),
      excludeId ? ne(materiale.id, excludeId) : undefined,
    ))
    .orderBy(asc(materiale.id))
    .limit(1)
  return row
}

async function avertismenteDuplicat(db: DbOrTx, idgestiune: number, denumire: string, excludeId?: number) {
  const d = await gasesteDuplicat(db, idgestiune, denumire, excludeId)
  return d ? [`Există deja un material activ cu această denumire în gestiune (cod ${d.id}).`] : []
}

/** Creates a material; a same-name active material only produces a warning. */
export async function adaugaMaterial(db: DbOrTx, input: MaterialInput & { iduser: number }) {
  const [r] = await db.insert(materiale).values({
    idgestiune: input.idgestiune,
    iduser: input.iduser,
    denumire: input.denumire,
    um: input.um,
    pretpredefinit: input.pretpredefinit,
    cod_import: input.cod_import ?? null,
    stare: input.stare,
  }).$returningId()
  const material = (await gasesteMaterial(db, r!.id))!
  const avertismente = material.stare === 'activ'
    ? await avertismenteDuplicat(db, material.idgestiune, material.denumire, material.id)
    : []
  return { material, avertismente }
}

/** Updates a material (never deleted: lines reference it). Warns when a rename/reactivation creates a duplicate. */
export async function modificaMaterial(db: DbOrTx, id: number, input: MaterialPatch) {
  const inainte = await gasesteMaterial(db, id)
  if (!inainte) return undefined
  const set = Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined)) as MaterialPatch
  if (Object.keys(set).length) await db.update(materiale).set(set).where(eq(materiale.id, id))
  const material = (await gasesteMaterial(db, id))!
  const schimbat = material.denumire !== inainte.denumire || (inainte.stare === 'inactiv' && material.stare === 'activ')
  const avertismente = material.stare === 'activ' && schimbat
    ? await avertismenteDuplicat(db, material.idgestiune, material.denumire, id)
    : []
  return { material, avertismente }
}

/** Next code after `cod`: keeps the prefix and zero padding of a trailing number ('MAT-0099' -> 'MAT-0100'). */
export function urmatorulCod(cod: string | null | undefined): string | null {
  const m = /^(.*?)(\d+)$/.exec((cod ?? '').trim())
  if (!m) return null
  const [, prefix, cifre] = m
  const urmator = (BigInt(cifre!) + 1n).toString().padStart(cifre!.length, '0')
  return `${prefix}${urmator}`
}

/** Import code of the gestiune's most recently added active material that has one, plus a suggestion for the next. */
export async function ultimulCod(db: DbOrTx, idgestiune: number) {
  const [row] = await db.select({ id: materiale.id, cod_import: materiale.cod_import }).from(materiale)
    .where(and(
      eq(materiale.idgestiune, idgestiune),
      eq(materiale.stare, 'activ'),
      sql`${materiale.cod_import} is not null and trim(${materiale.cod_import}) <> ''`,
    ))
    .orderBy(desc(materiale.id))
    .limit(1)
  const cod = row?.cod_import?.trim() ?? null
  return { idmaterial: row?.id ?? null, ultimulCod: cod, urmatorulCod: urmatorulCod(cod) }
}
