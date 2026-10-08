/**
 * Documents (operatiuni + tranzactii). A document and all its lines are written in one
 * transaction; editing keeps the document id, soft-deactivates the previous lines and writes the
 * new ones, so nothing is ever hard-deleted. Exits and transfers take stock at average price and
 * are checked against the stock available on the document date, under row locks.
 */
import { and, eq, inArray, ne, sql } from 'drizzle-orm'
import { categorii, locuri, materiale, operatiuni, tipuridocumente, tranzactii } from '../database/schema'
import type { NewTranzactie } from '../database/schema'
import type { DbOrTx } from '../utils/db'
import { Dec } from '../../shared/utils/decimal'
import type { DocumentInput, LinieDocumentInput } from '../../shared/schemas/documente'
import { rows, stocGrupaPentruIesire } from './stoc'

/** Business-rule failure with an HTTP status and a Romanian message (mapped by the API layer). */
export class EroareDocument extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export interface DocumentSalvat {
  id: number
  avertismente: string[]
}

type Tip = 'i' | 'e' | 't'

export async function salveazaDocument(db: DbOrTx, input: DocumentInput, idExistent?: number): Promise<DocumentSalvat> {
  return db.transaction(async (tx) => {
    const [tip] = await tx.select().from(tipuridocumente).where(eq(tipuridocumente.id, input.idtipoperatiuni))
    if (!tip) throw new EroareDocument(422, 'Tipul de document nu există.')

    let idDoc: number
    if (idExistent !== undefined) {
      const [doc] = await tx.select().from(operatiuni).where(eq(operatiuni.id, idExistent)).for('update')
      if (!doc) throw new EroareDocument(404, 'Documentul nu există.')
      if (doc.idgestiune !== input.idgestiune) throw new EroareDocument(409, 'Documentul aparține altei gestiuni.')
      if (doc.stare !== 'activ') throw new EroareDocument(409, 'Documentul este invalidat și nu mai poate fi modificat.')
      await tx.update(operatiuni)
        .set({ idtipoperatiuni: input.idtipoperatiuni, data: input.data, nrdoc: input.nrdoc })
        .where(eq(operatiuni.id, idExistent))
      await tx.update(tranzactii).set({ stare: 'inactiv' })
        .where(and(eq(tranzactii.idAntet, idExistent), eq(tranzactii.stare, 'activ')))
      idDoc = idExistent
    }
    else {
      const [r] = await tx.insert(operatiuni).values({
        idtipoperatiuni: input.idtipoperatiuni,
        data: input.data,
        nrdoc: input.nrdoc,
        idgestiune: input.idgestiune,
      }).$returningId()
      idDoc = r!.id
    }

    const linii = await construiesteLinii(tx, input, tip.tip, idDoc, idExistent)
    await tx.insert(tranzactii).values(linii)

    return { id: idDoc, avertismente: await avertismenteDocument(tx, input, idDoc) }
  })
}

