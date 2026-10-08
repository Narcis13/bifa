import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { citesteDocument, invalideazaDocument, listaDocumente, salveazaDocument } from '../server/services/documente'
import { stocPretMediu } from '../server/services/stoc'
import type { DocumentInput } from '../shared/schemas/documente'
import { seed, testDb } from './helpers'

const { db, pool } = testDb()
afterAll(() => pool.end())
beforeEach(() => seed(db))

const dest = { idloc: 1, idcateg: 1, stareMaterial: 'NOU' as const }
const nir = (linii: DocumentInput['linii'], data = '2025-01-10', nrdoc = '1'): DocumentInput =>
  ({ idgestiune: 1, idtipoperatiuni: 1, tipMaterial: 'M', data, nrdoc, linii })
const bon = (linii: DocumentInput['linii'], data = '2025-02-01', nrdoc = '10'): DocumentInput =>
  ({ idgestiune: 1, idtipoperatiuni: 2, tipMaterial: 'M', data, nrdoc, linii })
const stoc = (data = '2025-12-31') => stocPretMediu(db, { idgestiune: 1, idloc: 1, idcateg: 1, tipMaterial: 'M', data })

describe('documente', () => {
  it('saves an entry document with its lines in one go', async () => {
    const { id } = await salveazaDocument(db, nir([
      { idreper: 1, cantitate: '3', pret: '1.3333', destinatie: dest },
      { idreper: 2, cantitate: '1.5', pret: '10', destinatie: dest },
    ]))
    const doc = await citesteDocument(db, id)
    expect(doc!.linii).toHaveLength(2)
    expect(doc!.linii[0]!.debit).toBe('3.9999')
    expect(doc!.totalDebit).toBe('18.9999')
  })

  it('exits at average price and takes the whole value on a full exit', async () => {
    await salveazaDocument(db, nir([{ idreper: 1, cantitate: '1', pret: '1', destinatie: dest }], '2025-01-01', 'A'))
    await salveazaDocument(db, nir([{ idreper: 1, cantitate: '2', pret: '1.0001', destinatie: dest }], '2025-01-02', 'B'))
    // stock 3 @ 3.0002 -> average 1.0001 (rounded)
    const e1 = await salveazaDocument(db, bon([{ idreper: 1, cantitate: '1', sursa: dest }]))
    expect((await citesteDocument(db, e1.id))!.linii[0]).toMatchObject({ pret: '1.0001', credit: '1.0001' })
    const e2 = await salveazaDocument(db, bon([{ idreper: 1, cantitate: '2', sursa: dest }], '2025-02-02', '11'))
    expect((await citesteDocument(db, e2.id))!.linii[0]!.credit).toBe('2.0001')
    expect(await stoc()).toEqual([])
  })

  it('rejects an exit larger than the stock on the document date', async () => {
    await salveazaDocument(db, nir([{ idreper: 1, cantitate: '5', pret: '2', destinatie: dest }], '2025-03-01'))
    await expect(salveazaDocument(db, bon([{ idreper: 1, cantitate: '1', sursa: dest }], '2025-02-28')))
      .rejects.toThrow(/stoc insuficient/)
    await expect(salveazaDocument(db, bon([
      { idreper: 1, cantitate: '3', sursa: dest },
      { idreper: 1, cantitate: '3', sursa: dest },
    ], '2025-03-02'))).rejects.toThrow(/Linia 2: stoc insuficient/)
    // nothing from the failed document was written
    expect((await listaDocumente(db, { idgestiune: 1, inceput: '2025-01-01', sfarsit: '2025-12-31', stare: 'toate' }))).toHaveLength(1)
  })

  it('writes a credit and a debit line for a transfer', async () => {
    await salveazaDocument(db, nir([{ idreper: 2, cantitate: '4', pret: '2.5', destinatie: dest }]))
    const { id } = await salveazaDocument(db, {
      idgestiune: 1, idtipoperatiuni: 3, tipMaterial: 'M', data: '2025-04-01', nrdoc: 'T1',
      linii: [{ idreper: 2, cantitate: '1', sursa: dest, destinatie: { idloc: 2, idcateg: 2, stareMaterial: 'FOLOSIT' } }],
    })
    const doc = await citesteDocument(db, id)
    expect(doc!.linii.map(l => [l.id_locdispunere, l.id_categ, l.stare_material, l.cantitate_debit, l.cantitate_credit, l.debit, l.credit])).toEqual([
      [1, 1, 'NOU', '0.00', '1.00', '0.0000', '2.5000'],
      [2, 2, 'FOLOSIT', '1.00', '0.00', '2.5000', '0.0000'],
    ])
  })

  it('edits in place, keeps the id and full price precision, never hard-deletes', async () => {
    const { id } = await salveazaDocument(db, nir([{ idreper: 1, cantitate: '1', pret: '1.2345', destinatie: dest }]))
    const r = await salveazaDocument(db, nir([{ idreper: 1, cantitate: '2', pret: '1.2345', destinatie: dest }], '2025-01-11', '1b'), id)
    expect(r.id).toBe(id)
    const doc = await citesteDocument(db, id)
    expect(doc).toMatchObject({ nrdoc: '1b', data: '2025-01-11', totalDebit: '2.4690' })
    const [[all]] = await pool.query('SELECT COUNT(*) n, SUM(stare = \'activ\') a FROM tranzactii WHERE idAntet = ?', [id]) as unknown as [[{ n: number, a: string }]]
    expect([Number(all.n), Number(all.a)]).toEqual([2, 1])
  })

  it('does not count the edited document\'s own exit as consumed stock', async () => {
    await salveazaDocument(db, nir([{ idreper: 1, cantitate: '2', pret: '3', destinatie: dest }]))
    const e = await salveazaDocument(db, bon([{ idreper: 1, cantitate: '2', sursa: dest }]))
    await expect(salveazaDocument(db, bon([{ idreper: 1, cantitate: '2', sursa: dest }]), e.id)).resolves.toMatchObject({ id: e.id })
  })

  it('warns about duplicate numbers and lists documents without lines; invalidation is soft', async () => {
    const a = await salveazaDocument(db, nir([{ idreper: 1, cantitate: '1', pret: '1', destinatie: dest }], '2025-05-01', '7'))
    const b = await salveazaDocument(db, nir([{ idreper: 1, cantitate: '1', pret: '1', destinatie: dest }], '2025-06-01', '7'))
    expect(b.avertismente[0]).toMatch(/Mai există un document/)
    await pool.query('INSERT INTO operatiuni (idtipoperatiuni, data, nrdoc, idgestiune) VALUES (1, \'2025-07-01\', \'gol\', 1)')
    const lista = await listaDocumente(db, { idgestiune: 1, inceput: '2025-01-01', sfarsit: '2025-12-31', stare: 'activ' })
    expect(lista.map(d => d.nrdoc)).toEqual(['gol', '7', '7'])
    expect(await invalideazaDocument(db, a.id)).toBe(true)
    expect((await listaDocumente(db, { idgestiune: 1, inceput: '2025-01-01', sfarsit: '2025-12-31', stare: 'activ' }))).toHaveLength(2)
    expect(await stoc()).toMatchObject([{ id_reper: 1, stoc: '1.00' }])
  })

  it('rejects materials and categories from another gestiune', async () => {
    await expect(salveazaDocument(db, { ...nir([{ idreper: 1, cantitate: '1', pret: '1', destinatie: dest }]), idgestiune: 2 }))
      .rejects.toThrow(/nu aparține gestiunii/)
  })
})
