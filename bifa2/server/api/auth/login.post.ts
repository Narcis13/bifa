import { loginSchema } from '#shared/schemas/auth'
import { gasesteUtilizatorActiv } from '../../services/auth'
import { gestiuniAccesibile } from '../../services/gestiuni'

/** Hash checked when the username does not exist, so both cases take the same time. */
let hashFals: Promise<string> | undefined

export default defineEventHandler(async (event) => {
  const { username, password } = await validBody(event, loginSchema)
  const db = useDb()
  const u = await gasesteUtilizatorActiv(db, username)
  hashFals ??= hashPassword('parola-inexistenta')
  const ok = await verifyPassword(u?.password ?? await hashFals, password)
  if (!u || !ok) apiError(401, 'Utilizator sau parolă greșită.')
  const user = { id: u.id, username: u.username, name: u.name, rol: u.rol }
  await replaceUserSession(event, { user, loggedInAt: new Date().toISOString() })
  return { user, gestiuni: await gestiuniAccesibile(db, user) }
})
