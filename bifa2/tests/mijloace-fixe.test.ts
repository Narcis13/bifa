import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import {
  anuleazaAmortizare,
  amortizareCumulata,
  amortizareLunara,
  calculeazaAmortizare,
  caseazaMf,
  citesteMf,
  fisaMijlocFix,
  inregistreazaMf,
  invalideazaDocumentMf,
  listaMf,
  primaLunaAmortizare,
  situatieAmortizare,
  transferaMf,
} from '../server/services/mijloace-fixe'
import type { InregistrareMfInput } from '../shared/schemas/mijloace-fixe'
import { seed, testDb } from './helpers'

const { db, pool } = testDb()
afterAll(() => pool.end())
beforeEach(() => seed(db))

const baza = (over: Partial<InregistrareMfInput> = {}): InregistrareMfInput => ({
  idgestiune: 1,
  idtipoperatiuni: 1,
  data: '2024-01-15',
  nrdoc: 'MF-1',
  nr_inventar: '1001',
  denumire: 'Laptop Dell',
  idcateg: 3,
  idloc: 1,
  cod_clasificare: '3.1.1',
  grupa: 3,
  valoare_intrare: '12000.0000',
  amortizare_initiala: '0',
  durata_ani: 5,
  data_punere_functiune: '2024-01-15',
  ...over,
})

