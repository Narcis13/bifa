/**
 * Fixed assets (mijloace fixe) — separate register from materials stock.
 *
 * Legal basis (Romania):
 * - Legea 15/1994 art. 18: linear amortization = entry value × (100% / useful life in years),
 *   applied monthly as entry_value / (years × 12).
 * - HG 2139/2004: classification codes and normal useful-life ranges (stored as durata_luni).
 * - Amortization starts the month AFTER commissioning (common Romanian practice).
 * - Partially/fully amortized assets at registration carry amortizare_initiala.
 */
import { and, asc, count, desc, eq, inArray, like, or, sql } from 'drizzle-orm'
import {
  categorii,
  locuri,
  mfAmortizari,
  mfDocumente,
  mfLinii,
  mijloaceFixe,
  tipuridocumente,
} from '../database/schema'
import type { DbOrTx } from '../utils/db'
import { Dec } from '../../shared/utils/decimal'
import type {
  AmortizareMfInput,
  CasareMfInput,
  InregistrareMfInput,
  TransferMfInput,
} from '../../shared/schemas/mijloace-fixe'

export class EroareMf extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

function lunaUrmatoare(iso: string): { an: number, luna: number } {
  const [y, m] = iso.slice(0, 10).split('-').map(Number)
  if (m === 12) return { an: y! + 1, luna: 1 }
  return { an: y!, luna: m! + 1 }
}

/** First calendar month for which amortization may be posted (month after commissioning). */
export function primaLunaAmortizare(dataPunere: string) {
  return lunaUrmatoare(dataPunere)
}

export function amortizareLunara(valoareIntrare: string, durataLuni: number): string {
  if (durataLuni <= 0) throw new EroareMf(422, 'Durata de amortizare trebuie să fie pozitivă.')
  return Dec.toFixed(Dec.div(Dec.from(valoareIntrare), Dec.from(String(durataLuni))), 4)
}

async function tipDocument(tx: DbOrTx, idtip: number, asteptat: 'i' | 'e' | 't') {
  const [tip] = await tx.select().from(tipuridocumente).where(eq(tipuridocumente.id, idtip))
  if (!tip) throw new EroareMf(422, 'Tipul de document nu există.')
  if (tip.tip !== asteptat) {
    const et = { i: 'intrare', e: 'ieșire (casare)', t: 'transfer' }[asteptat]
    throw new EroareMf(422, `Tipul de document trebuie să fie de tip ${et}.`)
  }
  return tip
}

async function categorieMf(tx: DbOrTx, idcateg: number, idgestiune: number) {
  const [c] = await tx.select().from(categorii).where(eq(categorii.id, idcateg))
  if (!c || c.idgestiune !== idgestiune) throw new EroareMf(422, 'Categoria nu aparține gestiunii.')
  if (c.tipmaterial !== 'MF') throw new EroareMf(422, 'Categoria trebuie să fie de tip mijloace fixe (MF).')
  if (c.stare !== 'activ') throw new EroareMf(422, 'Categoria este inactivă.')
  return c
}

async function locValid(tx: DbOrTx, idloc: number) {
  const [l] = await tx.select().from(locuri).where(eq(locuri.id, idloc))
  if (!l) throw new EroareMf(422, 'Locul de dispunere nu există.')
  if (l.stare !== 'activ') throw new EroareMf(422, 'Locul de dispunere este inactiv.')
  return l
}

/** Cumulative amortization = initial + sum of active monthly postings. */
export async function amortizareCumulata(db: DbOrTx, idmijloc: number, panaLa?: { an: number, luna: number }) {
  const [mf] = await db.select({ amortizare_initiala: mijloaceFixe.amortizare_initiala })
    .from(mijloaceFixe).where(eq(mijloaceFixe.id, idmijloc))
  if (!mf) return '0.0000'
  const cond = [eq(mfAmortizari.idmijloc, idmijloc), eq(mfAmortizari.stare, 'activ')]
  if (panaLa) {
    cond.push(sql`(${mfAmortizari.an} < ${panaLa.an} OR (${mfAmortizari.an} = ${panaLa.an} AND ${mfAmortizari.luna} <= ${panaLa.luna}))`)
  }
  const [r] = await db.select({ s: sql<string>`COALESCE(SUM(${mfAmortizari.suma}), 0)` })
    .from(mfAmortizari).where(and(...cond))
  return Dec.toFixed(Dec.add(Dec.from(mf.amortizare_initiala), Dec.from(r?.s ?? '0')), 4)
}

