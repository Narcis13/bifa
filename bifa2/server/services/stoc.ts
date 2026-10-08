/**
 * The one stock query of the app. Documents (average-price exits, stock checks) and reports
 * (balanță, listă de inventariere, fișă de cont) all build on `miscari()`, so they agree on what
 * counts: lines and documents that are both active, in one gestiune, up to a date.
 */
import { sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import type { DbOrTx } from '../utils/db'
import { Dec } from '../../shared/utils/decimal'
import type { StareMaterial, TipMaterial } from '../../shared/schemas/common'

export interface FiltruMiscari {
  idgestiune: number
  tipMaterial?: TipMaterial
  /** One category, or undefined for "toate categoriile" (excludes import placeholders, like legacy `id_categ >= 1`). */
  idcateg?: number
  idloc?: number
  stareMaterial?: StareMaterial
  idreper?: number
  /** Ignore the lines of this document (used while editing it). */
  exceptAntet?: number
}

/**
 * FROM + WHERE for the active movements matching the filter. Aliases: t = tranzactii,
 * op = operatiuni, c = categorii, m = materiale, td = tipuridocumente. All values are bound parameters.
 */
export function miscari(f: FiltruMiscari): SQL {
  const conds: SQL[] = [
    sql`op.stare = 'activ'`,
    sql`t.stare = 'activ'`,
    sql`t.id_gestiune = ${f.idgestiune}`,
  ]
  if (f.tipMaterial) conds.push(sql`t.tip_material = ${f.tipMaterial}`)
  if (f.idcateg !== undefined) conds.push(sql`t.id_categ = ${f.idcateg}`)
  else conds.push(sql`c.lipsa_import = false`)
  if (f.idloc !== undefined) conds.push(sql`t.id_locdispunere = ${f.idloc}`)
  if (f.stareMaterial) conds.push(sql`t.stare_material = ${f.stareMaterial}`)
  if (f.idreper !== undefined) conds.push(sql`t.id_reper = ${f.idreper}`)
  if (f.exceptAntet !== undefined) conds.push(sql`t.idAntet <> ${f.exceptAntet}`)
  return sql`FROM tranzactii t
    JOIN operatiuni op ON op.id = t.idAntet
    JOIN categorii c ON c.id = t.id_categ
    JOIN materiale m ON m.id = t.id_reper
    JOIN tipuridocumente td ON td.id = op.idtipoperatiuni
    WHERE ${sql.join(conds, sql` AND `)}`
}

export async function rows<T>(db: DbOrTx, query: SQL): Promise<T[]> {
  const [result] = (await db.execute(query)) as unknown as [T[]]
  return result
}

export interface StocMaterial {
  id_reper: number
  denumire: string
  um: string
  cod_import: string | null
  stare_material: StareMaterial
  stoc: string
  valoarestoc: string
  pretmediu: string
}

/**
 * Stock at average price for one place and category on a date, per material and state
 * (legacy `stocPretMediu`, now also filtering inactive lines and future documents).
 */
export async function stocPretMediu(db: DbOrTx, f: FiltruMiscari & { idloc: number, idcateg: number, data: string }) {
  return rows<StocMaterial>(db, sql`
    SELECT t.id_reper, m.denumire, m.um, m.cod_import, t.stare_material,
      SUM(t.cantitate_debit - t.cantitate_credit) AS stoc,
      SUM(t.debit - t.credit) AS valoarestoc,
      ROUND(SUM(t.debit - t.credit) / SUM(t.cantitate_debit - t.cantitate_credit), 4) AS pretmediu
    ${miscari(f)} AND op.data <= ${f.data}
    GROUP BY t.id_reper, m.denumire, m.um, m.cod_import, t.stare_material
    HAVING stoc > 0
    ORDER BY m.denumire`)
}

export interface StocGrupa {
  id_gestiune: number
  id_locdispunere: number
  id_categ: number
  id_reper: number
  tip_material: TipMaterial
  stare_material: StareMaterial
  cantitate: string
  valoare: string
}

/** Stock per (gestiune, loc, categorie, material, tip, stare) on a date, all gestiuni. Used by db:verify. */
export async function stocPeGrupe(db: DbOrTx, data: string) {
  return rows<StocGrupa>(db, sql`
    SELECT t.id_gestiune, t.id_locdispunere, t.id_categ, t.id_reper, t.tip_material, t.stare_material,
      SUM(t.cantitate_debit - t.cantitate_credit) AS cantitate,
      SUM(t.debit - t.credit) AS valoare
    FROM tranzactii t JOIN operatiuni op ON op.id = t.idAntet
    WHERE op.stare = 'activ' AND t.stare = 'activ' AND op.data <= ${data}
    GROUP BY t.id_gestiune, t.id_locdispunere, t.id_categ, t.id_reper, t.tip_material, t.stare_material`)
}

/**
 * Locks and reads the stock of one group on a date, inside a transaction. The `FOR UPDATE`
 * locks the group's movement rows so two concurrent exits cannot both take the same stock.
 */
export async function stocGrupaPentruIesire(tx: DbOrTx, k: {
  idgestiune: number
  idloc: number
  idcateg: number
  idreper: number
  stareMaterial: StareMaterial
  tipMaterial: TipMaterial
  data: string
  exceptAntet?: number
}) {
  const locked = await rows<{ cantitate: string, valoare: string }>(tx, sql`
    SELECT t.cantitate_debit - t.cantitate_credit AS cantitate, t.debit - t.credit AS valoare
    FROM tranzactii t JOIN operatiuni op ON op.id = t.idAntet
    WHERE t.id_gestiune = ${k.idgestiune} AND t.id_locdispunere = ${k.idloc} AND t.id_categ = ${k.idcateg}
      AND t.id_reper = ${k.idreper} AND t.stare_material = ${k.stareMaterial} AND t.tip_material = ${k.tipMaterial}
      AND t.stare = 'activ' AND op.stare = 'activ' AND op.data <= ${k.data}
      ${k.exceptAntet !== undefined ? sql`AND t.idAntet <> ${k.exceptAntet}` : sql``}
    FOR UPDATE`)
  let cantitate = 0n
  let valoare = 0n
  for (const r of locked) {
    cantitate += Dec.from(r.cantitate)
    valoare += Dec.from(r.valoare)
  }
  return { cantitate, valoare }
}
