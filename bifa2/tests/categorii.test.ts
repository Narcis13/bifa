import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { categorieModificata, categorieNoua, categoriiQuery } from '../shared/schemas/categorii'
import { categorii, conturi } from '../server/database/schema'
import { adaugaCategorie, dezactiveazaCategorie, gasesteCategorie, listaCategorii, modificaCategorie } from '../server/services/categorii'
import { seed, testDb } from './helpers'

const { db, pool } = testDb()
afterAll(() => pool.end())

beforeEach(async () => {
  await seed(db)
  await db.insert(conturi).values({ id: 2, cont: '6028', tip: 'A', denumire: 'Cheltuieli materiale', nivel: 0 })
})

const nou = (extra: Record<string, unknown> = {}) =>
  categorieNoua.parse({ denumire: 'Combustibili', idgestiune: 1, tipmaterial: 'M', idcont: 1, idcontchelt: 2, ...extra })

describe('categorii', () => {
  it('lists with the gestiune and the accounts as display strings', async () => {
    const lista = await listaCategorii(db, { idgestiune: 1 })
    expect(lista.map(c => c.denumire)).toEqual(['Consumabile', 'Piese'])
    expect(lista[0]).toMatchObject({ gestiune: 'Gestiune test', cont: '302 Materiale consumabile', contcheltuiala: '302 Materiale consumabile', lipsa_import: false, stare: 'activ' })
  })

  it('filters by gestiune, type and state', async () => {
    await adaugaCategorie(db, nou({ idgestiune: 2, tipmaterial: 'OB', denumire: 'Mobilier' }))
    await modificaCategorie(db, 2, { stare: 'inactiv' })
    expect((await listaCategorii(db)).map(c => c.denumire).sort()).toEqual(['Consumabile', 'Mobilier', 'Piese'])
    expect((await listaCategorii(db, { idgestiune: 2 })).map(c => c.denumire)).toEqual(['Mobilier'])
    expect((await listaCategorii(db, { tipmaterial: 'OB' })).map(c => c.denumire)).toEqual(['Mobilier'])
    expect((await listaCategorii(db, { idgestiune: 1, stare: 'activ' })).map(c => c.denumire)).toEqual(['Consumabile'])
    expect(categoriiQuery.parse({ idgestiune: '1', tipmaterial: 'MF' })).toEqual({ idgestiune: 1, tipmaterial: 'MF' })
  })

  it('adds a category and shows the account names', async () => {
    const r = await adaugaCategorie(db, nou({ info: ' obs ' }))
    expect(r.ok && r.valoare).toMatchObject({ denumire: 'Combustibili', gestiune: 'Gestiune test', cont: '302 Materiale consumabile', contcheltuiala: '6028 Cheltuieli materiale', info: 'obs', stare: 'activ' })
  })

  it('refuses a duplicate name in the same gestiune but accepts it in another', async () => {
    expect(await adaugaCategorie(db, nou({ denumire: 'Consumabile' }))).toMatchObject({ ok: false, status: 409 })
    expect((await adaugaCategorie(db, nou({ denumire: 'Consumabile', idgestiune: 2 }))).ok).toBe(true)
  })

  it('refuses unknown gestiune and accounts', async () => {
    expect(await adaugaCategorie(db, nou({ idgestiune: 99 }))).toMatchObject({ ok: false, status: 400 })
    expect(await adaugaCategorie(db, nou({ idcont: 99 }))).toMatchObject({ ok: false, status: 400 })
    expect(await adaugaCategorie(db, nou({ idcontchelt: 99 }))).toMatchObject({ ok: false, status: 400 })
  })

  it('edits fields, checks duplicates against other rows only, and 404s', async () => {
    const r = await modificaCategorie(db, 1, categorieModificata.parse({ info: 'nou', idcontchelt: 2 }))
    expect(r.ok && r.valoare).toMatchObject({ denumire: 'Consumabile', info: 'nou', contcheltuiala: '6028 Cheltuieli materiale', stare: 'activ' })
    expect((await modificaCategorie(db, 1, { denumire: 'Consumabile' })).ok).toBe(true)
    expect(await modificaCategorie(db, 1, { denumire: 'Piese' })).toMatchObject({ ok: false, status: 409 })
    // moving a category into a gestiune where its name is taken
    await adaugaCategorie(db, nou({ denumire: 'Piese', idgestiune: 2 }))
    expect(await modificaCategorie(db, 2, { idgestiune: 2 })).toMatchObject({ ok: false, status: 409 })
    expect(await modificaCategorie(db, 99, { info: 'x' })).toMatchObject({ ok: false, status: 404 })
  })

  it('"delete" deactivates and the category can be reactivated', async () => {
    expect(await dezactiveazaCategorie(db, 1)).toEqual({ ok: true, valoare: null })
    expect((await gasesteCategorie(db, 1))?.stare).toBe('inactiv')
    expect((await modificaCategorie(db, 1, { stare: 'activ' })).ok).toBe(true)
    expect(await dezactiveazaCategorie(db, 99)).toMatchObject({ ok: false, status: 404 })
  })

  it('does not allow deleting or deactivating categories created at import', async () => {
    const [r] = await db.insert(categorii).values({ denumire: 'Categorie lipsă', idgestiune: 1, lipsa_import: true }).$returningId()
    expect(await dezactiveazaCategorie(db, r!.id)).toMatchObject({ ok: false, status: 409 })
    expect(await modificaCategorie(db, r!.id, { stare: 'inactiv' })).toMatchObject({ ok: false, status: 409 })
    expect((await gasesteCategorie(db, r!.id))?.stare).toBe('activ')
    const lista = await listaCategorii(db, { idgestiune: 1 })
    expect(lista.find(c => c.id === r!.id)).toMatchObject({ lipsa_import: true, cont: null, contcheltuiala: null })
  })

  it('a partial update does not reset type or state', () => {
    expect(categorieModificata.parse({ info: 'x' })).toEqual({ info: 'x' })
  })
})
