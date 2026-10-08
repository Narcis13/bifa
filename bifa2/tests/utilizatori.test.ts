import { eq } from 'drizzle-orm'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { utilizatorModificat, utilizatorNou } from '../shared/schemas/utilizatori'
import { adaugaUtilizator, gasesteUtilizator, listaUtilizatori, modificaUtilizator, stergeUtilizator } from '../server/services/utilizatori'
import { gestiuni, utilizatori } from '../server/database/schema'
import { seed, testDb } from './helpers'

const { db, pool } = testDb()
afterAll(() => pool.end())

const ADMIN = 1
const OPERATOR = 2
async function hash(id: number) {
  const [r] = await db.select({ password: utilizatori.password }).from(utilizatori).where(eq(utilizatori.id, id))
  return r?.password
}
const nou = { username: 'maria.test', passwordHash: 'hash', name: 'Maria Test', email: null, rol: 'operator', stare: 'activ' } as const

beforeEach(() => seed(db))

describe('utilizatori', () => {
  it('lists users without the password column', async () => {
    const lista = await listaUtilizatori(db)
    expect(lista.map(u => u.username)).toEqual(['admin.test', 'operator.test'])
    expect(lista.every(u => !('password' in u))).toBe(true)
  })

  it('adds a user and returns it without the password', async () => {
    const r = await adaugaUtilizator(db, nou)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.valoare).toMatchObject({ username: 'maria.test', name: 'Maria Test', rol: 'operator', stare: 'activ' })
    expect('password' in r.valoare).toBe(false)
  })

  it('refuses a duplicate username with 409', async () => {
    await adaugaUtilizator(db, nou)
    const r = await adaugaUtilizator(db, nou)
    expect(r).toEqual({ ok: false, status: 409, eroare: 'Acest nume de utilizator există deja.' })
  })

  it('edits name, role and state, and replaces the password hash only when given', async () => {
    const r = await modificaUtilizator(db, OPERATOR, { name: 'Nume Nou', email: 'op@exemplu.test', rol: 'admin', stare: 'inactiv', passwordHash: 'h2' }, ADMIN)
    expect(r.ok && r.valoare).toMatchObject({ name: 'Nume Nou', email: 'op@exemplu.test', rol: 'admin', stare: 'inactiv' })
    expect(await hash(OPERATOR)).toBe('h2')

    await modificaUtilizator(db, OPERATOR, { name: 'Alt Nume' }, ADMIN)
    expect(await hash(OPERATOR)).toBe('h2')
  })

  it('treats an empty change as a no-op and 404s on a missing user', async () => {
    const r = await modificaUtilizator(db, OPERATOR, {}, ADMIN)
    expect(r.ok && r.valoare.username).toBe('operator.test')
    expect(await modificaUtilizator(db, 999, { name: 'x' }, ADMIN)).toMatchObject({ ok: false, status: 404 })
  })

  it('does not let an admin deactivate or demote themselves', async () => {
    expect(await modificaUtilizator(db, ADMIN, { stare: 'inactiv' }, ADMIN)).toMatchObject({ ok: false, status: 400 })
    expect(await modificaUtilizator(db, ADMIN, { rol: 'operator' }, ADMIN)).toMatchObject({ ok: false, status: 400 })
    expect((await gasesteUtilizator(db, ADMIN))).toMatchObject({ rol: 'admin', stare: 'activ' })
    // harmless edits on one's own account are fine
    expect(await modificaUtilizator(db, ADMIN, { name: 'Eu', rol: 'admin', stare: 'activ' }, ADMIN)).toMatchObject({ ok: true })
  })

  it('does not let an admin delete themselves', async () => {
    expect(await stergeUtilizator(db, ADMIN, ADMIN)).toMatchObject({ ok: false, status: 400 })
    expect(await gasesteUtilizator(db, ADMIN)).toBeDefined()
  })

  it('refuses to delete a user referenced by a gestiune or a material', async () => {
    // operator.test (2) owns gestiune 1 and the materials; admin.test (1) owns gestiune 2
    expect(await stergeUtilizator(db, OPERATOR, ADMIN)).toMatchObject({ ok: false, status: 409 })
    const nouUser = await adaugaUtilizator(db, nou)
    if (!nouUser.ok) throw new Error('setup')
    expect(await stergeUtilizator(db, nouUser.valoare.id, OPERATOR)).toEqual({ ok: true, valoare: null })
    expect(await gasesteUtilizator(db, nouUser.valoare.id)).toBeUndefined()
    expect(await stergeUtilizator(db, 999, ADMIN)).toMatchObject({ ok: false, status: 404 })
  })

  it('refuses to delete a user that only owns a gestiune', async () => {
    const u = await adaugaUtilizator(db, { ...nou, username: 'gestionar.test' })
    if (!u.ok) throw new Error('setup')
    await db.update(gestiuni).set({ userid: u.valoare.id }).where(eq(gestiuni.id, 2))
    expect(await stergeUtilizator(db, u.valoare.id, ADMIN)).toMatchObject({ ok: false, status: 409 })
  })
})

describe('utilizatori schemas', () => {
  it('requires a username and a password of at least 6 characters', () => {
    expect(utilizatorNou.safeParse({ username: 'maria', password: '12345' }).success).toBe(false)
    expect(utilizatorNou.safeParse({ username: 'ma', password: '123456' }).success).toBe(false)
    const ok = utilizatorNou.parse({ username: ' maria ', password: '123456', email: '' })
    expect(ok).toMatchObject({ username: 'maria', email: null, rol: 'operator', stare: 'activ' })
  })

  it('rejects an invalid e-mail and keeps untouched fields undefined on update', () => {
    expect(utilizatorNou.safeParse({ username: 'maria', password: '123456', email: 'nu-e-email' }).success).toBe(false)
    const upd = utilizatorModificat.parse({ password: '', name: 'X' })
    expect(upd).toEqual({ name: 'X' })
    expect(utilizatorModificat.safeParse({ password: '123' }).success).toBe(false)
  })
})
