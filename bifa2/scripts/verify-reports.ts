/**
 * pnpm verify:reports — runs the legacy report SQL against bifa_legacy and the app's report
 * services against bifa2, and requires identical numbers (to 0.01) for balanța analitică, lista de
 * inventariere and fișa de cont: every gestiune, three periods, tip material M, all categories,
 * places and states.
 *
 * The legacy SQL below is copied from nbifa-master/server/api/controllers/balante.js. The only
 * changes: the interpolated `${req.body.*}` values are bound parameters (`?`), the "all" filters
 * are bound to the values the legacy code interpolated for "*" (`>= 1`, `LIKE '%'`), and the
 * hard-coded `bifa.` schema prefix is dropped because the dump lives in bifa_legacy.
 * The JS post-processing of the legacy controllers (unit price of the inventory list, running
 * balance of the account card) is reproduced with exact decimals.
 */
import type { RowDataPacket } from 'mysql2/promise'
import { balantaAnalitica, fisaCont, listaInventariere } from '../server/services/rapoarte'
import { Dec } from '../shared/utils/decimal'
import { openAppDb } from './lib/app-db'
import { connect, env } from './lib/env'

// ---- legacy SQL (balante.js), parameterized -------------------------------------------------
const LEGACY_ANALITICA = `SELECT
m.denumire,
tranzactii.id_reper,
m.um um,
ifnull(sum(case when op.data < ? then tranzactii.cantitate_debit-tranzactii.cantitate_credit end),0) as stocinitial,
ifnull(sum(case when op.data >= ? and op.data <= ? then tranzactii.cantitate_debit end),0) ti,
ifnull(sum(case when op.data >= ? and op.data <= ? then tranzactii.cantitate_credit end),0) te,
ifnull(sum(case when op.data <= ? then tranzactii.cantitate_debit-tranzactii.cantitate_credit end),0) as stocfinal,
ifnull(sum(case when op.data < ? then tranzactii.debit-tranzactii.credit end),0) as valoarestocinitial,
ifnull(sum(case when op.data >= ? and op.data <= ? then tranzactii.debit end),0) vi,
ifnull(sum(case when op.data >= ? and op.data <= ? then tranzactii.credit end),0) ve,
ifnull(sum(case when op.data <= ? then tranzactii.debit-tranzactii.credit end),0) as valoarestoc
FROM tranzactii
inner join materiale m on m.id=id_reper
inner join operatiuni  op on op.id=tranzactii.idAntet
where tranzactii.stare_material LIKE ? and tranzactii.tip_material=?  and id_categ>=? and op.stare='ACTIV' and tranzactii.stare='ACTIV' and id_gestiune=? and id_locdispunere>=?
group by id_reper
having stocinitial>0 or stocfinal>0`

const LEGACY_LI = `SELECT
     m.denumire,
     tranzactii.id_reper,
     m.um um,
     g.gestionar gestionar,
     g.i_presedinte presedinte,
     g.i_membru1 membru1,
     g.i_membru2 membru2,
     ifnull(sum(case when op.data < ? then tranzactii.cantitate_debit-tranzactii.cantitate_credit end),0) as stocinitial,
     ifnull(sum(case when op.data >= ? and op.data <= ? then tranzactii.cantitate_debit end),0) ti,
     ifnull(sum(case when op.data >= ? and op.data <= ? then tranzactii.cantitate_credit end),0) te,
     ifnull(sum(case when op.data <= ? then tranzactii.cantitate_debit-tranzactii.cantitate_credit end),0) as stocfinal,
     ifnull(sum(case when op.data < ? then tranzactii.debit-tranzactii.credit end),0) as valoarestocinitial,
     ifnull(sum(case when op.data >= ? and op.data <= ? then tranzactii.debit end),0) vi,
     ifnull(sum(case when op.data >= ? and op.data <= ? then tranzactii.credit end),0) ve,
     ifnull(sum(case when op.data <= ? then tranzactii.debit-tranzactii.credit end),0) as valoarestoc
     FROM tranzactii
     inner join materiale m on m.id=id_reper
     inner join operatiuni  op on op.id=tranzactii.idAntet
     inner join gestiuni g on g.id = tranzactii.id_gestiune
     where tranzactii.stare_material LIKE ? and tranzactii.tip_material=?  and id_categ>=? and op.stare='ACTIV' and tranzactii.stare='ACTIV' and id_gestiune=? and id_locdispunere>=?
     group by id_reper
     having stocinitial>0 or stocfinal>0`

