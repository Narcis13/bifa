import { idParam } from '#shared/schemas/common'
import { utilizatorModificat } from '#shared/schemas/utilizatori'
import { modificaUtilizator } from '../../services/utilizatori'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const { id } = validParams(event, idParam)
  const { password, ...input } = await validBody(event, utilizatorModificat)
  const passwordHash = password ? await hashPassword(password) : undefined
  const r = await modificaUtilizator(useDb(), id, { ...input, passwordHash }, admin.id)
  if (!r.ok) apiError(r.status, r.eroare)
  return r.valoare
})
