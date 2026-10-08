import { idParam } from '#shared/schemas/common'
import { stergeUtilizator } from '../../services/utilizatori'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const { id } = validParams(event, idParam)
  const r = await stergeUtilizator(useDb(), id, admin.id)
    .catch(e => conflictOnDuplicate(e, 'Utilizatorul nu poate fi șters.'))
  if (!r.ok) apiError(r.status, r.eroare)
  setResponseStatus(event, 204)
  return null
})
