import { idParam } from '#shared/schemas/common'
import { dezactiveazaCategorie } from '../../services/categorii'

/** Like the legacy app, "delete" only deactivates the category. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { id } = validParams(event, idParam)
  const r = await dezactiveazaCategorie(useDb(), id)
  if (!r.ok) apiError(r.status, r.eroare)
  setResponseStatus(event, 204)
  return null
})
