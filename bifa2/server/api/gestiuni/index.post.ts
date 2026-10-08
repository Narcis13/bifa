import { gestiuneNoua } from '#shared/schemas/gestiuni'
import { adaugaGestiune } from '../../services/gestiuni'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const input = await validBody(event, gestiuneNoua)
  const r = await adaugaGestiune(useDb(), input)
  if (!r.ok) apiError(r.status, r.eroare)
  setResponseStatus(event, 201)
  return r.valoare
})