export async function inregistreazaMf(db: DbOrTx, input: InregistrareMfInput) {
  return db.transaction(async (tx) => {
    await tipDocument(tx, input.idtipoperatiuni, 'i')
    await categorieMf(tx, input.idcateg, input.idgestiune)
    await locValid(tx, input.idloc)

    const [existent] = await tx.select({ id: mijloaceFixe.id }).from(mijloaceFixe).where(and(
      eq(mijloaceFixe.idgestiune, input.idgestiune),
      eq(mijloaceFixe.nr_inventar, input.nr_inventar),
      eq(mijloaceFixe.stare, 'activ'),
    ))
    if (existent) throw new EroareMf(409, `Numărul de inventar ${input.nr_inventar} există deja în gestiune.`)

    const durataLuni = input.durata_ani * 12
    const amortLunara = amortizareLunara(input.valoare_intrare, durataLuni)

    const [doc] = await tx.insert(mfDocumente).values({
      idtipoperatiuni: input.idtipoperatiuni,
      data: input.data,
      nrdoc: input.nrdoc,
      idgestiune: input.idgestiune,
      observatii: input.observatii || null,
    }).$returningId()

    const [mf] = await tx.insert(mijloaceFixe).values({
      nr_inventar: input.nr_inventar,
      denumire: input.denumire,
      caracteristici: input.caracteristici || null,
      idgestiune: input.idgestiune,
      idcateg: input.idcateg,
      idloc: input.idloc,
      cod_clasificare: input.cod_clasificare,
      grupa: input.grupa,
      valoare_intrare: input.valoare_intrare,
      amortizare_initiala: input.amortizare_initiala,
      durata_luni: durataLuni,
      amortizare_lunara: amortLunara,
      data_punere_functiune: input.data_punere_functiune,
      stare_mf: 'in_functiune',
    }).$returningId()

    await tx.insert(mfLinii).values({
      iddocument: doc!.id,
      idmijloc: mf!.id,
      idloc_destinatie: input.idloc,
      valoare: input.valoare_intrare,
    })

    return { id: mf!.id, iddocument: doc!.id, amortizare_lunara: amortLunara, durata_luni: durataLuni }
  })
}

export async function transferaMf(db: DbOrTx, input: TransferMfInput) {
  return db.transaction(async (tx) => {
    await tipDocument(tx, input.idtipoperatiuni, 't')
    await locValid(tx, input.idloc_destinatie)

    const ids = [...new Set(input.idmijloace)]
    const assets = await tx.select().from(mijloaceFixe).where(inArray(mijloaceFixe.id, ids)).for('update')
    if (assets.length !== ids.length) throw new EroareMf(422, 'Unul sau mai multe mijloace fixe nu există.')

    for (const a of assets) {
      if (a.idgestiune !== input.idgestiune) throw new EroareMf(422, `Mijlocul fix ${a.nr_inventar} aparține altei gestiuni.`)
      if (a.stare !== 'activ') throw new EroareMf(422, `Mijlocul fix ${a.nr_inventar} este inactiv.`)
      if (a.stare_mf !== 'in_functiune') throw new EroareMf(422, `Mijlocul fix ${a.nr_inventar} este casat și nu poate fi transferat.`)
      if (a.idloc === input.idloc_destinatie) throw new EroareMf(422, `Mijlocul fix ${a.nr_inventar} se află deja la locul de destinație.`)
    }

    const [doc] = await tx.insert(mfDocumente).values({
      idtipoperatiuni: input.idtipoperatiuni,
      data: input.data,
      nrdoc: input.nrdoc,
      idgestiune: input.idgestiune,
      observatii: input.observatii || null,
    }).$returningId()

    for (const a of assets) {
      await tx.insert(mfLinii).values({
        iddocument: doc!.id,
        idmijloc: a.id,
        idloc_sursa: a.idloc,
        idloc_destinatie: input.idloc_destinatie,
        valoare: a.valoare_intrare,
      })
      await tx.update(mijloaceFixe).set({ idloc: input.idloc_destinatie }).where(eq(mijloaceFixe.id, a.id))
    }

    return { iddocument: doc!.id, transferate: assets.length }
  })
}

