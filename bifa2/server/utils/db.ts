import { drizzle } from 'drizzle-orm/mysql2'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from '../database/schema'

export interface DbConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
}

export type Db = MySql2Database<typeof schema>
/** A database handle or a transaction handle: services accept either. */
export type DbOrTx = Db | Parameters<Parameters<Db['transaction']>[0]>[0]

/** Creates the mysql2 pool and the Drizzle instance. The only place that connects to MySQL. */
export function createDb(config: DbConfig) {
  const pool = mysql.createPool({
    ...config,
    charset: 'utf8mb4',
    dateStrings: true,
    supportBigNumbers: true,
    bigNumberStrings: true,
    connectionLimit: 10,
    timezone: 'local',
  })
  const db: Db = drizzle(pool, { schema, mode: 'default' })
  return { db, pool }
}

let instance: ReturnType<typeof createDb> | undefined

/** App database, configured through runtimeConfig.mysql (NUXT_MYSQL_*). */
export function useDb(): Db {
  if (!instance) {
    const { mysql: cfg } = useRuntimeConfig()
    instance = createDb({ ...cfg, port: Number(cfg.port) })
  }
  return instance.db
}