const LEGACY_FISA_SI = `
  SELECT
      m.denumire,
      tranzactii.id_reper,
      m.um um,
      ifnull(sum(case when op.data < ? then tranzactii.cantitate_debit-tranzactii.cantitate_credit end),0) as stocinitial,

      ifnull(sum(case when op.data < ? then tranzactii.debit-tranzactii.credit end),0) as valoarestocinitial

      FROM tranzactii
      inner join materiale m on m.id=id_reper
      inner join operatiuni  op on op.id=tranzactii.idAntet
      where id_reper=? and tranzactii.stare_material LIKE ? and tranzactii.tip_material=?  and id_categ>=? and op.stare='ACTIV' and tranzactii.stare='ACTIV' and id_gestiune=? and id_locdispunere>=?
      group by id_reper
  `

const LEGACY_FISA_TRANZACTII = `
      SELECT
          op.data,
          concat(op.tipoperatiune,op.nrdoc) as explicatii,
          tranzactii.um um,
          tranzactii.cantitate_debit,
          tranzactii.cantitate_credit,
          tranzactii.debit,
          tranzactii.credit
          FROM tranzactii
          inner join operatiuni  op on op.id=tranzactii.idAntet
          where op.data>=? and op.data<=? and id_reper=? and tranzactii.stare_material LIKE ? and tranzactii.tip_material=?  and id_categ>=? and op.stare='ACTIV' and tranzactii.stare='ACTIV' and id_gestiune=? and id_locdispunere>=?
`
// "all" filters as the legacy controller interpolated them for '*'
const STARI_TOATE = '%'
const CATEG_TOATE = 1
const LOCURI_TOATE = 1
const TIP = 'M'

const balantaParams = (di: string, ds: string, gest: number) =>
  [di, di, ds, di, ds, ds, di, di, ds, di, ds, ds, STARI_TOATE, TIP, CATEG_TOATE, gest, LOCURI_TOATE]

// ---- run ---------------------------------------------------------------------------------------
const today = new Date().toLocaleDateString('sv-SE')
const PERIOADE: [string, string][] = [['2024-01-01', '2024-12-31'], ['2025-01-01', '2025-12-31'], ['2026-01-01', today]]
const FIELDS = ['stocinitial', 'ti', 'te', 'stocfinal', 'valoarestocinitial', 'vi', 've', 'valoarestoc'] as const

const legacy = await connect(env.legacy)
const { db, pool } = openAppDb(env.app)
const q = async (sqlText: string, params: unknown[]) => (await legacy.query<RowDataPacket[]>(sqlText, params))[0]

let failures = 0
const errors: string[] = []
const fail = (msg: string) => {
  failures++
  if (errors.length < 50) errors.push(msg)
}
const same = (a: unknown, b: unknown) => Dec.near(Dec.from(String(a)), Dec.from(String(b)))

const gestiuni = (await q('SELECT id, denumire FROM gestiuni ORDER BY id', [])).map(g => ({ id: Number(g.id), denumire: String(g.denumire) }))
const summary: string[] = []

