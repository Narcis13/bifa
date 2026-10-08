import { resolve } from 'node:path'
import { migrate } from 'drizzle-orm/mysql2/migrator'
import { createDb } from '../../server/utils/db'
import { assertOwned, connect, env } from './env'

export const MIGRATIONS = resolve(import.meta.dirname, '../../server/database/migrations')

/** Creates the database with a Romanian utf8mb4 collation; drops it first when `fresh`. */
export async function ensureDatabase(name: string, fresh = false) {
  assertOwned(name)
  const admin = await connect()
  if (fresh) await admin.query(`DROP DATABASE IF EXISTS \`${name}\``)
  await admin.query(`CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_ro_0900_ai_ci`)
  await admin.end()
}

export function openAppDb(name: string) {
  assertOwned(name)
  return createDb({ host: env.host, port: env.port, user: env.user, password: env.password, database: name })
}

/** Applies the committed drizzle-kit migrations (same files and journal as `drizzle-kit migrate`). */
export async function migrateDatabase(name: string) {
  const { db, pool } = openAppDb(name)
  await migrate(db, { migrationsFolder: MIGRATIONS })
  return { db, pool }
}
