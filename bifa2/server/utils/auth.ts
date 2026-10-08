import type { H3Event } from 'h3'
import { gasesteUtilizatorDupaId } from '../services/auth'
import { gasesteGestiune, gestiuniAccesibile } from '../services/gestiuni'

/**
 * The logged-in user (401 when there is no session). Role and status are re-read from the
 * database once per request, so deactivating a user or changing their role applies immediately.
 */
export async function requireUser(event: H3Event) {
  if (event.context.utilizator) return event.context.utilizator as SessionUser
  const { user } = await getUserSession(event)
  const u = user ? await gasesteUtilizatorDupaId(useDb(), user.id) : undefined
  if (!u || u.stare !== 'activ') apiError(401, 'Trebuie să vă autentificați.')
  const fresh: SessionUser = { id: u.id, username: u.username, name: u.name, rol: u.rol }
  event.context.utilizator = fresh
  return fresh
}

type SessionUser = { id: number, username: string, name: string | null, rol: 'admin' | 'operator' }

/** 403 unless the user is an admin. */
export async function requireAdmin(event: H3Event) {
  const user = await requireUser(event)
  if (user.rol !== 'admin') apiError(403, 'Doar administratorii au acces la această secțiune.')
  return user
}

/**
 * 403 unless the user may work in this gestiune: admins in any existing gestiune (inactive ones
 * included, e.g. for reports), operators only in the active gestiuni assigned to them.
 */
export async function requireGestiune(event: H3Event, idgestiune: number) {
  const user = await requireUser(event)
  const allowed = user.rol === 'admin'
    ? !!(await gasesteGestiune(useDb(), idgestiune))
    : (await gestiuniAccesibile(useDb(), user)).some(g => g.id === idgestiune)
  if (!allowed) apiError(403, 'Nu aveți acces la această gestiune.')
  return user
}
