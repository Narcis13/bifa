import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { materialPatchSchema, materialSchema, materialeQuery } from '../shared/schemas/materiale'
import {
  adaugaMaterial,
  gasesteDuplicat,
  listaMateriale,
  modificaMaterial,
  ultimulCod,
  urmatorulCod,
} from '../server/services/materiale'
import { listaTipuriDocumente } from '../server/services/tipuri-documente'
import { seed, testDb } from './helpers'

const { db, pool } = testDb()
afterAll(() => pool.end())
beforeEach(() => seed(db))

const lista = (o: Record<string, unknown> = {}) => listaMateriale(db, materialeQuery.parse({ idgestiune: 1, ...o }))
const nou = (denumire: string, extra: Record<string, unknown> = {}) =>
  adaugaMaterial(db, { ...materialSchema.parse({ idgestiune: 1, denumire, ...extra }), iduser: 2 })

describe('materiale schemas', () => {
  it('validates price scale and normalizes the optional code', () => {
    expect(materialSchema.parse({ idgestiune: 1, denumire: ' Seringă ', pretpredefinit: '1,5' })).toMatchObject({
      denumire: 'Seringă', um: 'buc', pretpredefinit: '1.5', stare: 'activ',
    })
    expect(materialSchema.safeParse({ idgestiune: 1, denumire: 'x', pretpredefinit: '1.23456' }).success).toBe(false)
    expect(materialSchema.safeParse({ idgestiune: 1, denumire: 'x'.repeat(101) }).success).toBe(false)
    expect(materialSchema.safeParse({ idgestiune: 1, denumire: 'x', um: 'u'.repeat(16) }).success).toBe(false)
    expect(materialSchema.parse({ idgestiune: 1, denumire: 'x', cod_import: '  ' }).cod_import).toBeNull()
  })

  it('does not apply create defaults to a partial patch', () => {
    expect(materialPatchSchema.parse({ denumire: 'Nou' })).toEqual({ denumire: 'Nou' })
  })
})

