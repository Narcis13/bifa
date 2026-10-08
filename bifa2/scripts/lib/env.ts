import 'dotenv/config'
import mysql from 'mysql2/promise'

export const env = {
  host: process.env.MYSQL_HOST ?? '127.0.0.1',
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER ?? 'root',
  password: process.env.MYSQL_PASSWORD ?? '',
  legacy: process.env.DB_LEGACY ?? 'bifa_legacy',
  app: process.env.DB_APP ?? 'bifa2',
  test: process.env.DB_TEST ?? 'bifa2_test',
}

const OWNED = new Set([env.legacy, env.app, env.test])

/** Guard: scripts may only touch the databases this project owns. */
export function assertOwned(db: string) {
  if (!OWNED.has(db)) throw new Error(`Baza de date „${db}” nu aparține proiectului.`)
}

export async function connect(database?: string, extra: mysql.ConnectionOptions = {}) {
  if (database) assertOwned(database)
  return mysql.createConnection({
    host: env.host,
    port: env.port,
    user: env.user,
    password: env.password,
    database,
    charset: 'utf8mb4',
    dateStrings: true,
    decimalNumbers: false,
    supportBigNumbers: true,
    bigNumberStrings: true,
    ...extra,
  })
}
