import { spawnSync } from 'node:child_process'
import { ensureDatabase } from './lib/app-db'
import { env } from './lib/env'

const target = process.env.DB_TARGET ?? env.app
await ensureDatabase(target)
const r = spawnSync('pnpm', ['exec', 'drizzle-kit', 'migrate'], { stdio: 'inherit', shell: true, env: { ...process.env, DB_TARGET: target } })
process.exit(r.status ?? 1)