export async function caseazaMf(db: DbOrTx, input: CasareMfInput) {
  return db.transaction(async (tx) => {
    await tipDocument(tx, input.idtipoperatiuni, 'e')

    const ids = [...new Set(input.idmijloace)]
    const assets = await tx.select().from(mijloaceFixe).where(inArray(mijloaceFixe.id, ids)).for('update')
    if (assets.length !== ids.length) throw new EroareMf(422, 'Unul sau mai multe mijloace fixe nu există.')

    for (const a of assets) {
      if (a.idgestiune !== input.idgestiune) throw new EroareMf(422, `Mijlocul fix ${a.nr_inventar} aparține altei gestiuni.`)
      if (a.stare !== 'activ') throw new EroareMf(422, `Mijlocul fix ${a.nr_inventar} este inactiv.`)
      if (a.stare_mf !== 'in_functiune') throw new EroareMf(422, `Mijlocul fix ${a.nr_inventar} este deja casat.`)
    }

    const [doc] = await tx.insert(mfDocumente).values({
      idtipoperatiuni: input.idtipoperatiuni,
      data: input.data,
      nrdoc: input.nrdoc,
      idgestiune: input.idgestiune,
      observatii: input.observatii || null,
    }).$returningId()

    for (const a of assets) {
      await tx.insert(mfLinii).values({
        iddocument: doc!.id,
        idmijloc: a.id,
        idloc_sursa: a.idloc,
        valoare: a.valoare_intrare,
      })
      await tx.update(mijloaceFixe).set({
        stare_mf: 'casat',
        data_casare: input.data,
      }).where(eq(mijloaceFixe.id, a.id))
    }

    return { iddocument: doc!.id, casate: assets.length }
  })
}

/**
 * Posts linear amortization for all in-service assets of a gestiune for one calendar month.
 * Skips assets not yet eligible, already posted for that month, or fully amortized.
 */
export async function calculeazaAmortizare(db: DbOrTx, input: AmortizareMfInput, iduser?: number) {
  return db.transaction(async (tx) => {
    const dataCalcul = input.data_calcul
      ?? `${input.an}-${String(input.luna).padStart(2, '0')}-${new Date(input.an, input.luna, 0).getDate()}`

    const assets = await tx.select().from(mijloaceFixe).where(and(
      eq(mijloaceFixe.idgestiune, input.idgestiune),
      eq(mijloaceFixe.stare, 'activ'),
      eq(mijloaceFixe.stare_mf, 'in_functiune'),
    )).for('update')

    let create = 0
    let sarite = 0
    let deja = 0
    const detalii: { idmijloc: number, nr_inventar: string, suma: string }[] = []

    for (const a of assets) {
      const prima = primaLunaAmortizare(a.data_punere_functiune)
      if (input.an < prima.an || (input.an === prima.an && input.luna < prima.luna)) {
        sarite++
        continue
      }
      if (a.data_casare) {
        const [cy, cm] = a.data_casare.slice(0, 10).split('-').map(Number)
        if (input.an > cy! || (input.an === cy && input.luna > cm!)) {
          sarite++
          continue
        }
      }

      const [exista] = await tx.select({ id: mfAmortizari.id }).from(mfAmortizari).where(and(
        eq(mfAmortizari.idmijloc, a.id),
        eq(mfAmortizari.an, input.an),
        eq(mfAmortizari.luna, input.luna),
        eq(mfAmortizari.stare, 'activ'),
      ))
      if (exista) {
        deja++
        continue
      }

      const cumulata = await amortizareCumulata(tx, a.id)
      const ramas = Dec.sub(Dec.from(a.valoare_intrare), Dec.from(cumulata))
      if (ramas <= 0n) {
        sarite++
        continue
      }

      const nominal = Dec.from(a.amortizare_lunara)
      const suma = Dec.toFixed(ramas < nominal ? ramas : nominal, 4)
      await tx.insert(mfAmortizari).values({
        idmijloc: a.id,
        an: input.an,
        luna: input.luna,
        suma,
        data_calcul: dataCalcul,
        iduser: iduser ?? null,
      })
      detalii.push({ idmijloc: a.id, nr_inventar: a.nr_inventar, suma })
      create++
    }

    return { create, deja, sarite, total: assets.length, detalii }
  })
}

