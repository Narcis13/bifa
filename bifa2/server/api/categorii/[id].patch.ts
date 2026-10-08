import { idParam } from '#shared/schemas/common'
import { categorieModificata } from '#shared/schemas/categorii'
import { modificaCategorie } from '../../services/categorii'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { id } = validParams(event, idParam)
  const input = await validBody(event, categorieModificata)
  const r = await modificaCategorie(useDb(), id, input)
  if (!r.ok) apiError(r.status, r.eroare)
  return r.valoare
})
