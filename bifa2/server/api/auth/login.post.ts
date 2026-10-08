import { loginSchema } from '#shared/schemas/auth'
import { gasesteUtilizatorActiv } from '../../services/auth'
import { gestiuniAccesibile } from '../../services/gestiuni'

export default defineEventHandler(async (event) => {
  const { username, password } = await validBody(event, loginSchema)
  const db = useDb()
  const u = await gasesteUtilizatorActiv(db, username)
  if (!u || !(await verifyPassword(u.password, password))) apiError(401, 'Utilizator sau parolă greșită.')
  const user = { id: u.id, username: u.username, name: u.name, rol: u.rol }
  await replaceUserSession(event, { user, loggedInAt: new Date().toISOString() })
  return { user, gestiuni: await gestiuniAccesibile(db, user) }
})
