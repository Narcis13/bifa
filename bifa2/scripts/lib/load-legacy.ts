import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { connect, env } from './env'

const ROOT = resolve(import.meta.dirname, '../../..')

/** Drops and recreates bifa_legacy from the two dump files, loaded as-is. */
export async function loadLegacy() {
  const admin = await connect(undefined, { multipleStatements: true })
  await admin.query(`DROP DATABASE IF EXISTS \`${env.legacy}\``)
  await admin.query(`CREATE DATABASE \`${env.legacy}\` CHARACTER SET latin1`)
  await admin.end()

  const conn = await connect(env.legacy, { multipleStatements: true })
  for (const file of ['bifa_structure.sql', 'bifa_data.sql']) {
    const sql = await readFile(resolve(ROOT, file), 'utf8')
    const t0 = Date.now()
    await conn.query(sql)
    console.log(`  ${file} încărcat în ${env.legacy} (${Date.now() - t0} ms)`)
  }
  await conn.end()
}
