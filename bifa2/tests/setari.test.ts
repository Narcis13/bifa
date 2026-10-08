import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { setariSchema } from '../shared/schemas/setari'
import { citesteSetari, salveazaSetari } from '../server/services/setari'
import { reset, testDb } from './helpers'

const { db, pool } = testDb()
afterAll(() => pool.end())
beforeEach(() => reset(db))

describe('setari', () => {
  it('returns empty strings before anything was saved', async () => {
    expect(await citesteSetari(db)).toMatchObject({ id: 1, institutie: '', nume_comandant: '' })
  })

  it('creates the single row, then updates it in place', async () => {
    const prima = await salveazaSetari(db, setariSchema.parse({ institutie: 'Spital Test', nume_comandant: 'Ion Test', grad_comandant: 'Colonel' }))
    expect(prima).toMatchObject({ id: 1, institutie: 'Spital Test', nume_comandant: 'Ion Test', grad_comandant: 'Colonel', nume_dir_fin_con: '' })

    const a_doua = await salveazaSetari(db, setariSchema.parse({ institutie: 'Spital Nou', grad_dir_fin_con: 'Ec.', nume_dir_fin_con: 'Ana Test' }))
    expect(a_doua).toMatchObject({ id: 1, institutie: 'Spital Nou', grad_dir_fin_con: 'Ec.', nume_dir_fin_con: 'Ana Test', nume_comandant: '' })
    expect(await citesteSetari(db)).toMatchObject({ institutie: 'Spital Nou' })
  })

  it('requires the institution name and trims the text', () => {
    expect(setariSchema.safeParse({ institutie: '  ' }).success).toBe(false)
    expect(setariSchema.parse({ institutie: ' Spital ', nume_comandant: ' X ' })).toMatchObject({ institutie: 'Spital', nume_comandant: 'X' })
  })
})
