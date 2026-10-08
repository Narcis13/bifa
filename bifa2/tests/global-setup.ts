import { ensureDatabase, migrateDatabase } from '../scripts/lib/app-db'
import { env } from '../scripts/lib/env'

/** Recreates bifa2_test and applies the migrations once per test run. */
export default async function setup() {
  await ensureDatabase(env.test, true)
  const { pool } = await migrateDatabase(env.test)
  await pool.end()
}
