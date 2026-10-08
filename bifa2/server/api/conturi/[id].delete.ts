import { idParam } from '#shared/schemas/common'
import { stergeCont } from '../../services/conturi'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { id } = validParams(event, idParam)
  const r = await stergeCont(useDb(), id)
    .catch(e => conflictOnDuplicate(e, 'Contul nu poate fi șters.'))
  if (!r.ok) apiError(r.status, r.eroare)
  setResponseStatus(event, 204)
  return null
})
