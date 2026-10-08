/**
 * pnpm db:dev-user — creates or resets a local admin account for development and visual checks
 * (username DEV_USER, default "demo.admin"; password DEV_USER_PASSWORD from .env). Local use only.
 */
import { Hash } from '@adonisjs/hash'
import { Scrypt } from '@adonisjs/hash/drivers/scrypt'
import { connect, env } from './lib/env'

const username = process.env.DEV_USER ?? 'demo.admin'
const password = process.env.DEV_USER_PASSWORD
if (!password || password.length < 12) throw new Error('Setați DEV_USER_PASSWORD (minim 12 caractere) în .env')

const hash = await new Hash(new Scrypt({})).make(password)
const c = await connect(env.app)
await c.query(`INSERT INTO utilizatori (username, password, name, rol, stare) VALUES (?, ?, 'Administrator demo', 'admin', 'activ')
  ON DUPLICATE KEY UPDATE password = VALUES(password), rol = 'admin', stare = 'activ'`, [username, hash])
await c.end()
console.log(`Utilizatorul de dezvoltare „${username}” este pregătit în ${env.app}.`)
