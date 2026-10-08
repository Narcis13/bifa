import { and, asc, eq, ne, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/mysql-core'
import { categorii, conturi, gestiuni, tranzactii } from '../database/schema'
import type { DbOrTx } from '../utils/db'
import type { CategorieModificata, CategorieNoua, CategoriiQuery } from '../../shared/schemas/categorii'
import { ok, refuz } from './utilizatori'

const contChelt = alias(conturi, 'cont_chelt')

const afisare = (c: typeof conturi | typeof contChelt) => sql<string | null>`concat(${c.cont}, ' ', ${c.denumire})`

/** Categories with the gestiune name and the stock / expense accounts as "cont denumire" strings. */
export function listaCategorii(db: DbOrTx, filtre: CategoriiQuery & { id?: number } = {}) {
  return db.select({
    id: categorii.id,
    denumire: categorii.denumire,
    idgestiune: categorii.idgestiune,
    gestiune: gestiuni.denumire,
    tipmaterial: categorii.tipmaterial,
    idcont: categorii.idcont,
    cont: afisare(conturi),
    idcontchelt: categorii.idcontchelt,
    contcheltuiala: afisare(contChelt),
    info: categorii.info,
    lipsa_import: categorii.lipsa_import,
    stare: categorii.stare,
  })
    .from(categorii)
    .innerJoin(gestiuni, eq(gestiuni.id, categorii.idgestiune))
    .leftJoin(conturi, eq(conturi.id, categorii.idcont))
    .leftJoin(contChelt, eq(contChelt.id, categorii.idcontchelt))
    .where(and(
      filtre.id ? eq(categorii.id, filtre.id) : undefined,
      filtre.idgestiune ? eq(categorii.idgestiune, filtre.idgestiune) : undefined,
      filtre.tipmaterial ? eq(categorii.tipmaterial, filtre.tipmaterial) : undefined,
      filtre.stare ? eq(categorii.stare, filtre.stare) : undefined,
    ))
    .orderBy(asc(gestiuni.denumire), asc(categorii.denumire))
}

export async function gasesteCategorie(db: DbOrTx, id: number) {
  const [row] = await db.select().from(categorii).where(eq(categorii.id, id))
  return row
}

async function listat(db: DbOrTx, id: number) {
  const [row] = await listaCategorii(db, { id })
  return row!
}

async function contExista(db: DbOrTx, id: number | null | undefined) {
  if (id === null || id === undefined) return true
  const [c] = await db.select({ id: conturi.id }).from(conturi).where(eq(conturi.id, id))
  return !!c
}

/** Checks shared by create and update (`efectiv` = values after the change); returns a refusal or undefined. */
async function valideaza(db: DbOrTx, input: CategorieModificata, efectiv: { denumire: string, idgestiune: number }, idCurent?: number) {
  const [g] = await db.select({ id: gestiuni.id }).from(gestiuni).where(eq(gestiuni.id, efectiv.idgestiune))
  if (!g) return refuz(400, 'Gestiunea aleasă nu există.')
  if (!await contExista(db, input.idcont) || !await contExista(db, input.idcontchelt))
    return refuz(400, 'Contul ales nu există.')
  const [dublu] = await db.select({ id: categorii.id }).from(categorii)
    .where(and(
      eq(categorii.idgestiune, efectiv.idgestiune),
      eq(categorii.denumire, efectiv.denumire),
      idCurent ? ne(categorii.id, idCurent) : undefined,
    )).limit(1)
  if (dublu) return refuz(409, 'Există deja o categorie cu această denumire în gestiunea aleasă.')
}

export async function adaugaCategorie(db: DbOrTx, input: CategorieNoua) {
  const eroare = await valideaza(db, input, input)
  if (eroare) return eroare
  const [r] = await db.insert(categorii).values(input).$returningId()
  return ok(await listat(db, r!.id))
}

export async function modificaCategorie(db: DbOrTx, id: number, input: CategorieModificata) {
  const curenta = await gasesteCategorie(db, id)
  if (!curenta) return refuz(404, 'Categoria nu există.')
  if (curenta.lipsa_import && input.stare === 'inactiv')
    return refuz(409, 'Categoria a fost creată la import și nu poate fi dezactivată.')
  const mutata = (input.idgestiune !== undefined && input.idgestiune !== curenta.idgestiune)
    || (input.tipmaterial !== undefined && input.tipmaterial !== curenta.tipmaterial)
  if (mutata) {
    const [folosita] = await db.select({ id: tranzactii.id }).from(tranzactii).where(eq(tranzactii.id_categ, id)).limit(1)
    if (folosita) return refuz(409, 'Categoria are deja mișcări; gestiunea și tipul de material nu mai pot fi schimbate.')
  }
  const eroare = await valideaza(db, input, { denumire: input.denumire ?? curenta.denumire, idgestiune: input.idgestiune ?? curenta.idgestiune }, id)
  if (eroare) return eroare
  if (Object.values(input).some(v => v !== undefined))
    await db.update(categorii).set(input).where(eq(categorii.id, id))
  return ok(await listat(db, id))
}

/** "Delete" = deactivate, as in the legacy app: history keeps pointing at the category. */
export async function dezactiveazaCategorie(db: DbOrTx, id: number) {
  const r = await modificaCategorie(db, id, { stare: 'inactiv' })
  return r.ok ? ok(null) : r
}