/** Soft-invalidates all active amortization postings for a gestiune / month. */
export async function anuleazaAmortizare(db: DbOrTx, idgestiune: number, an: number, luna: number) {
  const ids = await db.select({ id: mfAmortizari.id })
    .from(mfAmortizari)
    .innerJoin(mijloaceFixe, eq(mfAmortizari.idmijloc, mijloaceFixe.id))
    .where(and(
      eq(mijloaceFixe.idgestiune, idgestiune),
      eq(mfAmortizari.an, an),
      eq(mfAmortizari.luna, luna),
      eq(mfAmortizari.stare, 'activ'),
    ))
  if (!ids.length) throw new EroareMf(404, 'Nu există amortizări active pentru această lună.')
  await db.update(mfAmortizari).set({ stare: 'inactiv' })
    .where(inArray(mfAmortizari.id, ids.map(r => r.id)))
  return { anulate: ids.length }
}

/**
 * Invalidates an MF document and reverses its effects when safe:
 * - entry: asset must have no later movements/amortization
 * - transfer: restores previous location from the line
 * - disposal: restores in_functiune
 */
export async function invalideazaDocumentMf(db: DbOrTx, iddocument: number) {
  return db.transaction(async (tx) => {
    const [doc] = await tx.select().from(mfDocumente).where(eq(mfDocumente.id, iddocument)).for('update')
    if (!doc) throw new EroareMf(404, 'Documentul nu există.')
    if (doc.stare !== 'activ') throw new EroareMf(409, 'Documentul este deja invalidat.')

    const [tip] = await tx.select().from(tipuridocumente).where(eq(tipuridocumente.id, doc.idtipoperatiuni))
    const linii = await tx.select().from(mfLinii).where(and(eq(mfLinii.iddocument, iddocument), eq(mfLinii.stare, 'activ')))

    for (const l of linii) {
      const [a] = await tx.select().from(mijloaceFixe).where(eq(mijloaceFixe.id, l.idmijloc)).for('update')
      if (!a) continue

      if (tip?.tip === 'i') {
        const [alte] = await tx.select({ n: count() }).from(mfLinii).where(and(
          eq(mfLinii.idmijloc, a.id),
          eq(mfLinii.stare, 'activ'),
          sql`${mfLinii.iddocument} <> ${iddocument}`,
        ))
        const [amort] = await tx.select({ n: count() }).from(mfAmortizari).where(and(
          eq(mfAmortizari.idmijloc, a.id),
          eq(mfAmortizari.stare, 'activ'),
        ))
        if ((alte?.n ?? 0) > 0 || (amort?.n ?? 0) > 0) {
          throw new EroareMf(409, `Mijlocul fix ${a.nr_inventar} are mișcări sau amortizări ulterioare; documentul de intrare nu poate fi invalidat.`)
        }
        await tx.update(mijloaceFixe).set({ stare: 'inactiv' }).where(eq(mijloaceFixe.id, a.id))
      }
      else if (tip?.tip === 't') {
        if (!l.idloc_sursa) throw new EroareMf(409, 'Linia de transfer nu are loc sursă.')
        if (a.idloc !== l.idloc_destinatie) {
          throw new EroareMf(409, `Mijlocul fix ${a.nr_inventar} a fost mutat ulterior; transferul nu poate fi invalidat.`)
        }
        await tx.update(mijloaceFixe).set({ idloc: l.idloc_sursa }).where(eq(mijloaceFixe.id, a.id))
      }
      else if (tip?.tip === 'e') {
        if (a.stare_mf !== 'casat') throw new EroareMf(409, `Mijlocul fix ${a.nr_inventar} nu mai este casat.`)
        await tx.update(mijloaceFixe).set({ stare_mf: 'in_functiune', data_casare: null }).where(eq(mijloaceFixe.id, a.id))
      }
    }

    await tx.update(mfLinii).set({ stare: 'inactiv' }).where(and(eq(mfLinii.iddocument, iddocument), eq(mfLinii.stare, 'activ')))
    await tx.update(mfDocumente).set({ stare: 'inactiv' }).where(eq(mfDocumente.id, iddocument))
    return { id: iddocument }
  })
}

