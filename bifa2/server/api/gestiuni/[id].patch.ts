import { idParam } from '#shared/schemas/common'
import { gestiuneModificata } from '#shared/schemas/gestiuni'
import { modificaGestiune } from '../../services/gestiuni'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { id } = validParams(event, idParam)
  const input = await validBody(event, gestiuneModificata)
  const r = await modificaGestiune(useDb(), id, input)
  if (!r.ok) apiError(r.status, r.eroare)
  return r.valoare
})