describe('mijloace fixe – amortizare liniară', () => {
  it('calculează amortizarea lunară = valoare / (ani × 12)', () => {
    expect(amortizareLunara('12000', 60)).toBe('200.0000')
    expect(primaLunaAmortizare('2024-01-15')).toEqual({ an: 2024, luna: 2 })
    expect(primaLunaAmortizare('2024-12-01')).toEqual({ an: 2025, luna: 1 })
  })

  it('înregistrează un mijloc fix nou cu document de intrare', async () => {
    const r = await inregistreazaMf(db, baza())
    expect(r.amortizare_lunara).toBe('200.0000')
    expect(r.durata_luni).toBe(60)
    const mf = await citesteMf(db, r.id)
    expect(mf).toMatchObject({
      nr_inventar: '1001',
      denumire: 'Laptop Dell',
      stare_mf: 'in_functiune',
      amortizare_cumulata: '0.0000',
      valoare_ramasa: '12000.0000',
      cota_anuala: '20.0000',
    })
  })

  it('acceptă mijloace parțial și integral amortizate la înregistrare', async () => {
    const partial = await inregistreazaMf(db, baza({
      nr_inventar: '1002',
      nrdoc: 'MF-2',
      amortizare_initiala: '6000.0000',
    }))
    expect(await amortizareCumulata(db, partial.id)).toBe('6000.0000')
    const mf = await citesteMf(db, partial.id)
    expect(mf!.valoare_ramasa).toBe('6000.0000')

    const full = await inregistreazaMf(db, baza({
      nr_inventar: '1003',
      nrdoc: 'MF-3',
      amortizare_initiala: '12000.0000',
    }))
    const r = await calculeazaAmortizare(db, { idgestiune: 1, an: 2024, luna: 2 })
    expect(r.detalii.find(d => d.idmijloc === full.id)).toBeUndefined()
  })

  it('respinge duplicatul de nr. inventar și categoria non-MF', async () => {
    await inregistreazaMf(db, baza())
    await expect(inregistreazaMf(db, baza({ nrdoc: 'MF-x' }))).rejects.toThrow(/există deja/)
    await expect(inregistreazaMf(db, baza({
      nr_inventar: '2000',
      nrdoc: 'MF-y',
      idcateg: 1,
    }))).rejects.toThrow(/mijloace fixe/)
  })

  it('transferă între locuri și casează', async () => {
    const a = await inregistreazaMf(db, baza())
    const b = await inregistreazaMf(db, baza({ nr_inventar: '1002', nrdoc: 'MF-2' }))

    const t = await transferaMf(db, {
      idgestiune: 1,
      idtipoperatiuni: 3,
      data: '2024-03-01',
      nrdoc: 'T-1',
      idloc_destinatie: 2,
      idmijloace: [a.id, b.id],
    })
    expect(t.transferate).toBe(2)
    expect((await citesteMf(db, a.id))!.idloc).toBe(2)

    const c = await caseazaMf(db, {
      idgestiune: 1,
      idtipoperatiuni: 2,
      data: '2024-06-01',
      nrdoc: 'C-1',
      idmijloace: [a.id],
    })
    expect(c.casate).toBe(1)
    const casat = await citesteMf(db, a.id)
    expect(casat).toMatchObject({ stare_mf: 'casat', data_casare: '2024-06-01' })
  })

  it('calculează amortizarea lunară, ocolește luna înainte de eligibilitate și ajustează ultima rată', async () => {
    const r = await inregistreazaMf(db, baza()) // 12000 / 60 luni = 200
    // Not eligible in January (commissioning month)
    const ian = await calculeazaAmortizare(db, { idgestiune: 1, an: 2024, luna: 1 })
    expect(ian.create).toBe(0)

    const feb = await calculeazaAmortizare(db, { idgestiune: 1, an: 2024, luna: 2 })
    expect(feb.create).toBe(1)
    expect(feb.detalii[0]!.suma).toBe('200.0000')

    const again = await calculeazaAmortizare(db, { idgestiune: 1, an: 2024, luna: 2 })
    expect(again.create).toBe(0)
    expect(again.deja).toBe(1)

    expect(await amortizareCumulata(db, r.id)).toBe('200.0000')

    // Remaining 100 < monthly 200 → last installment is residual
    const p = await inregistreazaMf(db, baza({
      nr_inventar: '1099',
      nrdoc: 'MF-p',
      valoare_intrare: '12000.0000',
      amortizare_initiala: '11900.0000',
      durata_ani: 5,
    }))
    const mar = await calculeazaAmortizare(db, { idgestiune: 1, an: 2024, luna: 3 })
    const linie = mar.detalii.find(d => d.idmijloc === p.id)
    expect(linie!.suma).toBe('100.0000')
    expect(await amortizareCumulata(db, p.id)).toBe('12000.0000')
  })

  it('anulează amortizarea lunii și invalidează documentul de intrare', async () => {
    const r = await inregistreazaMf(db, baza())
    await calculeazaAmortizare(db, { idgestiune: 1, an: 2024, luna: 2 })
    const an = await anuleazaAmortizare(db, 1, 2024, 2)
    expect(an.anulate).toBe(1)
    expect(await amortizareCumulata(db, r.id)).toBe('0.0000')

    await invalideazaDocumentMf(db, r.iddocument)
    const lista = await listaMf(db, {
      idgestiune: 1, stare_mf: 'toate', stare: 'activ', page: 1, rows: 50,
    })
    expect(lista.total).toBe(0)
  })

  it('generează fișa și situația de amortizare', async () => {
    const r = await inregistreazaMf(db, baza({ amortizare_initiala: '1000.0000' }))
    await transferaMf(db, {
      idgestiune: 1, idtipoperatiuni: 3, data: '2024-02-10', nrdoc: 'T1',
      idloc_destinatie: 2, idmijloace: [r.id],
    })
    await calculeazaAmortizare(db, { idgestiune: 1, an: 2024, luna: 2 })

    const fisa = await fisaMijlocFix(db, 1, r.id)
    expect(fisa!.miscari).toHaveLength(2)
    expect(fisa!.amortizari).toHaveLength(1)
    expect(fisa!.mijloc.amortizare_cumulata).toBe('1200.0000')

    const sit = await situatieAmortizare(db, { idgestiune: 1, an: 2024, luna: 2 })
    expect(sit.linii).toHaveLength(1)
    expect(sit.total).toBe('200.0000')
  })
})
