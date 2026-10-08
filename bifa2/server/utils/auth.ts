import type { H3Event } from 'h3'
import { gestiuniAccesibile } from '../services/gestiuni'

/** The logged-in user (401 when there is no session). */
export async function requireUser(event: H3Event) {
  const { user } = await requireUserSession(event, { message: 'Trebuie să vă autentificați.' })
  return user
}

/** 403 unless the user is an admin. */
export async function requireAdmin(event: H3Event) {
  const user = await requireUser(event)
  if (user.rol !== 'admin') apiError(403, 'Doar administratorii au acces la această secțiune.')
  return user
}

/** 403 unless the user may work in this gestiune (admins: all; others: the ones assigned to them). */
export async function requireGestiune(event: H3Event, idgestiune: number) {
  const user = await requireUser(event)
  const allowed = await gestiuniAccesibile(useDb(), user)
  if (!allowed.some(g => g.id === idgestiune)) apiError(403, 'Nu aveți acces la această gestiune.')
  return user
}
