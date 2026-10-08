/**
 * Report data. The aggregates mirror the legacy SQL in nbifa-master/server/api/controllers/balante.js
 * (same CASE/SUM structure, same HAVING), on top of the shared movement filter `miscari()`.
 */
import { sql } from 'drizzle-orm'
import { Dec } from '../../shared/utils/decimal'
import type { DbOrTx } from '../utils/db'
import { miscari, rows } from './stoc'
import type { FiltruMiscari } from './stoc'

export interface FiltruRaport extends FiltruMiscari {
  tipMaterial: NonNullable<FiltruMiscari['tipMaterial']>
  datainceput: string
  datasfarsit: string
  /** Also list materials with no stock at both ends of the period (legacy hides them). */
  includeFaraStoc?: boolean
}

export interface LinieBalanta {
  id_reper: number
  denumire: string
  um: string
  stocinitial: string
  ti: string
  te: string
  stocfinal: string
  valoarestocinitial: string
  vi: string
  ve: string
  valoarestoc: string
}

/** Balanța analitică de gestiune: opening stock, entries, exits, closing stock per material. */
export async function balantaAnalitica(db: DbOrTx, f: FiltruRaport) {
  const { datainceput: di, datasfarsit: ds } = f
  const linii = await rows<LinieBalanta>(db, sql`
    SELECT
      t.id_reper, m.denumire, m.um,
      IFNULL(SUM(CASE WHEN op.data < ${di} THEN t.cantitate_debit - t.cantitate_credit END), 0) AS stocinitial,
      IFNULL(SUM(CASE WHEN op.data >= ${di} AND op.data <= ${ds} THEN t.cantitate_debit END), 0) AS ti,
      IFNULL(SUM(CASE WHEN op.data >= ${di} AND op.data <= ${ds} THEN t.cantitate_credit END), 0) AS te,
      IFNULL(SUM(CASE WHEN op.data <= ${ds} THEN t.cantitate_debit - t.cantitate_credit END), 0) AS stocfinal,
      IFNULL(SUM(CASE WHEN op.data < ${di} THEN t.debit - t.credit END), 0) AS valoarestocinitial,
      IFNULL(SUM(CASE WHEN op.data >= ${di} AND op.data <= ${ds} THEN t.debit END), 0) AS vi,
      IFNULL(SUM(CASE WHEN op.data >= ${di} AND op.data <= ${ds} THEN t.credit END), 0) AS ve,
      IFNULL(SUM(CASE WHEN op.data <= ${ds} THEN t.debit - t.credit END), 0) AS valoarestoc
    ${miscari(f)}
    GROUP BY t.id_reper, m.denumire, m.um
    ${f.includeFaraStoc
      ? sql`HAVING stocinitial <> 0 OR stocfinal <> 0 OR ti <> 0 OR te <> 0`
      : sql`HAVING stocinitial > 0 OR stocfinal > 0`}
    ORDER BY m.denumire, t.id_reper`)
  const total = (k: keyof LinieBalanta) => Dec.toFixed(Dec.add(...linii.map(l => Dec.from(String(l[k])))), 4)
  return {
    linii,
    totaluri: {
      valoarestocinitial: total('valoarestocinitial'),
      vi: total('vi'),
      ve: total('ve'),
      valoarestoc: total('valoarestoc'),
    },
  }
}

/** Lista de inventariere: the balance's closing stock, with the unit price valoare / cantitate. */
export async function listaInventariere(db: DbOrTx, f: FiltruRaport) {
  const { linii, totaluri } = await balantaAnalitica(db, f)
  return {
    linii: linii.map(l => ({
      ...l,
      pret: Dec.from(l.stocfinal) === 0n ? '0.0000' : Dec.toFixed(Dec.div(Dec.from(l.valoarestoc), Dec.from(l.stocfinal)), 4),
    })),
    totaluri,
  }
}

export interface MiscareFisa {
  idAntet: number
  data: string
  explicatii: string
  um: string
  cantitate_debit: string
  cantitate_credit: string
  debit: string
  credit: string
  sold_cantitate: string
  sold_valoare: string
}

/** Fișa de cont a unui material: opening balance, movements in the period with running balance, closing. */
export async function fisaCont(db: DbOrTx, f: FiltruRaport & { idreper: number }) {
  const { datainceput: di, datasfarsit: ds } = f
  const [si] = await rows<{ denumire: string, um: string, stocinitial: string, valoarestocinitial: string }>(db, sql`
    SELECT m.denumire, m.um,
      IFNULL(SUM(CASE WHEN op.data < ${di} THEN t.cantitate_debit - t.cantitate_credit END), 0) AS stocinitial,
      IFNULL(SUM(CASE WHEN op.data < ${di} THEN t.debit - t.credit END), 0) AS valoarestocinitial
    ${miscari(f)}
    GROUP BY m.denumire, m.um`)
  const miscariPerioada = await rows<Omit<MiscareFisa, 'sold_cantitate' | 'sold_valoare'>>(db, sql`
    SELECT t.idAntet, op.data, CONCAT(td.denumire_scurta, op.nrdoc) AS explicatii, t.um,
      t.cantitate_debit, t.cantitate_credit, t.debit, t.credit
    ${miscari(f)} AND op.data >= ${di} AND op.data <= ${ds}
    ORDER BY op.data, t.idAntet, t.id`)
  let q = Dec.from(si?.stocinitial ?? '0')
  let v = Dec.from(si?.valoarestocinitial ?? '0')
  const linii: MiscareFisa[] = miscariPerioada.map((m) => {
    q += Dec.from(m.cantitate_debit) - Dec.from(m.cantitate_credit)
    v += Dec.from(m.debit) - Dec.from(m.credit)
    return { ...m, sold_cantitate: Dec.toFixed(q, 2), sold_valoare: Dec.toFixed(v, 4) }
  })
  return {
    material: si ? { denumire: si.denumire, um: si.um } : null,
    soldInitial: { cantitate: Dec.toFixed(Dec.from(si?.stocinitial ?? '0'), 2), valoare: Dec.toFixed(Dec.from(si?.valoarestocinitial ?? '0'), 4) },
    linii,
    soldFinal: { cantitate: Dec.toFixed(q, 2), valoare: Dec.toFixed(v, 4) },
  }
}