export async function listaMf(db: DbOrTx, q: {
  idgestiune: number
  q?: string
  stare_mf: 'in_functiune' | 'casat' | 'toate'
  stare: 'activ' | 'inactiv' | 'toate'
  idloc?: number
  idcateg?: number
  page: number
  rows: number
}) {
  const cond = [eq(mijloaceFixe.idgestiune, q.idgestiune)]
  if (q.stare !== 'toate') cond.push(eq(mijloaceFixe.stare, q.stare))
  if (q.stare_mf !== 'toate') cond.push(eq(mijloaceFixe.stare_mf, q.stare_mf))
  if (q.idloc) cond.push(eq(mijloaceFixe.idloc, q.idloc))
  if (q.idcateg) cond.push(eq(mijloaceFixe.idcateg, q.idcateg))
  if (q.q) {
    const likeQ = `%${q.q}%`
    cond.push(or(like(mijloaceFixe.nr_inventar, likeQ), like(mijloaceFixe.denumire, likeQ), like(mijloaceFixe.cod_clasificare, likeQ))!)
  }
  const where = and(...cond)
  const [tot] = await db.select({ n: count() }).from(mijloaceFixe).where(where)
  const rows = await db.select({
    id: mijloaceFixe.id,
    nr_inventar: mijloaceFixe.nr_inventar,
    denumire: mijloaceFixe.denumire,
    cod_clasificare: mijloaceFixe.cod_clasificare,
    grupa: mijloaceFixe.grupa,
    valoare_intrare: mijloaceFixe.valoare_intrare,
    amortizare_initiala: mijloaceFixe.amortizare_initiala,
    amortizare_lunara: mijloaceFixe.amortizare_lunara,
    durata_luni: mijloaceFixe.durata_luni,
    data_punere_functiune: mijloaceFixe.data_punere_functiune,
    data_casare: mijloaceFixe.data_casare,
    stare_mf: mijloaceFixe.stare_mf,
    stare: mijloaceFixe.stare,
    idloc: mijloaceFixe.idloc,
    idcateg: mijloaceFixe.idcateg,
    loc: locuri.denumire,
    categorie: categorii.denumire,
  })
    .from(mijloaceFixe)
    .innerJoin(locuri, eq(mijloaceFixe.idloc, locuri.id))
    .innerJoin(categorii, eq(mijloaceFixe.idcateg, categorii.id))
    .where(where)
    .orderBy(asc(mijloaceFixe.nr_inventar))
    .limit(q.rows)
    .offset((q.page - 1) * q.rows)

  const out = []
  for (const r of rows) {
    const cumulata = await amortizareCumulata(db, r.id)
    const ramas = Dec.toFixed(Dec.sub(Dec.from(r.valoare_intrare), Dec.from(cumulata)), 4)
    out.push({ ...r, amortizare_cumulata: cumulata, valoare_ramasa: ramas })
  }
  return { rows: out, total: tot?.n ?? 0 }
}

export async function citesteMf(db: DbOrTx, id: number) {
  const [r] = await db.select({
    id: mijloaceFixe.id,
    nr_inventar: mijloaceFixe.nr_inventar,
    denumire: mijloaceFixe.denumire,
    caracteristici: mijloaceFixe.caracteristici,
    idgestiune: mijloaceFixe.idgestiune,
    idcateg: mijloaceFixe.idcateg,
    idloc: mijloaceFixe.idloc,
    cod_clasificare: mijloaceFixe.cod_clasificare,
    grupa: mijloaceFixe.grupa,
    valoare_intrare: mijloaceFixe.valoare_intrare,
    amortizare_initiala: mijloaceFixe.amortizare_initiala,
    durata_luni: mijloaceFixe.durata_luni,
    amortizare_lunara: mijloaceFixe.amortizare_lunara,
    data_punere_functiune: mijloaceFixe.data_punere_functiune,
    data_casare: mijloaceFixe.data_casare,
    stare_mf: mijloaceFixe.stare_mf,
    stare: mijloaceFixe.stare,
    loc: locuri.denumire,
    categorie: categorii.denumire,
  })
    .from(mijloaceFixe)
    .innerJoin(locuri, eq(mijloaceFixe.idloc, locuri.id))
    .innerJoin(categorii, eq(mijloaceFixe.idcateg, categorii.id))
    .where(eq(mijloaceFixe.id, id))
  if (!r) return null
  const cumulata = await amortizareCumulata(db, id)
  const durataAni = r.durata_luni / 12
  /** Annual rate (%) = 100 / useful life in years (Legea 15/1994). */
  const cotaAnuala = Dec.toFixed(Dec.div(Dec.from('100'), Dec.from(String(durataAni))), 4)
  return {
    ...r,
    durata_ani: durataAni,
    amortizare_cumulata: cumulata,
    valoare_ramasa: Dec.toFixed(Dec.sub(Dec.from(r.valoare_intrare), Dec.from(cumulata)), 4),
    cota_anuala: cotaAnuala,
  }
}

