/**
 * Copies bifa_legacy into bifa2 through the Drizzle schema.
 *
 * Mapping legacy -> bifa2 (every rename and dropped column):
 * - all tables: `stare` free text -> enum('activ','inactiv'); created_at/updated_at everywhere.
 *   operatiuni/tranzactii: only a case-insensitive 'ACTIV' is active (the legacy SQL compares
 *   `stare='ACTIV'` under latin1_swedish_ci). Other tables: only 'inactiv' (any case) is inactive.
 * - utilizatori: password plaintext -> scrypt hash (nuxt-auth-utils format); rol: 'admin' stays
 *   admin, any other value -> 'operator'.
 * - gestiuni: a referenced but missing gestiune (deleted in legacy) is recreated, inactive.
 * - categorii: text columns `cont`/`contcheltuiala` dropped (duplicates of idcont/idcontchelt);
 *   tipmaterial 'OB. INV.' -> 'OB'; one placeholder category per gestiune for lines with a
 *   missing category (legacy id_categ = 0), flagged lipsa_import.
 * - materiale: datacreere/datamodificare -> created_at/updated_at.
 * - operatiuni: tipoperatiune dropped (always equals tipuridocumente.denumire_scurta);
 *   datacreere/datamodificare -> created_at/updated_at.
 * - tranzactii: datacreere/datamodificare -> created_at/updated_at; id_categ 0 -> placeholder.
 * - dropped tables: `user` (unused, old Flask hashes), `knex_migrations*`, `analitice` (only test
 *   rows; the app stores analytic accounts in `conturi` with tip 'N', as legacy did).
 * - new table: setari (seeded from nbifa-master/server/api/controllers/reports/config.json).
 */
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Hash } from '@adonisjs/hash'
import { Scrypt } from '@adonisjs/hash/drivers/scrypt'
import type { RowDataPacket } from 'mysql2/promise'
import type { Db } from '../../server/utils/db'
import * as s from '../../server/database/schema'
import { connect, env } from './env'

type Row = RowDataPacket & Record<string, string | number | null>

const NOW = new Date().toISOString().slice(0, 19).replace('T', ' ')
const CHUNK = 1000

export const PLACEHOLDER_GESTIUNE = 'Gestiune ștearsă (recreată la import)'
export const PLACEHOLDER_CATEGORIE = 'Categorie lipsă (import)'

const lower = (v: unknown) => String(v ?? '').trim().toLowerCase()
/** operatiuni / tranzactii: legacy SQL treats only 'ACTIV' (case-insensitive) as active. */
const stareStrict = (v: unknown) => (lower(v) === 'activ' ? 'activ' : 'inactiv') as 'activ' | 'inactiv'
/** other tables: legacy UI only hides rows explicitly marked inactive. */
const stareLax = (v: unknown) => (lower(v) === 'inactiv' ? 'inactiv' : 'activ') as 'activ' | 'inactiv'
const ts = (v: unknown, fallback = NOW) => (v ? String(v) : fallback)
const str = (v: unknown) => (v === null || v === undefined ? null : String(v))

export interface ImportReport {
  anomalies: string[]
  placeholders: { gestiuni: number[], categorii: { id: number, idgestiune: number, linii: number }[] }
}

async function insertChunks<T>(rows: T[], insert: (chunk: T[]) => Promise<unknown>) {
  for (let i = 0; i < rows.length; i += CHUNK) await insert(rows.slice(i, i + CHUNK))
}