for (const g of gestiuni) {
  for (const [di, ds] of PERIOADE) {
    const filtru = { idgestiune: g.id, tipMaterial: TIP, datainceput: di, datasfarsit: ds } as const
    const tag = `gestiune #${g.id} ${di}..${ds}`

    // Balanța analitică
    const lBal = await q(LEGACY_ANALITICA, balantaParams(di, ds, g.id))
    const nBal = await balantaAnalitica(db, filtru)
    const nById = new Map(nBal.linii.map(l => [Number(l.id_reper), l]))
    if (lBal.length !== nBal.linii.length) fail(`${tag} balanță: ${lBal.length} linii legacy vs ${nBal.linii.length} bifa2`)
    const lTot = Object.fromEntries(FIELDS.map(k => [k, 0n])) as Record<(typeof FIELDS)[number], bigint>
    for (const l of lBal) {
      const n = nById.get(Number(l.id_reper))
      if (!n) {
        fail(`${tag} balanță: materialul #${l.id_reper} lipsește în bifa2`)
        continue
      }
      for (const k of FIELDS) {
        lTot[k] += Dec.from(String(l[k]))
        if (!same(l[k], n[k])) fail(`${tag} balanță #${l.id_reper} ${k}: ${l[k]} vs ${n[k]}`)
      }
    }
    for (const k of ['valoarestocinitial', 'vi', 've', 'valoarestoc'] as const) {
      if (!Dec.near(lTot[k], Dec.from(nBal.totaluri[k]))) fail(`${tag} balanță total ${k}: ${Dec.toFixed(lTot[k])} vs ${nBal.totaluri[k]}`)
    }

    // Lista de inventariere
    const lLi = await q(LEGACY_LI, balantaParams(di, ds, g.id))
    const nLi = await listaInventariere(db, filtru)
    const nLiById = new Map(nLi.linii.map(l => [Number(l.id_reper), l]))
    if (lLi.length !== nLi.linii.length) fail(`${tag} listă inventariere: ${lLi.length} linii legacy vs ${nLi.linii.length} bifa2`)
    for (const l of lLi) {
      const n = nLiById.get(Number(l.id_reper))
      if (!n) {
        fail(`${tag} listă inventariere: materialul #${l.id_reper} lipsește în bifa2`)
        continue
      }
      // legacy: pret = stocfinal.toFixed(2)==0 ? 0 : (valoarestoc/stocfinal).toFixed(2)
      const sf = Dec.from(String(l.stocfinal))
      const lPret = sf === 0n ? 0n : Dec.round(Dec.div(Dec.from(String(l.valoarestoc)), sf), 2)
      if (!Dec.near(lPret, Dec.from(n.pret))) fail(`${tag} listă inventariere #${l.id_reper} preț: ${Dec.toFixed(lPret, 2)} vs ${n.pret}`)
      for (const k of ['stocfinal', 'valoarestoc'] as const) {
        if (!same(l[k], n[k])) fail(`${tag} listă inventariere #${l.id_reper} ${k}: ${l[k]} vs ${n[k]}`)
      }
    }

    // Fișa de cont, for every material with movements of this type in the gestiune
    const materiale = await q('SELECT DISTINCT id_reper FROM tranzactii WHERE id_gestiune = ? AND tip_material = ? ORDER BY id_reper', [g.id, TIP])
    let fise = 0
    for (const { id_reper: idr } of materiale) {
      const idreper = Number(idr)
      const si = await q(LEGACY_FISA_SI, [di, di, idreper, STARI_TOATE, TIP, CATEG_TOATE, g.id, LOCURI_TOATE])
      if (!si.length) continue // legacy cannot render a card without matching lines
      const tr = await q(LEGACY_FISA_TRANZACTII, [di, ds, idreper, STARI_TOATE, TIP, CATEG_TOATE, g.id, LOCURI_TOATE])
      const n = await fisaCont(db, { ...filtru, idreper })
      fise++
      const t2 = `${tag} fișă #${idreper}`
      if (!same(si[0]!.stocinitial, n.soldInitial.cantitate) || !same(si[0]!.valoarestocinitial, n.soldInitial.valoare)) {
        fail(`${t2} sold inițial: ${si[0]!.stocinitial}/${si[0]!.valoarestocinitial} vs ${n.soldInitial.cantitate}/${n.soldInitial.valoare}`)
      }
      // legacy has no ORDER BY: compare the movements as a multiset
      const sig = (r: Record<string, unknown>) => [String(r.data).slice(0, 10), r.explicatii, r.um,
        Dec.toFixed(Dec.from(String(r.cantitate_debit)), 2), Dec.toFixed(Dec.from(String(r.cantitate_credit)), 2),
        Dec.toFixed(Dec.from(String(r.debit)), 4), Dec.toFixed(Dec.from(String(r.credit)), 4)].join('|')
      const lSig = tr.map(sig).sort()
      const nSig = n.linii.map(r => sig(r as unknown as Record<string, unknown>)).sort()
      if (lSig.join('\n') !== nSig.join('\n')) fail(`${t2}: mișcări diferite (${lSig.length} legacy vs ${nSig.length} bifa2)`)
      // legacy running balance: si + Σ(debit - credit)
      let qf = Dec.from(String(si[0]!.stocinitial))
      let vf = Dec.from(String(si[0]!.valoarestocinitial))
      for (const r of tr) {
        qf += Dec.from(String(r.cantitate_debit)) - Dec.from(String(r.cantitate_credit))
        vf += Dec.from(String(r.debit)) - Dec.from(String(r.credit))
      }
      if (!Dec.near(qf, Dec.from(n.soldFinal.cantitate)) || !Dec.near(vf, Dec.from(n.soldFinal.valoare))) {
        fail(`${t2} sold final: ${Dec.toFixed(qf, 2)}/${Dec.toFixed(vf, 2)} vs ${n.soldFinal.cantitate}/${n.soldFinal.valoare}`)
      }
    }
    summary.push(`  gestiune #${String(g.id).padEnd(3)} ${di}..${ds}: balanță ${String(lBal.length).padStart(4)} linii, total valoare finală ${Dec.toFixed(lTot.valoarestoc, 2).padStart(12)} = ${Dec.toFixed(Dec.from(nBal.totaluri.valoarestoc), 2).padStart(12)}; inventar ${String(lLi.length).padStart(4)} linii; ${fise} fișe de cont`)
  }
}

await legacy.end()
await pool.end()
console.log(summary.join('\n'))
if (failures) {
  console.log(`\nVERIFICARE EȘUATĂ: ${failures} diferențe. Primele:`)
  for (const e of errors) console.log(`  ✗ ${e}`)
  process.exit(1)
}
console.log(`\nVerificare reușită: rapoartele bifa2 sunt identice cu cele legacy (${gestiuni.length} gestiuni × ${PERIOADE.length} perioade).`)