export async function listaDocumenteMf(db: DbOrTx, q: {
  idgestiune: number
  inceput: string
  sfarsit: string
  stare: 'activ' | 'inactiv' | 'toate'
}) {
  const cond = [
    eq(mfDocumente.idgestiune, q.idgestiune),
    sql`${mfDocumente.data} >= ${q.inceput}`,
    sql`${mfDocumente.data} <= ${q.sfarsit}`,
  ]
  if (q.stare !== 'toate') cond.push(eq(mfDocumente.stare, q.stare))
  return db.select({
    id: mfDocumente.id,
    data: mfDocumente.data,
    nrdoc: mfDocumente.nrdoc,
    observatii: mfDocumente.observatii,
    stare: mfDocumente.stare,
    tip: tipuridocumente.tip,
    denumireTip: tipuridocumente.denumire,
    denumireScurta: tipuridocumente.denumire_scurta,
    nrLinii: sql<number>`(SELECT COUNT(*) FROM mf_linii l WHERE l.iddocument = ${mfDocumente.id} AND l.stare = 'activ')`,
  })
    .from(mfDocumente)
    .innerJoin(tipuridocumente, eq(mfDocumente.idtipoperatiuni, tipuridocumente.id))
    .where(and(...cond))
    .orderBy(desc(mfDocumente.data), desc(mfDocumente.id))
}

export async function citesteDocumentMf(db: DbOrTx, id: number) {
  const [doc] = await db.select({
    id: mfDocumente.id,
    idtipoperatiuni: mfDocumente.idtipoperatiuni,
    data: mfDocumente.data,
    nrdoc: mfDocumente.nrdoc,
    idgestiune: mfDocumente.idgestiune,
    observatii: mfDocumente.observatii,
    stare: mfDocumente.stare,
    tip: tipuridocumente.tip,
    denumireTip: tipuridocumente.denumire,
    denumireScurta: tipuridocumente.denumire_scurta,
  })
    .from(mfDocumente)
    .innerJoin(tipuridocumente, eq(mfDocumente.idtipoperatiuni, tipuridocumente.id))
    .where(eq(mfDocumente.id, id))
  if (!doc) return null
  const linii = await db.select({
    id: mfLinii.id,
    idmijloc: mfLinii.idmijloc,
    idloc_sursa: mfLinii.idloc_sursa,
    idloc_destinatie: mfLinii.idloc_destinatie,
    valoare: mfLinii.valoare,
    nr_inventar: mijloaceFixe.nr_inventar,
    denumire: mijloaceFixe.denumire,
  })
    .from(mfLinii)
    .innerJoin(mijloaceFixe, eq(mfLinii.idmijloc, mijloaceFixe.id))
    .where(and(eq(mfLinii.iddocument, id), eq(mfLinii.stare, 'activ')))
  return { ...doc, linii }
}

/** Fișa mijlocului fix: identity, movements, amortization schedule. */
export async function fisaMijlocFix(db: DbOrTx, idgestiune: number, idmijloc: number) {
  const mf = await citesteMf(db, idmijloc)
  if (!mf || mf.idgestiune !== idgestiune) return null

  const miscari = await db.select({
    data: mfDocumente.data,
    nrdoc: mfDocumente.nrdoc,
    tip: tipuridocumente.tip,
    denumireTip: tipuridocumente.denumire,
    denumireScurta: tipuridocumente.denumire_scurta,
    idloc_sursa: mfLinii.idloc_sursa,
    idloc_destinatie: mfLinii.idloc_destinatie,
    valoare: mfLinii.valoare,
    stare: mfDocumente.stare,
  })
    .from(mfLinii)
    .innerJoin(mfDocumente, eq(mfLinii.iddocument, mfDocumente.id))
    .innerJoin(tipuridocumente, eq(mfDocumente.idtipoperatiuni, tipuridocumente.id))
    .where(and(eq(mfLinii.idmijloc, idmijloc), eq(mfLinii.stare, 'activ'), eq(mfDocumente.stare, 'activ')))
    .orderBy(asc(mfDocumente.data), asc(mfDocumente.id))

  const locIds = [...new Set(miscari.flatMap(m => [m.idloc_sursa, m.idloc_destinatie]).filter((x): x is number => x != null))]
  const locs = locIds.length
    ? await db.select({ id: locuri.id, denumire: locuri.denumire }).from(locuri).where(inArray(locuri.id, locIds))
    : []
  const locById = new Map(locs.map(l => [l.id, l.denumire]))

  const amortizari = await db.select({
    an: mfAmortizari.an,
    luna: mfAmortizari.luna,
    suma: mfAmortizari.suma,
    data_calcul: mfAmortizari.data_calcul,
  })
    .from(mfAmortizari)
    .where(and(eq(mfAmortizari.idmijloc, idmijloc), eq(mfAmortizari.stare, 'activ')))
    .orderBy(asc(mfAmortizari.an), asc(mfAmortizari.luna))

  let soldAmort = Dec.from(mf.amortizare_initiala)
  const amortCuSold = amortizari.map((a) => {
    soldAmort = Dec.add(soldAmort, Dec.from(a.suma))
    return {
      ...a,
      cumulata: Dec.toFixed(soldAmort, 4),
      valoare_ramasa: Dec.toFixed(Dec.sub(Dec.from(mf.valoare_intrare), soldAmort), 4),
    }
  })

  return {
    mijloc: mf,
    miscari: miscari.map(m => ({
      ...m,
      loc_sursa: m.idloc_sursa != null ? (locById.get(m.idloc_sursa) ?? null) : null,
      loc_destinatie: m.idloc_destinatie != null ? (locById.get(m.idloc_destinatie) ?? null) : null,
    })),
    amortizari: amortCuSold,
  }
}