async function construiesteLinii(tx: DbOrTx, input: DocumentInput, tip: Tip, idAntet: number, exceptAntet?: number) {
  const idsMat = [...new Set(input.linii.map(l => l.idreper))]
  const mats = await tx.select({ id: materiale.id, denumire: materiale.denumire, um: materiale.um, idgestiune: materiale.idgestiune })
    .from(materiale).where(inArray(materiale.id, idsMat))
  const matById = new Map(mats.map(m => [m.id, m]))
  for (const id of idsMat) {
    const m = matById.get(id)
    if (!m || m.idgestiune !== input.idgestiune) throw new EroareDocument(422, `Materialul cu codul ${id} nu aparține gestiunii.`)
  }

  const pozitii = input.linii.flatMap(l => [l.sursa, l.destinatie]).filter(p => p !== undefined)
  const idsCateg = [...new Set(pozitii.map(p => p.idcateg))]
  const idsLoc = [...new Set(pozitii.map(p => p.idloc))]
  const categs = idsCateg.length ? await tx.select({ id: categorii.id, idgestiune: categorii.idgestiune }).from(categorii).where(inArray(categorii.id, idsCateg)) : []
  for (const id of idsCateg) {
    if (categs.find(c => c.id === id)?.idgestiune !== input.idgestiune) throw new EroareDocument(422, `Categoria cu codul ${id} nu aparține gestiunii.`)
  }
  const locs = idsLoc.length ? await tx.select({ id: locuri.id }).from(locuri).where(inArray(locuri.id, idsLoc)) : []
  for (const id of idsLoc) {
    if (!locs.some(l => l.id === id)) throw new EroareDocument(422, `Locul de dispunere cu codul ${id} nu există.`)
  }

  // Remaining stock per source group, consumed line by line within this document.
  const ramas = new Map<string, { cantitate: bigint, valoare: bigint }>()
  const out: NewTranzactie[] = []
  const comun = (l: LinieDocumentInput) => ({
    idAntet,
    id_reper: l.idreper,
    id_gestiune: input.idgestiune,
    um: matById.get(l.idreper)!.um,
    tip_material: input.tipMaterial,
  })

  for (const [i, l] of input.linii.entries()) {
    const nr = `Linia ${i + 1}`
    const cantitate = Dec.from(l.cantitate)

    if (tip === 'i') {
      if (!l.destinatie) throw new EroareDocument(422, `${nr}: alegeți locul, categoria și starea pentru intrare.`)
      if (l.pret === undefined) throw new EroareDocument(422, `${nr}: prețul unitar este obligatoriu la intrare.`)
      const valoare = Dec.toFixed(Dec.mul(cantitate, Dec.from(l.pret)), 4)
      out.push({ ...comun(l), ...pozitie(l.destinatie), cantitate_debit: l.cantitate, pret: l.pret, debit: valoare })
      continue
    }

    if (!l.sursa) throw new EroareDocument(422, `${nr}: alegeți locul, categoria și starea de unde iese materialul.`)
    if (tip === 't' && !l.destinatie) throw new EroareDocument(422, `${nr}: alegeți locul, categoria și starea de destinație.`)

    const cheie = [l.sursa.idloc, l.sursa.idcateg, l.idreper, l.sursa.stareMaterial].join('|')
    let stoc = ramas.get(cheie)
    if (!stoc) {
      stoc = await stocGrupaPentruIesire(tx, {
        idgestiune: input.idgestiune,
        idloc: l.sursa.idloc,
        idcateg: l.sursa.idcateg,
        idreper: l.idreper,
        stareMaterial: l.sursa.stareMaterial,
        tipMaterial: input.tipMaterial,
        data: input.data,
        exceptAntet,
      })
      ramas.set(cheie, stoc)
    }
    const mat = matById.get(l.idreper)!
    if (stoc.cantitate <= 0n || cantitate > stoc.cantitate) {
      throw new EroareDocument(422, `${nr}: stoc insuficient pentru „${mat.denumire}”: disponibil ${Dec.toFixed(stoc.cantitate > 0n ? stoc.cantitate : 0n, 2)} ${mat.um} la ${input.data}, cerut ${l.cantitate}.`)
    }
    const pret = Dec.round(Dec.div(stoc.valoare, stoc.cantitate), 4)
    // Taking the whole remaining quantity takes the whole remaining value (no rounding residue).
    const valoare = cantitate === stoc.cantitate ? stoc.valoare : Dec.round(Dec.mul(cantitate, pret), 4)
    stoc.cantitate -= cantitate
    stoc.valoare -= valoare
    const [pretS, valS] = [Dec.toFixed(pret, 4), Dec.toFixed(valoare, 4)]

    out.push({ ...comun(l), ...pozitie(l.sursa), cantitate_credit: l.cantitate, pret: pretS, credit: valS })
    if (tip === 't') out.push({ ...comun(l), ...pozitie(l.destinatie!), cantitate_debit: l.cantitate, pret: pretS, debit: valS })
  }
  return out
}

function pozitie(p: NonNullable<LinieDocumentInput['sursa']>) {
  return { id_locdispunere: p.idloc, id_categ: p.idcateg, stare_material: p.stareMaterial }
}

/** Non-blocking warnings: duplicate document number (same gestiune, type and year). */
async function avertismenteDocument(tx: DbOrTx, input: DocumentInput, idDoc: number) {
  const dup = await tx.select({ id: operatiuni.id, data: operatiuni.data }).from(operatiuni).where(and(
    eq(operatiuni.idgestiune, input.idgestiune),
    eq(operatiuni.idtipoperatiuni, input.idtipoperatiuni),
    eq(operatiuni.nrdoc, input.nrdoc),
    eq(operatiuni.stare, 'activ'),
    ne(operatiuni.id, idDoc),
    sql`YEAR(${operatiuni.data}) = YEAR(${input.data})`,
  ))
  return dup.length
    ? [`Mai există ${dup.length === 1 ? 'un document activ' : `${dup.length} documente active`} de același tip cu numărul „${input.nrdoc}” în ${input.data.slice(0, 4)} (nr. intern ${dup.map(d => d.id).join(', ')}).`]
    : []
}

/** Soft delete: the document and its lines stay in the database, excluded from stock and reports. */
export async function invalideazaDocument(db: DbOrTx, id: number) {
  const r = await db.update(operatiuni).set({ stare: 'inactiv' }).where(and(eq(operatiuni.id, id), eq(operatiuni.stare, 'activ')))
  return (r[0] as { affectedRows: number }).affectedRows > 0
}

