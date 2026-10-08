import { gestiuniQuery } from '#shared/schemas/gestiuni'
import { listaGestiuni } from '../../services/gestiuni'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return listaGestiuni(useDb(), validQuery(event, gestiuniQuery))
})
