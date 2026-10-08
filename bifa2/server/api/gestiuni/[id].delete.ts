import { idParam } from '#shared/schemas/common'
import { stergeGestiune } from '../../services/gestiuni'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { id } = validParams(event, idParam)
  const r = await stergeGestiune(useDb(), id)
    .catch(e => conflictOnDuplicate(e, 'Gestiunea nu poate fi ștearsă.'))
  if (!r.ok) apiError(r.status, r.eroare)
  setResponseStatus(event, 204)
  return null
})