export async function antetDocument(db: DbOrTx, id: number) {
  const [doc] = await db.select({
    id: operatiuni.id,
    idgestiune: operatiuni.idgestiune,
    idtipoperatiuni: operatiuni.idtipoperatiuni,
    tip: tipuridocumente.tip,
    denumireTip: tipuridocumente.denumire,
    denumireScurta: tipuridocumente.denumire_scurta,
    data: operatiuni.data,
    nrdoc: operatiuni.nrdoc,
    stare: operatiuni.stare,
    created_at: operatiuni.created_at,
    updated_at: operatiuni.updated_at,
  }).from(operatiuni)
    .innerJoin(tipuridocumente, eq(tipuridocumente.id, operatiuni.idtipoperatiuni))
    .where(eq(operatiuni.id, id))
  return doc
}

/** Document header and active lines, with names for display, printing and editing. */
export async function citesteDocument(db: DbOrTx, id: number) {
  const doc = await antetDocument(db, id)
  if (!doc) return undefined
  const linii = await rows<{
    id: number
    id_reper: number
    material: string
    cod_import: string | null
    um: string
    id_categ: number
    categorie: string
    id_locdispunere: number
    loc: string
    stare_material: 'NOU' | 'FOLOSIT' | 'CASARE'
    tip_material: 'M' | 'OB' | 'MF'
    cantitate_debit: string
    cantitate_credit: string
    pret: string
    debit: string
    credit: string
  }>(db, sql`
    SELECT t.id, t.id_reper, m.denumire AS material, m.cod_import, t.um, t.id_categ, c.denumire AS categorie,
      t.id_locdispunere, l.denumire AS loc, t.stare_material, t.tip_material,
      t.cantitate_debit, t.cantitate_credit, t.pret, t.debit, t.credit
    FROM tranzactii t
    JOIN materiale m ON m.id = t.id_reper
    JOIN categorii c ON c.id = t.id_categ
    JOIN locuri l ON l.id = t.id_locdispunere
    WHERE t.idAntet = ${id} AND t.stare = 'activ'
    ORDER BY t.id`)
  const total = (k: 'debit' | 'credit') => Dec.toFixed(Dec.add(...linii.map(l => Dec.from(l[k]))), 4)
  return {
    ...doc,
    tipMaterial: linii[0]?.tip_material ?? 'M',
    linii,
    totalDebit: total('debit'),
    totalCredit: total('credit'),
  }
}

/** Documents in an interval, with totals; documents without lines are listed too. */
export async function listaDocumente(db: DbOrTx, f: { idgestiune: number, inceput: string, sfarsit: string, stare: 'activ' | 'inactiv' | 'toate' }) {
  return rows<{
    id: number
    idtipoperatiuni: number
    tip: Tip
    denumireScurta: string
    denumireTip: string
    data: string
    nrdoc: string
    stare: 'activ' | 'inactiv'
    nrLinii: number
    tipMaterial: string | null
    debit: string
    credit: string
    updated_at: string
  }>(db, sql`
    SELECT op.id, op.idtipoperatiuni, td.tip, td.denumire_scurta AS denumireScurta, td.denumire AS denumireTip,
      op.data, op.nrdoc, op.stare, op.updated_at,
      COUNT(t.id) AS nrLinii, MIN(t.tip_material) AS tipMaterial,
      IFNULL(SUM(t.debit), 0) AS debit, IFNULL(SUM(t.credit), 0) AS credit
    FROM operatiuni op
    JOIN tipuridocumente td ON td.id = op.idtipoperatiuni
    LEFT JOIN tranzactii t ON t.idAntet = op.id AND t.stare = 'activ'
    WHERE op.idgestiune = ${f.idgestiune} AND op.data >= ${f.inceput} AND op.data <= ${f.sfarsit}
      ${f.stare === 'toate' ? sql`` : sql`AND op.stare = ${f.stare}`}
    GROUP BY op.id, op.idtipoperatiuni, td.tip, td.denumire_scurta, td.denumire, op.data, op.nrdoc, op.stare, op.updated_at
    ORDER BY op.data DESC, op.id DESC`)
}

/** Registry total of a document list (exact decimals). */
export function totaluriLista(docs: { debit: string, credit: string }[]) {
  return {
    debit: Dec.toFixed(Dec.add(...docs.map(d => Dec.from(d.debit))), 4),
    credit: Dec.toFixed(Dec.add(...docs.map(d => Dec.from(d.credit))), 4),
  }
}
