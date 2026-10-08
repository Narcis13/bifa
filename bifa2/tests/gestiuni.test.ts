import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { gestiuneModificata, gestiuneNoua } from '../shared/schemas/gestiuni'
import { operatiuni } from '../server/database/schema'
import { adaugaGestiune, gasesteGestiune, gestiuniAccesibile, listaGestiuni, modificaGestiune, stergeGestiune } from '../server/services/gestiuni'
import { seed, testDb } from './helpers'

const { db, pool } = testDb()
afterAll(() => pool.end())
beforeEach(() => seed(db))

describe('gestiuni', () => {
  it('lists gestiuni with the assigned username', async () => {
    const lista = await listaGestiuni(db)
    expect(lista.map(g => [g.denumire, g.utilizator])).toEqual([['Altă gestiune', 'admin.test'], ['Gestiune test', 'operator.test']])
    expect((await listaGestiuni(db, { stare: 'inactiv' }))).toEqual([])
  })

  it('adds a gestiune with committees and returns the full row', async () => {
    const input = gestiuneNoua.parse({
      denumire: ' Farmacie ',
      userid: 2,
      gestionar: 'Ion Test',
      r_presedinte: 'Președinte R',
      r_membru1: 'Membru R1',
      i_presedinte: 'Președinte I',
      i_membru3: '',
    })
    const r = await adaugaGestiune(db, input)
    expect(r.ok && r.valoare).toMatchObject({
      denumire: 'Farmacie',
      userid: 2,
      gestionar: 'Ion Test',
      r_presedinte: 'Președinte R',
      r_membru1: 'Membru R1',
      i_presedinte: 'Președinte I',
      i_membru3: null,
      stare: 'activ',
    })
    expect(await adaugaGestiune(db, gestiuneNoua.parse({ denumire: 'X', userid: 999 }))).toMatchObject({ ok: false, status: 400 })
  })

  it('edits only the given fields, including re-assigning and clearing the user', async () => {
    const r = await modificaGestiune(db, 1, gestiuneModificata.parse({ gestionar: 'Alt Gestionar', i_membru2: 'Membru I2' }))
    expect(r.ok && r.valoare).toMatchObject({ denumire: 'Gestiune test', userid: 2, gestionar: 'Alt Gestionar', i_membru2: 'Membru I2', stare: 'activ' })
    expect((await modificaGestiune(db, 1, { userid: 1 })).ok).toBe(true)
    expect((await gasesteGestiune(db, 1))?.userid).toBe(1)
    expect((await modificaGestiune(db, 1, { userid: null })).ok).toBe(true)
    expect((await gasesteGestiune(db, 1))?.userid).toBeNull()
    expect(await modificaGestiune(db, 1, { userid: 999 })).toMatchObject({ ok: false, status: 400 })
    expect(await modificaGestiune(db, 99, { denumire: 'x' })).toMatchObject({ ok: false, status: 404 })
  })

  it('a partial update does not reset the state', async () => {
    await modificaGestiune(db, 2, { stare: 'inactiv' })
    const upd = gestiuneModificata.parse({ gestionar: 'X' })
    expect(upd.stare).toBeUndefined()
    await modificaGestiune(db, 2, upd)
    expect((await gasesteGestiune(db, 2))?.stare).toBe('inactiv')
  })

  it('refuses to delete a gestiune that has materials or categories, deletes an unused one', async () => {
    expect(await stergeGestiune(db, 1)).toMatchObject({ ok: false, status: 409 })
    expect(await gasesteGestiune(db, 1)).toBeDefined()
    expect(await stergeGestiune(db, 2)).toEqual({ ok: true, valoare: null })
    expect(await gasesteGestiune(db, 2)).toBeUndefined()
    expect(await stergeGestiune(db, 2)).toMatchObject({ ok: false, status: 404 })
  })

  it('refuses to delete a gestiune that has documents', async () => {
    await db.insert(operatiuni).values({ idtipoperatiuni: 1, data: '2026-01-05', nrdoc: '1', idgestiune: 2 })
    expect(await stergeGestiune(db, 2)).toMatchObject({ ok: false, status: 409 })
  })

  it('keeps gestiuniAccesibile behaviour: admins see all active, operators their own', async () => {
    await modificaGestiune(db, 2, { stare: 'inactiv' })
    expect((await gestiuniAccesibile(db, { id: 1, rol: 'admin' })).map(g => g.id)).toEqual([1])
    expect((await gestiuniAccesibile(db, { id: 2, rol: 'operator' })).map(g => g.id)).toEqual([1])
    expect(await gestiuniAccesibile(db, { id: 1, rol: 'operator' })).toEqual([])
  })
})