/** Monthly amortization situation for a gestiune. */
export async function situatieAmortizare(db: DbOrTx, q: {
  idgestiune: number
  an: number
  luna: number
  idcateg?: number
  idloc?: number
}) {
  const cond = [
    eq(mijloaceFixe.idgestiune, q.idgestiune),
    eq(mfAmortizari.an, q.an),
    eq(mfAmortizari.luna, q.luna),
    eq(mfAmortizari.stare, 'activ'),
    eq(mijloaceFixe.stare, 'activ'),
  ]
  if (q.idcateg) cond.push(eq(mijloaceFixe.idcateg, q.idcateg))
  if (q.idloc) cond.push(eq(mijloaceFixe.idloc, q.idloc))

  const rows = await db.select({
    idmijloc: mijloaceFixe.id,
    nr_inventar: mijloaceFixe.nr_inventar,
    denumire: mijloaceFixe.denumire,
    cod_clasificare: mijloaceFixe.cod_clasificare,
    grupa: mijloaceFixe.grupa,
    valoare_intrare: mijloaceFixe.valoare_intrare,
    amortizare_lunara: mijloaceFixe.amortizare_lunara,
    suma: mfAmortizari.suma,
    loc: locuri.denumire,
    categorie: categorii.denumire,
  })
    .from(mfAmortizari)
    .innerJoin(mijloaceFixe, eq(mfAmortizari.idmijloc, mijloaceFixe.id))
    .innerJoin(locuri, eq(mijloaceFixe.idloc, locuri.id))
    .innerJoin(categorii, eq(mijloaceFixe.idcateg, categorii.id))
    .where(and(...cond))
    .orderBy(asc(mijloaceFixe.nr_inventar))

  const out = []
  let totalLuna = 0n
  for (const r of rows) {
    const cumulata = await amortizareCumulata(db, r.idmijloc, { an: q.an, luna: q.luna })
    totalLuna = Dec.add(totalLuna, Dec.from(r.suma))
    out.push({
      ...r,
      amortizare_cumulata: cumulata,
      valoare_ramasa: Dec.toFixed(Dec.sub(Dec.from(r.valoare_intrare), Dec.from(cumulata)), 4),
    })
  }
  return {
    an: q.an,
    luna: q.luna,
    linii: out,
    total: Dec.toFixed(totalLuna, 4),
  }
}

export async function urmatorNrInventar(db: DbOrTx, idgestiune: number): Promise<string> {
  const [r] = await db.select({
    maxn: sql<string | null>`MAX(CAST(${mijloaceFixe.nr_inventar} AS UNSIGNED))`,
  })
    .from(mijloaceFixe)
    .where(and(
      eq(mijloaceFixe.idgestiune, idgestiune),
      sql`${mijloaceFixe.nr_inventar} REGEXP '^[0-9]+$'`,
    ))
  const n = Number(r?.maxn ?? 0)
  return String(Number.isFinite(n) ? n + 1 : 1)
}