export async function migrateData(db: Db): Promise<ImportReport> {
  const legacy = await connect(env.legacy)
  const q = async (sql: string) => (await legacy.query<Row[]>(sql))[0]
  const report: ImportReport = { anomalies: [], placeholders: { gestiuni: [], categorii: [] } }
  const note = (msg: string) => report.anomalies.push(msg)

  // utilizatori
  const hash = new Hash(new Scrypt({}))
  const users = await q('SELECT * FROM utilizatori ORDER BY id')
  const junkRoles = users.filter(u => lower(u.rol) !== 'admin').map(u => String(u.rol))
  note(`utilizatori: ${junkRoles.length} roluri diferite de „admin” (${[...new Set(junkRoles)].length} valori distincte) importate ca „operator”.`)
  const junkStare = users.filter(u => !['activ', 'inactiv'].includes(lower(u.stare))).length
  if (junkStare) note(`utilizatori: ${junkStare} valori „stare” nule sau invalide importate ca „activ” (aplicația veche nu verifica starea la autentificare).`)
  const userRows = []
  for (const u of users) {
    userRows.push({
      id: Number(u.id),
      username: String(u.username),
      password: await hash.make(String(u.password ?? '')),
      name: str(u.name),
      email: str(u.email),
      rol: (lower(u.rol) === 'admin' ? 'admin' : 'operator') as 'admin' | 'operator',
      stare: stareLax(u.stare),
      created_at: ts(u.created_at),
      updated_at: ts(u.updated_at, ts(u.created_at)),
    })
  }
  await db.insert(s.utilizatori).values(userRows)

  // gestiuni (+ recreate deleted ones that are still referenced)
  const gest = await q('SELECT * FROM gestiuni ORDER BY id')
  const gestIds = new Set(gest.map(g => Number(g.id)))
  const referenced = await q(`SELECT idgestiune id FROM operatiuni UNION SELECT idgestiune FROM materiale
    UNION SELECT idgestiune FROM categorii UNION SELECT id_gestiune FROM tranzactii`)
  const missing = referenced.map(r => Number(r.id)).filter(id => !gestIds.has(id)).sort((a, b) => a - b)
  await db.insert(s.gestiuni).values([
    ...gest.map(g => ({
      id: Number(g.id),
      denumire: String(g.denumire ?? ''),
      userid: g.userid === null ? null : Number(g.userid),
      gestionar: str(g.gestionar),
      r_presedinte: str(g.r_presedinte),
      r_membru1: str(g.r_membru1),
      r_membru2: str(g.r_membru2),
      r_membru3: str(g.r_membru3),
      i_presedinte: str(g.i_presedinte),
      i_membru1: str(g.i_membru1),
      i_membru2: str(g.i_membru2),
      i_membru3: str(g.i_membru3),
      stare: stareLax(g.stare),
      created_at: ts(g.created_at),
      updated_at: ts(g.updated_at, ts(g.created_at)),
    })),
    ...missing.map(id => ({ id, denumire: `${PLACEHOLDER_GESTIUNE} #${id}`, stare: 'inactiv' as const })),
  ])
  for (const id of missing) {
    note(`gestiuni: gestiunea #${id} lipsește din legacy dar e referită de documente/materiale/categorii; recreată inactivă „${PLACEHOLDER_GESTIUNE} #${id}”.`)
    report.placeholders.gestiuni.push(id)
  }

  // conturi
  const conturi = await q('SELECT * FROM conturi ORDER BY id')
  await insertChunks(conturi, chunk => db.insert(s.conturi).values(chunk.map(c => ({
    id: Number(c.id),
    cont: String(c.cont),
    tip: String(c.tip),
    denumire: String(c.denumire),
    sintetic: str(c.sintetic),
    nivel: Number(c.nivel),
  }))))

  // categorii (+ placeholders for missing references)
  const categ = await q('SELECT * FROM categorii ORDER BY id')
  const tipMat = (v: unknown) => {
    const t = String(v ?? '').toUpperCase()
    if (t === 'M' || t === 'MF') return t
    if (t.startsWith('OB')) return 'OB'
    return 'M'
  }
  const oddTip = categ.filter(c => !['M', 'OB', 'MF'].includes(String(c.tipmaterial)))
  if (oddTip.length) note(`categorii: ${oddTip.length} categorii cu tipmaterial nestandard (${[...new Set(oddTip.map(c => c.tipmaterial))].join(', ')}) normalizate la „OB”.`)
  const contText = await q(`SELECT COUNT(*) n FROM categorii c LEFT JOIN conturi k ON k.id = c.idcont
    WHERE c.cont IS NOT NULL AND (k.id IS NULL OR c.cont <> CONCAT(k.cont, ' ', k.denumire))`)
  if (Number(contText[0]!.n)) note(`categorii: ${contText[0]!.n} categorii au textul „cont” diferit de contul idcont (textul a fost eliminat; contul se citește din idcont).`)
  await db.insert(s.categorii).values(categ.map(c => ({
    id: Number(c.id),
    denumire: String(c.denumire ?? ''),
    idgestiune: Number(c.idgestiune),
    tipmaterial: tipMat(c.tipmaterial) as 'M' | 'OB' | 'MF',
    idcont: c.idcont === null ? null : Number(c.idcont),
    idcontchelt: c.idcontchelt === null ? null : Number(c.idcontchelt),
    info: str(c.info),
    stare: stareLax(c.stare),
    created_at: ts(c.created_at),
    updated_at: ts(c.updated_at, ts(c.created_at)),
  })))
  const orphan = await q(`SELECT t.id_gestiune g, t.id_categ c, COUNT(*) n FROM tranzactii t
    LEFT JOIN categorii k ON k.id = t.id_categ WHERE k.id IS NULL GROUP BY 1, 2 ORDER BY 1, 2`)
  const categMap = new Map<string, number>() // `${gestiune}:${legacyCateg}` -> new id
  let nextCateg = Math.max(...categ.map(c => Number(c.id))) + 1
  for (const o of orphan) {
    const id = nextCateg++
    categMap.set(`${o.g}:${o.c}`, id)
    await db.insert(s.categorii).values({
      id,
      denumire: PLACEHOLDER_CATEGORIE,
      idgestiune: Number(o.g),
      tipmaterial: 'M',
      lipsa_import: true,
      stare: 'activ',
      info: `Linii importate cu id_categ=${o.c}, categorie inexistentă în legacy`,
    })
    report.placeholders.categorii.push({ id, idgestiune: Number(o.g), linii: Number(o.n) })
    note(`categorii: ${o.n} linii din gestiunea #${o.g} referă categoria inexistentă #${o.c}; mutate în categoria nouă #${id} „${PLACEHOLDER_CATEGORIE}”.`)
  }

  // locuri
  const locuri = await q('SELECT * FROM locuri ORDER BY id')
  await db.insert(s.locuri).values(locuri.map(l => ({
    id: Number(l.id),
    denumire: String(l.denumire),
    stare: stareLax(l.stare),
    prioritate: l.prioritate === null ? 1 : Number(l.prioritate),
  })))

  // materiale
  const mat = await q('SELECT * FROM materiale ORDER BY id')
  await insertChunks(mat, chunk => db.insert(s.materiale).values(chunk.map(m => ({
    id: Number(m.id),
    denumire: String(m.denumire),
    um: String(m.um),
    pretpredefinit: String(m.pretpredefinit),
    idgestiune: Number(m.idgestiune),
    iduser: Number(m.iduser),
    cod_import: str(m.cod_import),
    stare: stareLax(m.stare),
    created_at: ts(m.datacreere),
    updated_at: ts(m.datamodificare, ts(m.datacreere)),
  }))))
  const dupMat = await q(`SELECT COUNT(*) n FROM (SELECT 1 FROM materiale WHERE stare = 'activ'
    GROUP BY idgestiune, denumire HAVING COUNT(*) > 1) x`)
  note(`materiale: ${dupMat[0]!.n} denumiri de materiale active duplicate în aceeași gestiune (importate ca atare; aplicația avertizează la adăugare).`)

  // tipuridocumente
  const tipuri = await q('SELECT * FROM tipuridocumente ORDER BY id')
  await db.insert(s.tipuridocumente).values(tipuri.map(t => ({
    id: Number(t.id),
    denumire: String(t.denumire),
    tip: String(t.tip) as 'i' | 'e' | 't',
    denumire_scurta: String(t.denumire_scurta),
    prioritate: t.prioritate === null ? null : Number(t.prioritate),
  })))

  // operatiuni
  const tipMismatch = await q(`SELECT COUNT(*) n FROM operatiuni o JOIN tipuridocumente d ON d.id = o.idtipoperatiuni
    WHERE BINARY o.tipoperatiune <> BINARY d.denumire_scurta`)
  if (Number(tipMismatch[0]!.n)) throw new Error(`operatiuni.tipoperatiune diferă de tipuridocumente.denumire_scurta în ${tipMismatch[0]!.n} rânduri; coloana nu poate fi eliminată.`)
  const ops = await q('SELECT * FROM operatiuni ORDER BY id')
  await insertChunks(ops, chunk => db.insert(s.operatiuni).values(chunk.map(o => ({
    id: Number(o.id),
    idtipoperatiuni: Number(o.idtipoperatiuni),
    data: String(o.data),
    nrdoc: String(o.nrdoc),
    idgestiune: Number(o.idgestiune),
    stare: stareStrict(o.stare),
    created_at: ts(o.datacreere),
    updated_at: ts(o.datamodificare, ts(o.datacreere)),
  }))))
  const oddDates = await q(`SELECT COUNT(*) n, SUM(stare = 'ACTIV') a FROM operatiuni WHERE data < '1990-01-01'`)
  if (Number(oddDates[0]!.n)) note(`operatiuni: ${oddDates[0]!.n} documente datate înainte de 1990 (ex. 1899-12-31; ${oddDates[0]!.a} active), importate ca atare: intră în soldul inițial al oricărei perioade.`)
  const empty = await q(`SELECT COUNT(*) n, SUM(o.stare = 'ACTIV') a FROM operatiuni o WHERE NOT EXISTS (SELECT 1 FROM tranzactii t WHERE t.idAntet = o.id)`)
  note(`operatiuni: ${empty[0]!.n} documente fără linii (${empty[0]!.a} active); erau invizibile în lista veche, acum apar în listă.`)
  const dupDocs = await q(`SELECT COUNT(*) n FROM (SELECT 1 FROM operatiuni WHERE stare = 'ACTIV'
    GROUP BY idgestiune, idtipoperatiuni, nrdoc, YEAR(data) HAVING COUNT(*) > 1) x`)
  note(`operatiuni: ${dupDocs[0]!.n} numere de document active duplicate (aceeași gestiune, tip și an); importate ca atare, aplicația avertizează.`)

  // tranzactii
  const gestMismatch = await q('SELECT COUNT(*) n FROM tranzactii t JOIN operatiuni o ON o.id = t.idAntet WHERE o.idgestiune <> t.id_gestiune')
  if (Number(gestMismatch[0]!.n)) note(`tranzactii: ${gestMismatch[0]!.n} linii cu id_gestiune diferit de gestiunea documentului (păstrate ca atare).`)
  const tr = await q('SELECT * FROM tranzactii ORDER BY id')
  const stariMat = new Set<string>(s.STARI_MATERIAL)
  await insertChunks(tr, chunk => db.insert(s.tranzactii).values(chunk.map((t) => {
    const sm = String(t.stare_material).toUpperCase()
    if (!stariMat.has(sm)) throw new Error(`tranzactii #${t.id}: stare_material necunoscută „${t.stare_material}”`)
    const categKey = `${t.id_gestiune}:${t.id_categ}`
    return {
      id: Number(t.id),
      idAntet: Number(t.idAntet),
      id_categ: categMap.get(categKey) ?? Number(t.id_categ),
      id_reper: Number(t.id_reper),
      id_gestiune: Number(t.id_gestiune),
      id_locdispunere: Number(t.id_locdispunere),
      um: String(t.um),
      cantitate_debit: String(t.cantitate_debit),
      cantitate_credit: String(t.cantitate_credit),
      pret: String(t.pret),
      debit: String(t.debit),
      credit: String(t.credit),
      stare_material: sm as 'NOU' | 'FOLOSIT' | 'CASARE',
      tip_material: (String(t.tip_material ?? 'M').toUpperCase()) as 'M' | 'OB' | 'MF',
      stare: stareStrict(t.stare),
      created_at: ts(t.datacreere),
      updated_at: ts(t.datamodificare, ts(t.datacreere)),
    }
  })))
  const qp = await q('SELECT COUNT(*) n FROM tranzactii WHERE ABS(debit + credit - ROUND((cantitate_debit + cantitate_credit) * pret, 4)) > 0.01')
  note(`tranzactii: ${qp[0]!.n} linii unde valoarea diferă de cantitate × preț cu peste 0,01 (valorile au fost păstrate exact).`)
  const umDiff = await q('SELECT COUNT(*) n FROM tranzactii t JOIN materiale m ON m.id = t.id_reper WHERE BINARY t.um <> BINARY m.um')
  note(`tranzactii: ${umDiff[0]!.n} linii au UM diferită de UM-ul curent al materialului (păstrată UM-ul de pe linie).`)
  const neg = await q(`SELECT COUNT(*) n FROM (SELECT SUM(t.cantitate_debit - t.cantitate_credit) q FROM tranzactii t
    JOIN operatiuni o ON o.id = t.idAntet WHERE o.stare = 'ACTIV' AND t.stare = 'ACTIV'
    GROUP BY t.id_gestiune, t.id_locdispunere, t.id_categ, t.id_reper, t.tip_material, t.stare_material HAVING q < 0) x`)
  note(`stocuri: ${neg[0]!.n} grupe (gestiune, loc, categorie, material, tip, stare) cu stoc negativ la zi (importate fidel).`)
  const residue = await q(`SELECT COUNT(*) n FROM (SELECT SUM(t.cantitate_debit - t.cantitate_credit) q, SUM(t.debit - t.credit) v FROM tranzactii t
    JOIN operatiuni o ON o.id = t.idAntet WHERE o.stare = 'ACTIV' AND t.stare = 'ACTIV'
    GROUP BY t.id_gestiune, t.id_locdispunere, t.id_categ, t.id_reper, t.tip_material, t.stare_material HAVING q = 0 AND v <> 0) x`)
  note(`stocuri: ${residue[0]!.n} grupe cu cantitate zero dar valoare nenulă (rest de rotunjire, importat fidel).`)
  const negSum = await q(`SELECT COUNT(*) n FROM operatiuni WHERE idgestiune NOT IN (SELECT id FROM gestiuni)`)
  if (Number(negSum[0]!.n)) note(`operatiuni: ${negSum[0]!.n} documente aparțin unei gestiuni șterse (vezi mai sus).`)

  // setari
  const cfg = JSON.parse(await readFile(resolve(import.meta.dirname, '../../../nbifa-master/server/api/controllers/reports/config.json'), 'utf8'))
  await db.insert(s.setari).values({
    id: 1,
    institutie: cfg.institutie,
    grad_dir_fin_con: cfg.grad_dir_fin_con,
    nume_dir_fin_con: cfg.nume_dir_fin_con,
    grad_comandant: cfg.grad_comandant,
    nume_comandant: cfg.nume_comandant,
  })

  await legacy.end()
  return report
}
