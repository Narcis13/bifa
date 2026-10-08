import { categoriiQuery } from '#shared/schemas/categorii'
import { listaCategorii } from '../../services/categorii'

/** Documents read this per gestiune; without `idgestiune` (all gestiuni) it is admin-only. */
export default defineEventHandler(async (event) => {
  const q = validQuery(event, categoriiQuery)
  if (q.idgestiune) await requireGestiune(event, q.idgestiune)
  else await requireAdmin(event)
  return listaCategorii(useDb(), q)
})