describe('materiale', () => {
  it('creates a material owned by the user, with creator and decimal price kept as string', async () => {
    const { material, avertismente } = await nou('Mănuși nitril', { um: 'cutie', pretpredefinit: '12.3456', cod_import: 'M-0001' })
    expect(avertismente).toEqual([])
    expect(material).toMatchObject({
      denumire: 'Mănuși nitril', um: 'cutie', pretpredefinit: '12.3456', cod_import: 'M-0001',
      idgestiune: 1, iduser: 2, stare: 'activ', creat_de: 'operator.test',
    })
  })

  it('warns, but still saves, on a duplicate active name (case-insensitive)', async () => {
    const { material, avertismente } = await nou('HÂRTIE a4')
    expect(avertismente).toEqual(['Există deja un material activ cu această denumire în gestiune (cod 1).'])
    expect(material.id).toBeGreaterThan(2)
    expect((await lista({ q: 'a4' })).total).toBe(2)

    expect(await gasesteDuplicat(db, 1, 'hârtie a4')).toMatchObject({ id: 1 })
    expect(await gasesteDuplicat(db, 1, 'hârtie a4', 1)).toMatchObject({ id: material.id })
    // other gestiune: no conflict
    expect(await gasesteDuplicat(db, 2, 'hârtie a4')).toBeUndefined()
  })

  it('warns on rename and reactivation, not on unrelated edits or inactive twins', async () => {
    const t = await nou('Toner negru')
    expect((await modificaMaterial(db, t.material.id, { um: 'set' }))!.avertismente).toEqual([])
    const r = await modificaMaterial(db, t.material.id, { denumire: 'toner' })
    expect(r!.avertismente).toHaveLength(1)
    expect(r!.avertismente[0]).toContain('(cod 2)')

    await modificaMaterial(db, t.material.id, { stare: 'inactiv' })
    expect((await modificaMaterial(db, t.material.id, { um: 'buc' }))!.avertismente).toEqual([])
    expect((await nou('Toner')).avertismente).toEqual(['Există deja un material activ cu această denumire în gestiune (cod 2).'])
    expect((await modificaMaterial(db, t.material.id, { stare: 'activ' }))!.avertismente).toHaveLength(1)
    expect(await modificaMaterial(db, 9999, { um: 'x' })).toBeUndefined()
  })

  it('searches by name, import code and id, with paging, sorting and total', async () => {
    for (let i = 1; i <= 25; i++) await nou(`Compresă ${String(i).padStart(2, '0')}`, { cod_import: `C-${i}` })
    await nou('Compresă externă', { idgestiune: 2 })

    const p1 = await lista({ q: 'compres', rows: 10 })
    expect(p1.total).toBe(25)
    expect(p1.rows).toHaveLength(10)
    expect(p1.rows[0]!.denumire).toBe('Compresă 01')
    const p3 = await lista({ q: 'compres', rows: 10, page: 3 })
    expect(p3.rows.map(r => r.denumire)).toEqual(['Compresă 21', 'Compresă 22', 'Compresă 23', 'Compresă 24', 'Compresă 25'])

    const desc = await lista({ q: 'compres', rows: 3, sortField: 'denumire', sortOrder: -1 })
    expect(desc.rows.map(r => r.denumire)).toEqual(['Compresă 25', 'Compresă 24', 'Compresă 23'])

    expect((await lista({ q: 'C-2' })).total).toBe(7) // C-2, C-20..C-25
    expect((await lista({ q: '2' })).rows.some(r => r.id === 2)).toBe(true) // exact id
    expect((await lista({ q: '100%' })).total).toBe(0) // wildcard is escaped
    const byUser = await lista({ sortField: 'creat_de', rows: 5 })
    expect(byUser.rows[0]!.creat_de).toBe('operator.test')
  })

  it('deactivates instead of deleting and filters by stare', async () => {
    await modificaMaterial(db, 2, { stare: 'inactiv' })
    expect((await lista()).rows.map(r => r.id)).toEqual([1])
    expect((await lista({ stare: 'inactiv' })).rows.map(r => r.id)).toEqual([2])
    expect((await lista({ stare: 'toate' })).total).toBe(2)
    const r = await modificaMaterial(db, 1, { denumire: 'Hârtie A3', pretpredefinit: '0.5000', cod_import: null })
    expect(r!.material).toMatchObject({ denumire: 'Hârtie A3', pretpredefinit: '0.5000', cod_import: null, stare: 'activ' })
  })

  it('ultimul-cod returns the last active import code and a suggestion for the next', async () => {
    expect(await ultimulCod(db, 1)).toEqual({ idmaterial: null, ultimulCod: null, urmatorulCod: null })
    await nou('A', { cod_import: 'MAT-0099' })
    const b = await nou('B', { cod_import: 'MAT-0100' })
    await nou('C') // no code: skipped
    expect(await ultimulCod(db, 1)).toEqual({ idmaterial: b.material.id, ultimulCod: 'MAT-0100', urmatorulCod: 'MAT-0101' })
    await modificaMaterial(db, b.material.id, { stare: 'inactiv' })
    expect((await ultimulCod(db, 1)).ultimulCod).toBe('MAT-0099')
    expect((await ultimulCod(db, 2)).ultimulCod).toBeNull()
  })

  it('computes the next code keeping prefix and padding', () => {
    expect(urmatorulCod('MAT-0099')).toBe('MAT-0100')
    expect(urmatorulCod('999')).toBe('1000')
    expect(urmatorulCod('7')).toBe('8')
    expect(urmatorulCod('ABC')).toBeNull()
    expect(urmatorulCod(null)).toBeNull()
  })
})

describe('tipuri documente', () => {
  it('lists all types ordered by priority', async () => {
    const t = await listaTipuriDocumente(db)
    expect(t.map(x => x.denumire_scurta)).toEqual(['NRCD', 'BC', 'BPTR'])
    expect(t[1]).toEqual({ id: 2, denumire: 'BON DE CONSUM', tip: 'e', denumire_scurta: 'BC', prioritate: 20 })
  })
})
