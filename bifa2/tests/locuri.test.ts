import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { adaugaLoc, listaLocuri, modificaLoc } from '../server/services/locuri'
import { reset, testDb } from './helpers'

const { db, pool } = testDb()
afterAll(() => pool.end())
beforeEach(() => reset(db))

describe('locuri', () => {
  it('adds, edits and lists places ordered by priority', async () => {
    const a = await adaugaLoc(db, { denumire: 'DEPOZIT', prioritate: 1, stare: 'activ' })
    await adaugaLoc(db, { denumire: 'URGENȚE', prioritate: 5, stare: 'activ' })
    await modificaLoc(db, a!.id, { stare: 'inactiv' })
    expect((await listaLocuri(db)).map(l => l.denumire)).toEqual(['URGENȚE', 'DEPOZIT'])
    expect((await listaLocuri(db, { stare: 'activ' })).map(l => l.denumire)).toEqual(['URGENȚE'])
  })
})
