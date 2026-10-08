import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { analiticNou, conturiQuery } from '../shared/schemas/conturi'
import { categorii, conturi } from '../server/database/schema'
import { adaugaAnalitic, cautaConturi, gasesteCont, stergeCont } from '../server/services/conturi'
import { seed, testDb } from './helpers'

const { db, pool } = testDb()
afterAll(() => pool.end())

/** seed() has cont 302 (id 1, nivel 0); this adds a small synthetic tree around it. */
beforeEach(async () => {
  await seed(db)
  await db.insert(conturi).values([
    { id: 2, cont: '%', tip: 'A', denumire: 'Toate conturile', nivel: 0 },
    { id: 3, cont: '3021', tip: 'A', denumire: 'Materiale auxiliare', sintetic: '302', nivel: 1 },
    { id: 4, cont: '30211', tip: 'A', denumire: 'Combustibil', sintetic: '3021', nivel: 2 },
    { id: 5, cont: '30212', tip: 'A', denumire: 'Piese de schimb 100%', sintetic: '3021', nivel: 2 },
    { id: 6, cont: '6028', tip: 'A', denumire: 'Alte cheltuieli materiale', nivel: 0 },
  ])
})

describe('conturi: search', () => {
  it('searches by code or by name and never returns the placeholder row', async () => {
    const toate = await cautaConturi(db)
    expect(toate.total).toBe(5)
    expect(toate.rows.map(c => c.cont)).toEqual(['302', '3021', '30211', '30212', '6028'])

    expect((await cautaConturi(db, { q: '3021' })).rows.map(c => c.cont)).toEqual(['3021', '30211', '30212'])
    expect((await cautaConturi(db, { q: 'combustibil' })).rows.map(c => c.cont)).toEqual(['30211'])
    expect((await cautaConturi(db, { q: 'toate' })).total).toBe(0)
  })

  it('treats LIKE wildcards in the search text literally', async () => {
    expect((await cautaConturi(db, { q: '%' })).rows.map(c => c.cont)).toEqual(['30212'])
    expect((await cautaConturi(db, { q: '_' })).total).toBe(0)
  })

  it('paginates and reports the total', async () => {
    const p1 = await cautaConturi(db, { page: 1, rows: 2 })
    const p3 = await cautaConturi(db, { page: 3, rows: 2 })
    expect(p1.total).toBe(5)
    expect(p1.rows.map(c => c.cont)).toEqual(['302', '3021'])
    expect(p3.rows.map(c => c.cont)).toEqual(['6028'])
    expect((await cautaConturi(db, { page: 9, rows: 2 })).rows).toEqual([])
  })

  it('applies defaults from the query schema', () => {
    expect(conturiQuery.parse({})).toEqual({ page: 1, rows: 50 })
    expect(conturiQuery.parse({ page: '2', rows: '20', q: ' ab ' })).toEqual({ page: 2, rows: 20, q: 'ab' })
    expect(conturiQuery.safeParse({ rows: '5000' }).success).toBe(false)
  })
})

describe('conturi: analytic accounts', () => {
  it('adds an analytic under a lowest-level synthetic account', async () => {
    const r = await adaugaAnalitic(db, analiticNou.parse({ idsintetic: 4, sufix: '.01', denumire: ' Motorină ' }))
    expect(r.ok && r.valoare).toMatchObject({ cont: '30211.01', tip: 'N', denumire: 'Motorină', sintetic: '30211', nivel: 3 })
    expect((await cautaConturi(db, { analitice: '1' })).rows.map(c => c.cont)).toEqual(['30211.01'])
  })

  it('refuses duplicates, missing parents, analytic parents, non-leaf synthetic parents and the placeholder', async () => {
    const input = { idsintetic: 4, sufix: '01', denumire: 'Test' }
    expect((await adaugaAnalitic(db, input)).ok).toBe(true)
    expect(await adaugaAnalitic(db, input)).toMatchObject({ ok: false, status: 409 })

    const analitic = await db.select().from(conturi).then(r => r.find(c => c.tip === 'N')!)
    expect(await adaugaAnalitic(db, { ...input, idsintetic: analitic.id })).toMatchObject({ ok: false, status: 400 })
    expect(await adaugaAnalitic(db, { ...input, idsintetic: 3 })).toMatchObject({ ok: false, status: 400 })
    expect(await adaugaAnalitic(db, { ...input, idsintetic: 999 })).toMatchObject({ ok: false, status: 404 })
    expect(await adaugaAnalitic(db, { ...input, idsintetic: 2 })).toMatchObject({ ok: false, status: 404 })
  })

  it('validates the suffix', () => {
    expect(analiticNou.safeParse({ idsintetic: 4, sufix: 'a b', denumire: 'x' }).success).toBe(false)
    expect(analiticNou.safeParse({ idsintetic: 4, sufix: '', denumire: 'x' }).success).toBe(false)
    expect(analiticNou.safeParse({ idsintetic: 4, sufix: '01', denumire: '' }).success).toBe(false)
  })

  it('deletes only unused analytic accounts', async () => {
    const a = await adaugaAnalitic(db, { idsintetic: 4, sufix: '01', denumire: 'Unu' })
    const b = await adaugaAnalitic(db, { idsintetic: 4, sufix: '02', denumire: 'Doi' })
    if (!a.ok || !b.ok) throw new Error('setup')

    await db.insert(categorii).values({ denumire: 'Combustibili', idgestiune: 1, idcont: a.valoare.id, idcontchelt: 6 })
    expect(await stergeCont(db, a.valoare.id)).toMatchObject({ ok: false, status: 409 })
    expect(await gasesteCont(db, a.valoare.id)).toBeDefined()

    await db.insert(categorii).values({ denumire: 'Alta', idgestiune: 1, idcont: 6, idcontchelt: b.valoare.id })
    expect(await stergeCont(db, b.valoare.id)).toMatchObject({ ok: false, status: 409 })
  })

  it('deletes an unreferenced analytic, rejects synthetic accounts and unknown ids', async () => {
    const a = await adaugaAnalitic(db, { idsintetic: 4, sufix: '01', denumire: 'Unu' })
    if (!a.ok) throw new Error('setup')
    expect(await stergeCont(db, a.valoare.id)).toEqual({ ok: true, valoare: null })
    expect(await gasesteCont(db, a.valoare.id)).toBeUndefined()
    expect(await stergeCont(db, 4)).toMatchObject({ ok: false, status: 400 })
    expect(await stergeCont(db, 999)).toMatchObject({ ok: false, status: 404 })
  })
})
